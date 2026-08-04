import sys
import uuid
import jwt
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

for mod in list(sys.modules.keys()):
    if mod == 'app' or mod.startswith('app.'):
        del sys.modules[mod]

service_root = Path(__file__).resolve().parent.parent
if str(service_root) not in sys.path:
    sys.path.insert(0, str(service_root))

from app.core.config import settings
settings.DB_SCHEMA = ""
settings.JWT_SECRET_KEY = "test_secret_key"

from app.models.student_profile import StudentProfile
from app.db.session import Base, get_db

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


from app.main import app
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "email": f"{user_id}@test.com",
        "role": "student",
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def test_student_profile_full_flow():
    user1_id = str(uuid.uuid4())
    token1 = make_token(user1_id)

    user2_id = str(uuid.uuid4())
    token2 = make_token(user2_id)

    # 1. Unauthenticated request -> 401
    res_unauth = client.get("/students/profile/me")
    assert res_unauth.status_code == 401

    # 2. Get profile before creation -> 404
    res_404 = client.get("/students/profile/me", headers={"Authorization": f"Bearer {token1}"})
    assert res_404.status_code == 404

    # 3. Create profile for User 1
    profile_payload = {
        "full_name": "Student One",
        "current_level": "Class 10",
        "class_or_year": "10th Standard",
        "board": "Karnataka State Board (SSLC)",
        "institution_name": "Govt High School",
        "district": "Bengaluru Urban",
        "state": "Karnataka",
        "preferred_language": "Kannada"
    }
    res_create = client.post("/students/profile", json=profile_payload, headers={"Authorization": f"Bearer {token1}"})
    assert res_create.status_code == 201
    p1 = res_create.json()
    assert p1["user_id"] == user1_id
    assert p1["district"] == "Bengaluru Urban"
    assert p1["stream"] is None
    assert p1["diploma_branch"] is None
    assert p1["iti_trade"] is None
    assert p1["is_complete"] is True
    assert p1["completion_percentage"] == 100

    # 4. Get profile for User 1 -> 200
    res_get = client.get("/students/profile/me", headers={"Authorization": f"Bearer {token1}"})
    assert res_get.status_code == 200
    assert res_get.json()["user_id"] == user1_id

    # 5. User isolation: User 2 gets 404 for their own empty profile
    res_user2_get = client.get("/students/profile/me", headers={"Authorization": f"Bearer {token2}"})
    assert res_user2_get.status_code == 404

    # 6. Create PUC Science Profile for User 2 with stream
    puc_payload = {
        "full_name": "Student Two",
        "current_level": "PUC 2",
        "class_or_year": "2nd Year PUC",
        "board": "Karnataka Pre-University Education",
        "stream": "Science",
        "institution_name": "National College",
        "district": "Bengaluru Urban",
        "state": "Karnataka"
    }
    res_puc = client.post("/students/profile", json=puc_payload, headers={"Authorization": f"Bearer {token2}"})
    assert res_puc.status_code == 201
    assert res_puc.json()["stream"] == "Science"
    assert res_puc.json()["diploma_branch"] is None
    assert res_puc.json()["iti_trade"] is None

    # 7. Update profile for User 1
    res_update = client.put("/students/profile/me", json={"district": "Mysuru"}, headers={"Authorization": f"Bearer {token1}"})
    assert res_update.status_code == 200
    assert res_update.json()["district"] == "Mysuru"


def test_academic_field_normalization_and_transitions():
    user_id = str(uuid.uuid4())
    token = make_token(user_id)

    # 1. Create PUC 2 Commerce Profile
    puc_payload = {
        "full_name": "Tanjila B",
        "current_level": "PUC 2",
        "class_or_year": "2nd Year PUC",
        "board": "Karnataka Pre-University Education",
        "stream": "Commerce",
        "institution_name": "SVM",
        "district": "Vijayanagara",
        "state": "Karnataka"
    }
    res1 = client.post("/students/profile", json=puc_payload, headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 201
    p1 = res1.json()
    assert p1["current_level"] == "PUC 2"
    assert p1["stream"] == "Commerce"
    assert p1["diploma_branch"] is None
    assert p1["iti_trade"] is None

    # 2. Transition PUC 2 -> Class 10: Stream MUST be cleared (set to None) automatically
    update_to_class10 = {
        "current_level": "Class 10",
        "class_or_year": "10th Standard (SSLC)"
    }
    res2 = client.put("/students/profile/me", json=update_to_class10, headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 200
    p2 = res2.json()
    assert p2["current_level"] == "Class 10"
    assert p2["stream"] is None  # Verified cleared!
    assert p2["diploma_branch"] is None
    assert p2["iti_trade"] is None

    # 3. Transition Class 10 -> Diploma without diploma_branch -> HTTP 400 Bad Request
    res3_err = client.put("/students/profile/me", json={"current_level": "Diploma"}, headers={"Authorization": f"Bearer {token}"})
    assert res3_err.status_code == 400
    assert "Diploma branch is required" in res3_err.json()["detail"]

    # 4. Transition Class 10 -> Diploma WITH diploma_branch -> Success, stream remains None
    update_to_diploma = {
        "current_level": "Diploma",
        "diploma_branch": "Computer Science & Engineering"
    }
    res4 = client.put("/students/profile/me", json=update_to_diploma, headers={"Authorization": f"Bearer {token}"})
    assert res4.status_code == 200
    p4 = res4.json()
    assert p4["current_level"] == "Diploma"
    assert p4["diploma_branch"] == "Computer Science & Engineering"
    assert p4["stream"] is None
    assert p4["iti_trade"] is None

    # 5. Transition Diploma -> ITI without iti_trade -> HTTP 400 Bad Request
    res5_err = client.put("/students/profile/me", json={"current_level": "ITI"}, headers={"Authorization": f"Bearer {token}"})
    assert res5_err.status_code == 400
    assert "ITI trade is required" in res5_err.json()["detail"]

    # 6. Transition Diploma -> ITI WITH iti_trade -> Success, diploma_branch cleared!
    update_to_iti = {
        "current_level": "ITI",
        "iti_trade": "Electrician"
    }
    res6 = client.put("/students/profile/me", json=update_to_iti, headers={"Authorization": f"Bearer {token}"})
    assert res6.status_code == 200
    p6 = res6.json()
    assert p6["current_level"] == "ITI"
    assert p6["iti_trade"] == "Electrician"
    assert p6["diploma_branch"] is None  # Verified cleared!
    assert p6["stream"] is None
