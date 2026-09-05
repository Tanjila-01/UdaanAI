import sys
from pathlib import Path
import uuid
import jwt
import pytest
import httpx
import json
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

# Global variables to configure mock HTTP responses dynamically in tests
MOCK_LATEST_RESULT = None
MOCK_PROFILE = None
MOCK_PATHWAYS = None


def create_test_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "email": "student@example.com",
        "role": "student",
        "type": "access",
        "exp": int(datetime.now(timezone.utc).timestamp()) + 3600
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def mock_http_response(status_code: int, json_data: any) -> httpx.Response:
    content = json.dumps(json_data).encode("utf-8")
    return httpx.Response(
        status_code,
        content=content,
        headers={"content-type": "application/json"}
    )


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def mock_external_services():
    original_get = httpx.Client.get

    def mock_get(self, url, *args, **kwargs):
        url_str = str(url)
        if "my-latest-result" in url_str:
            return mock_http_response(200, MOCK_LATEST_RESULT)
        elif "profile/me" in url_str:
            if MOCK_PROFILE is None:
                return mock_http_response(404, {"detail": "Not Found"})
            return mock_http_response(200, MOCK_PROFILE)
        elif "roadmaps/pathways" in url_str:
            return mock_http_response(200, MOCK_PATHWAYS)
        return original_get(self, url, *args, **kwargs)

    with patch("httpx.Client.get", new=mock_get):
        yield


def test_generate_unauthenticated_fails():
    resp = client.post("/career-intelligence/recommendations/generate")
    assert resp.status_code == 401


def test_generate_no_assessment_result_fails():
    global MOCK_LATEST_RESULT, MOCK_PROFILE, MOCK_PATHWAYS
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    # Return empty response (JSON null) for my-latest-result
    MOCK_LATEST_RESULT = None

    resp = client.post("/career-intelligence/recommendations/generate", headers=headers)
    assert resp.status_code == 400
    assert "completing an assessment first" in resp.json()["detail"]


def test_generate_and_get_my_recommendation_flow():
    global MOCK_LATEST_RESULT, MOCK_PROFILE, MOCK_PATHWAYS
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    MOCK_LATEST_RESULT = {
        "attempt_id": str(uuid.uuid4()),
        "assessment_id": "karnataka-class-10-pathway-exploration-v1",
        "scoring_version": "rule-v1",
        "dimension_scores": {
            "science": 82,     # High (rounds to 80)
            "commerce": 48,    # Explore (rounds to 50 -> Good)
            "arts": 12,        # Below threshold 25 (rounds to 10 -> Excluded!)
            "diploma": 67,     # Good (rounds to 65 -> Good)
            "iti": 20          # Below threshold 25 (rounds to 20 -> Excluded!)
        }
    }

    MOCK_PROFILE = {
        "current_level": "Class 10",
        "stream": None,
        "is_complete": True,
        "id": str(uuid.uuid4()),
        "user_id": USER_1_ID
    }

    # Include structured recommendation dimensions
    MOCK_PATHWAYS = {
        "pathways": [
            {
                "id": "c10-puc",
                "title": "Pre-University College (PUC)",
                "education_level": "Class 10",
                "stream": None,
                "recommendation_dimensions": ["science", "commerce", "arts"]
            },
            {
                "id": "c10-diploma",
                "title": "Polytechnic Diploma",
                "education_level": "Class 10",
                "stream": None,
                "recommendation_dimensions": ["diploma"]
            },
            {
                "id": "c10-iti",
                "title": "ITI Vocational Trades",
                "education_level": "Class 10",
                "stream": None,
                "recommendation_dimensions": ["iti"]
            }
        ]
    }

    # 1. Generate Recommendations
    resp = client.post("/career-intelligence/recommendations/generate", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["source_scoring_version"] == "rule-v1"
    assert "guaranteed outcomes" in data["disclaimer"]
    recs = data["recommendations"]

    # ITI score rounds to 20 (below threshold 25), so it is excluded!
    # Only c10-puc and c10-diploma qualify.
    assert len(recs) == 2

    # PUC: max(82, 48, 12) = 82 -> rounds to 80 (High)
    assert recs[0]["pathway_id"] == "c10-puc"
    assert recs[0]["match_score"] == 80
    assert recs[0]["match_label"] == "High"
    assert recs[0]["rank"] == 1

    # Diploma: 67 -> rounds to 65 (Good)
    assert recs[1]["pathway_id"] == "c10-diploma"
    assert recs[1]["match_score"] == 65
    assert recs[1]["match_label"] == "Good"
    assert recs[1]["rank"] == 2

    # 2. Get my recommendations
    get_resp = client.get("/career-intelligence/recommendations/me", headers=headers)
    assert get_resp.status_code == 200
    get_data = get_resp.json()
    assert len(get_data["recommendations"]) == 2
    assert get_data["recommendations"][0]["pathway_id"] == "c10-puc"


def test_generate_level_specific_filtering_and_warnings():
    global MOCK_LATEST_RESULT, MOCK_PROFILE, MOCK_PATHWAYS
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    MOCK_LATEST_RESULT = {
        "attempt_id": str(uuid.uuid4()),
        "assessment_id": "puc-science-direction-v2",
        "scoring_version": "rule-v2-puc-science",
        "dimension_scores": {
            "engineering": 90,
            "computing": 85,
            "medicine": 15,
            "allied_health": 15,
            "pure_sciences": 20
        }
    }

    MOCK_PROFILE = {
        "current_level": "PUC 1",
        "stream": "Science",
        "is_complete": True,
        "id": str(uuid.uuid4()),
        "user_id": USER_1_ID
    }

    # Candidates returned from roadmap-service
    MOCK_PATHWAYS = {
        "pathways": [
            {
                "id": "puc-science-eng",
                "title": "Engineering & Technology (B.E / B.Tech)",
                "education_level": "Undergraduate",
                "stream": "Science",
                "recommendation_dimensions": ["engineering"]
            },
            {
                "id": "puc-science-comp",
                "title": "Computer Applications & IT",
                "education_level": "Undergraduate",
                "stream": "Science",
                "recommendation_dimensions": ["computing"]
            },
            {
                "id": "puc-commerce-ca",
                "title": "Professional Accounting & Statutory Audit (CA / CS / CMA)",
                "education_level": "Undergraduate",
                "stream": "Commerce",
                "recommendation_dimensions": ["accounting_ca"]
            }
        ]
    }

    resp = client.post("/career-intelligence/recommendations/generate", headers=headers)
    assert resp.status_code == 200
    recs = resp.json()["recommendations"]

    # Commerce excluded due to stream mismatch.
    # PUC Science post-PUC pathways included since engineering=90 and computing=85 >= 25.
    assert len(recs) == 2
    rec_ids = [x["pathway_id"] for x in recs]
    assert "puc-science-eng" in rec_ids
    assert "puc-science-comp" in rec_ids
    assert "puc-commerce-ca" not in rec_ids


def test_mandatory_semantic_candidate_constraints():
    """
    Constraint 15:
    Class 10: must NOT receive deep PUC/Diploma/ITI family nodes as top-level recommendations.
    PUC Science: must NOT receive 'PUC Science Stream' as if choosing it for the first time.
    Diploma: must NOT receive 'Choose Polytechnic Diploma'.
    ITI: must NOT receive 'Choose ITI'.
    """
    # 1. Class 10 Candidate Scope Verification
    foundation_candidates = [
        "c10-puc", "c10-diploma", "c10-iti"
    ]
    assert set(foundation_candidates) == {"c10-puc", "c10-diploma", "c10-iti"}
    # Must NOT contain deep family nodes
    assert "puc-science-eng" not in foundation_candidates
    assert "dip-family-comp" not in foundation_candidates
    assert "iti-family-elec" not in foundation_candidates

    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}
    global MOCK_LATEST_RESULT, MOCK_PROFILE, MOCK_PATHWAYS

    # Test PUC Science candidate set
    MOCK_LATEST_RESULT = {
        "attempt_id": str(uuid.uuid4()),
        "assessment_id": "puc-science-direction-v2",
        "scoring_version": "rule-v2-puc-science",
        "dimension_scores": {"engineering": 80}
    }
    MOCK_PROFILE = {
        "current_level": "PUC 2",
        "stream": "Science",
        "is_complete": True,
        "id": str(uuid.uuid4()),
        "user_id": USER_1_ID
    }
    # If roadmap returns both post-puc and 'puc-science', PUC Science candidate scope excludes 'puc-science'
    MOCK_PATHWAYS = {
        "pathways": [
            {"id": "puc-science-eng", "title": "Engineering", "stream": "Science", "recommendation_dimensions": ["engineering"]},
            {"id": "puc-science", "title": "PUC Science Stream", "stream": "Science", "recommendation_dimensions": ["science"]}
        ]
    }
    resp_sci = client.post("/career-intelligence/recommendations/generate", headers=headers)
    assert resp_sci.status_code == 200
    sci_recs = resp_sci.json()["recommendations"]
    assert all(r["pathway_id"] != "puc-science" for r in sci_recs)

    # Test Diploma candidate set
    MOCK_LATEST_RESULT = {
        "attempt_id": str(uuid.uuid4()),
        "assessment_id": "diploma-direction-v2",
        "scoring_version": "rule-v2-diploma",
        "dimension_scores": {"software_digital": 85}
    }
    MOCK_PROFILE = {
        "current_level": "Diploma",
        "stream": None,
        "is_complete": True,
        "id": str(uuid.uuid4()),
        "user_id": USER_1_ID
    }
    MOCK_PATHWAYS = {
        "pathways": [
            {"id": "dip-family-comp", "title": "Computing & Digital Diploma", "stream": None, "recommendation_dimensions": ["software_digital"]},
            {"id": "c10-diploma", "title": "Polytechnic Diploma", "stream": None, "recommendation_dimensions": ["diploma"]}
        ]
    }
    resp_dip = client.post("/career-intelligence/recommendations/generate", headers=headers)
    assert resp_dip.status_code == 200
    dip_recs = resp_dip.json()["recommendations"]
    assert all(r["pathway_id"] != "c10-diploma" for r in dip_recs)

    # Test ITI candidate set
    MOCK_LATEST_RESULT = {
        "attempt_id": str(uuid.uuid4()),
        "assessment_id": "iti-direction-v2",
        "scoring_version": "rule-v2-iti",
        "dimension_scores": {"energy_electrical": 85}
    }
    MOCK_PROFILE = {
        "current_level": "ITI",
        "stream": None,
        "is_complete": True,
        "id": str(uuid.uuid4()),
        "user_id": USER_1_ID
    }
    MOCK_PATHWAYS = {
        "pathways": [
            {"id": "iti-family-elec", "title": "Electrical ITI Trade", "stream": None, "recommendation_dimensions": ["energy_electrical"]},
            {"id": "c10-iti", "title": "ITI Vocational Trades", "stream": None, "recommendation_dimensions": ["iti"]}
        ]
    }
    resp_iti = client.post("/career-intelligence/recommendations/generate", headers=headers)
    assert resp_iti.status_code == 200
    iti_recs = resp_iti.json()["recommendations"]
    assert all(r["pathway_id"] != "c10-iti" for r in iti_recs)


def test_recommendation_threshold_and_boundary_checks():
    global MOCK_LATEST_RESULT, MOCK_PROFILE, MOCK_PATHWAYS
    token = create_test_token(USER_1_ID)
    headers = {"Authorization": f"Bearer {token}"}

    # Set student scores such that:
    # - science: 23% (rounds to 25% -> included exactly on boundary)
    # - commerce: 22% (rounds to 20% -> excluded because < 25)
    # - arts: 80% (High -> rounds to 80)
    # - diploma: 70% (High -> rounds to 70)
    # - iti: 60% (Good -> rounds to 60)
    MOCK_LATEST_RESULT = {
        "attempt_id": str(uuid.uuid4()),
        "assessment_id": "karnataka-class-10-pathway-exploration-v1",
        "scoring_version": "rule-v1",
        "dimension_scores": {
            "science": 23,
            "commerce": 22,
            "arts": 80,
            "diploma": 70,
            "iti": 60
        }
    }

    MOCK_PROFILE = {
        "current_level": "Class 10",
        "stream": None,
        "is_complete": True,
        "id": str(uuid.uuid4()),
        "user_id": USER_1_ID
    }

    # Mock 6 pathways to test:
    # 1. c10-p1: arts (score 80 -> rounds to 80)
    # 2. c10-p2: diploma (score 70 -> rounds to 70)
    # 3. c10-p3: iti (score 60 -> rounds to 60)
    # 4. c10-p4: science (score 23 -> rounds to 25 -> boundary included!)
    # 5. c10-p5: commerce (score 22 -> rounds to 20 -> excluded < 25)
    # 6. c10-p6: unknown (missing recommendation_dimensions -> excluded)
    MOCK_PATHWAYS = {
        "pathways": [
            {"id": "c10-p1", "title": "Arts Path 1", "education_level": "Class 10", "recommendation_dimensions": ["arts"]},
            {"id": "c10-p2", "title": "Diploma Path 2", "education_level": "Class 10", "recommendation_dimensions": ["diploma"]},
            {"id": "c10-p3", "title": "ITI Path 3", "education_level": "Class 10", "recommendation_dimensions": ["iti"]},
            {"id": "c10-p4", "title": "Science Path 4", "education_level": "Class 10", "recommendation_dimensions": ["science"]},
            {"id": "c10-p5", "title": "Commerce Path 5", "education_level": "Class 10", "recommendation_dimensions": ["commerce"]},
            {"id": "c10-p6", "title": "Unknown Path 6", "education_level": "Class 10", "recommendation_dimensions": []}
        ]
    }

    resp = client.post("/career-intelligence/recommendations/generate", headers=headers)
    assert resp.status_code == 200
    recs = resp.json()["recommendations"]

    # Even though 4 pathways qualified (80, 70, 60, 25), the output is capped to TOP 3!
    assert len(recs) == 3
    assert recs[0]["pathway_id"] == "c10-p1"  # Score 80
    assert recs[1]["pathway_id"] == "c10-p2"  # Score 70
    assert recs[2]["pathway_id"] == "c10-p3"  # Score 60

    # Verify that if we only had the boundary and weak/missing items, only those boundary ones return
    MOCK_PATHWAYS = {
        "pathways": [
            {"id": "c10-p4", "title": "Science Path 4", "education_level": "Class 10", "recommendation_dimensions": ["science"]},
            {"id": "c10-p5", "title": "Commerce Path 5", "education_level": "Class 10", "recommendation_dimensions": ["commerce"]},
            {"id": "c10-p6", "title": "Unknown Path 6", "education_level": "Class 10", "recommendation_dimensions": []}
        ]
    }

    resp2 = client.post("/career-intelligence/recommendations/generate", headers=headers)
    assert resp2.status_code == 200
    recs2 = resp2.json()["recommendations"]

    # Only "c10-p4" has score 25 (>=25).
    # "c10-p5" has score 20 (excluded).
    # "c10-p6" has empty dimensions (excluded).
    assert len(recs2) == 1
    assert recs2[0]["pathway_id"] == "c10-p4"
    assert recs2[0]["match_score"] == 25
