import sys
from pathlib import Path
import uuid
import jwt
import pytest
import httpx
from datetime import datetime, timezone
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Clear cached 'app' modules to ensure service isolation when running full test suite
for mod in list(sys.modules.keys()):
    if mod == 'app' or mod.startswith('app.'):
        del sys.modules[mod]

service_root = Path(__file__).resolve().parent.parent
if str(service_root) not in sys.path:
    sys.path.insert(0, str(service_root))

from app.core.config import settings
settings.DB_SCHEMA = ""

from app.db.session import Base, get_db
from app.db.seed_assessments import seed_initial_assessment_data

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.main import app
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

USER_1_ID = str(uuid.uuid4())
USER_2_ID = str(uuid.uuid4())

# Global mock profile state to be modified dynamically in tests
CURRENT_MOCK_PROFILE = {
    "current_level": "Class 10",
    "stream": None,
    "is_complete": True,
    "id": str(uuid.uuid4())
}


def create_test_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "email": "student@example.com",
        "role": "student",
        "type": "access",
        "exp": int(datetime.now(timezone.utc).timestamp()) + 3600
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def mock_http_response(status_code: int, json_data: dict) -> httpx.Response:
    return httpx.Response(
        status_code,
        json=json_data,
        headers={"content-type": "application/json"}
    )


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_initial_assessment_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def mock_student_service_http():
    original_get = httpx.Client.get

    def mock_get(self, url, *args, **kwargs):
        url_str = str(url)
        if "profile/me" in url_str:
            if CURRENT_MOCK_PROFILE is None:
                return mock_http_response(404, {"detail": "Not Found"})
            return mock_http_response(200, CURRENT_MOCK_PROFILE)
        return original_get(self, url, *args, **kwargs)

    with patch("httpx.Client.get", new=mock_get):
        yield


def test_list_assessments():
    response = client.get("/assessments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 7
    # Verify we have the Class 10 assessment
    c10_assessment = next(x for x in data if x["id"] == "karnataka-class-10-pathway-exploration-v1")
    assert c10_assessment["target_level"] == "Class 10"


def test_get_assessment_detail():
    response = client.get("/assessments/karnataka-class-10-pathway-exploration-v1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "karnataka-class-10-pathway-exploration-v1"
    assert len(data["questions"]) == 10


def test_start_attempt_unauthenticated():
    response = client.post("/assessments/karnataka-class-10-pathway-exploration-v1/attempts")
    assert response.status_code == 401


def test_level_specific_routing_class89():
    global CURRENT_MOCK_PROFILE
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    CURRENT_MOCK_PROFILE = {
        "current_level": "Class 8",
        "stream": None,
        "is_complete": True
    }

    # Starting an attempt automatically should resolve to Foundation v2 assessment
    resp = client.post("/assessments/attempts", headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["assessment_id"] == "foundation-career-discovery-v2"


def test_level_specific_routing_puc_science():
    global CURRENT_MOCK_PROFILE
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    CURRENT_MOCK_PROFILE = {
        "current_level": "PUC 1",
        "stream": "Science",
        "is_complete": True
    }

    resp = client.post("/assessments/attempts", headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["assessment_id"] == "puc-science-direction-v2"


def test_level_specific_routing_diploma_iti():
    global CURRENT_MOCK_PROFILE
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    CURRENT_MOCK_PROFILE = {
        "current_level": "Diploma",
        "stream": None,
        "is_complete": True
    }

    resp = client.post("/assessments/attempts", headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["assessment_id"] == "diploma-direction-v2"


def test_validate_manual_start_mismatch_fails():
    global CURRENT_MOCK_PROFILE
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    CURRENT_MOCK_PROFILE = {
        "current_level": "ITI",
        "stream": None,
        "is_complete": True
    }

    # Manually starting Foundation when user is ITI should fail with 400
    resp = client.post("/assessments/foundation-career-discovery-v2/attempts", headers=headers)
    assert resp.status_code == 400
    assert "not appropriate for your level" in resp.json()["detail"]


def test_incomplete_profile_start_fails():
    global CURRENT_MOCK_PROFILE
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    CURRENT_MOCK_PROFILE = {
        "current_level": "Class 10",
        "stream": None,
        "is_complete": False
    }

    resp = client.post("/assessments/attempts", headers=headers)
    assert resp.status_code == 400
    assert "profile is incomplete" in resp.json()["detail"]


def test_completing_with_fewer_than_all_questions_fails():
    global CURRENT_MOCK_PROFILE
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    CURRENT_MOCK_PROFILE = {
        "current_level": "Class 10",
        "stream": None,
        "is_complete": True
    }

    # Start attempt
    resp = client.post("/assessments/attempts", headers=headers)
    assert resp.status_code == 201
    attempt_id = resp.json()["id"]

    # Answer only 1 question (out of 15 required for Foundation)
    detail_resp = client.get("/assessments/foundation-career-discovery-v2")
    questions = detail_resp.json()["questions"]
    q = questions[0]
    ans_resp = client.post(
        f"/assessments/attempts/{attempt_id}/answers",
        json={"question_id": q["id"], "selected_option_id": q["options"][0]["id"]},
        headers=headers
    )
    assert ans_resp.status_code == 200

    # Complete attempt (should fail because 1 < 15)
    comp_resp = client.post(f"/assessments/attempts/{attempt_id}/complete", headers=headers)
    assert comp_resp.status_code == 400
    assert "You have answered 1 out of 15" in comp_resp.json()["detail"]


def test_complete_assessment_full_flow():
    global CURRENT_MOCK_PROFILE
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    CURRENT_MOCK_PROFILE = {
        "current_level": "Class 10",
        "stream": None,
        "is_complete": True
    }

    # 1. Start Attempt (auto resolves to foundation-career-discovery-v2)
    resp = client.post("/assessments/attempts", headers=headers)
    assert resp.status_code == 201
    attempt_id = resp.json()["id"]

    # 2. Get details to get questions
    detail_resp = client.get("/assessments/foundation-career-discovery-v2")
    questions = detail_resp.json()["questions"]

    # 3. Submit answers to all 15 questions (select first option for all)
    for q in questions:
        client.post(
            f"/assessments/attempts/{attempt_id}/answers",
            json={"question_id": q["id"], "selected_option_id": q["options"][0]["id"]},
            headers=headers
        )

    # 4. Attempt Ownership Protection: User 2 cannot complete
    token_user2 = create_test_token(USER_2_ID)
    headers_user2 = {"Authorization": f"Bearer {token_user2}"}
    unauth_comp = client.post(f"/assessments/attempts/{attempt_id}/complete", headers=headers_user2)
    assert unauth_comp.status_code == 404

    # 5. Complete Attempt by User 1 (Succeeds)
    comp_resp = client.post(f"/assessments/attempts/{attempt_id}/complete", headers=headers)
    assert comp_resp.status_code == 200
    result_data = comp_resp.json()

    # Assert versions are saved and returned
    assert result_data["assessment_id"] == "foundation-career-discovery-v2"
    assert result_data["assessment_version"] == "v2"
    assert result_data["scoring_version"] == "rule-v2-foundation"

    # Assert dimension structure is consistent
    scores = result_data["dimension_scores"]
    for d in ["science", "commerce", "arts", "diploma", "iti"]:
        assert d in scores
        assert isinstance(scores[d], int)
        assert 0 <= scores[d] <= 100

    # 6. Idempotency test: calling complete again returns identical result
    comp_resp_2 = client.post(f"/assessments/attempts/{attempt_id}/complete", headers=headers)
    assert comp_resp_2.status_code == 200
    assert comp_resp_2.json()["id"] == result_data["id"]

    # 7. Constraint 2: Verify is_current is True when academic context matches
    latest_resp = client.get("/assessments/my-latest-result", headers=headers)
    assert latest_resp.status_code == 200
    assert latest_resp.json()["is_current"] is True

    # 8. When student transitions academic stage (e.g. to PUC Science), is_current becomes False
    CURRENT_MOCK_PROFILE = {
        "current_level": "PUC 1",
        "stream": "Science",
        "is_complete": True
    }
    latest_resp_after_transition = client.get("/assessments/my-latest-result", headers=headers)
    assert latest_resp_after_transition.status_code == 200
    assert latest_resp_after_transition.json()["is_current"] is False


def test_cannot_submit_to_unrelated_attempt():
    global CURRENT_MOCK_PROFILE
    token_user1 = create_test_token(USER_1_ID)
    headers_user1 = {"Authorization": f"Bearer {token_user1}"}
    token_user2 = create_test_token(USER_2_ID)
    headers_user2 = {"Authorization": f"Bearer {token_user2}"}

    CURRENT_MOCK_PROFILE = {
        "current_level": "Class 10",
        "stream": None,
        "is_complete": True
    }

    # User 1 starts attempt
    resp1 = client.post("/assessments/attempts", headers=headers_user1)
    attempt_id = resp1.json()["id"]

    # User 2 tries to answer User 1's attempt
    q_id = str(uuid.uuid4())
    opt_id = str(uuid.uuid4())
    ans_resp = client.post(
        f"/assessments/attempts/{attempt_id}/answers",
        json={"question_id": q_id, "selected_option_id": opt_id},
        headers=headers_user2
    )
    assert ans_resp.status_code == 404


def test_get_my_assessment_all_education_levels():
    global CURRENT_MOCK_PROFILE
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    test_cases = [
        ("Class 8", None, "foundation-career-discovery-v2"),
        ("Class 9", None, "foundation-career-discovery-v2"),
        ("Class 10", None, "foundation-career-discovery-v2"),
        ("PUC 1", "Science", "puc-science-direction-v2"),
        ("PUC 2", "Science", "puc-science-direction-v2"),
        ("PUC 1", "Commerce", "puc-commerce-direction-v2"),
        ("PUC 2", "Commerce", "puc-commerce-direction-v2"),
        ("PUC 1", "Arts", "puc-arts-direction-v2"),
        ("PUC 2", "Arts", "puc-arts-direction-v2"),
        ("Diploma", None, "diploma-direction-v2"),
        ("ITI", None, "iti-direction-v2"),
    ]

    for level, stream, expected_assessment_id in test_cases:
        CURRENT_MOCK_PROFILE = {
            "current_level": level,
            "stream": stream,
            "is_complete": True
        }
        resp = client.get("/assessments/my-assessment", headers=headers)
        assert resp.status_code == 200, f"Failed for level {level} stream {stream}: {resp.text}"
        data = resp.json()
        assert data["id"] == expected_assessment_id, f"Expected {expected_assessment_id} for {level}/{stream}, got {data['id']}"
        assert len(data["questions"]) == 15
