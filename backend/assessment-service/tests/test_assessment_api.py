import sys
from pathlib import Path
import uuid
import jwt
import pytest
from datetime import datetime, timezone
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


def create_test_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "email": "student@example.com",
        "role": "student",
        "type": "access",
        "exp": int(datetime.now(timezone.utc).timestamp()) + 3600
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_initial_assessment_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


def test_list_assessments():
    response = client.get("/assessments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["id"] == "karnataka-sslc-interest-v1"


def test_get_assessment_detail():
    response = client.get("/assessments/karnataka-sslc-interest-v1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "karnataka-sslc-interest-v1"
    assert len(data["questions"]) == 10
    assert len(data["questions"][0]["options"]) == 4


def test_start_attempt_unauthenticated():
    response = client.post("/assessments/karnataka-sslc-interest-v1/attempts")
    assert response.status_code == 401


def test_assessment_full_flow():
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Start Attempt
    resp = client.post("/assessments/karnataka-sslc-interest-v1/attempts", headers=headers)
    assert resp.status_code == 201
    attempt_data = resp.json()
    attempt_id = attempt_data["id"]
    assert attempt_data["status"] == "in_progress"

    # 2. Get Assessment Details
    detail_resp = client.get("/assessments/karnataka-sslc-interest-v1")
    questions = detail_resp.json()["questions"]

    # 3. Answer Questions (select Option A 'science' for questions)
    for q in questions:
        q_id = q["id"]
        opt_id = q["options"][0]["id"]  # Option A
        ans_resp = client.post(
            f"/assessments/attempts/{attempt_id}/answers",
            json={"question_id": q_id, "selected_option_id": opt_id},
            headers=headers
        )
        assert ans_resp.status_code == 200

    # 4. Attempt Ownership Protection: User 2 cannot complete User 1's attempt
    token_user2 = create_test_token(USER_2_ID)
    headers_user2 = {"Authorization": f"Bearer {token_user2}"}
    unauth_comp = client.post(f"/assessments/attempts/{attempt_id}/complete", headers=headers_user2)
    assert unauth_comp.status_code == 404

    # 5. Complete Attempt by User 1
    comp_resp = client.post(f"/assessments/attempts/{attempt_id}/complete", headers=headers)
    assert comp_resp.status_code == 200
    result_data = comp_resp.json()
    assert result_data["primary_stream_recommendation"] == "PUC Science"
    assert result_data["top_career_match"] == "AI & Software Application Engineer"
    assert "science" in result_data["dimension_scores"]

    # 6. Fetch Latest Result
    latest_resp = client.get("/assessments/my-latest-result", headers=headers)
    assert latest_resp.status_code == 200
    assert latest_resp.json()["primary_stream_recommendation"] == "PUC Science"
