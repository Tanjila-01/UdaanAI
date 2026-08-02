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
    assert p1["is_complete"] is True
    assert p1["completion_percentage"] == 100

    # 4. Get profile for User 1 -> 200
    res_get = client.get("/students/profile/me", headers={"Authorization": f"Bearer {token1}"})
    assert res_get.status_code == 200
    assert res_get.json()["user_id"] == user1_id

    # 5. User isolation: User 2 gets 404 for their own empty profile
    res_user2_get = client.get("/students/profile/me", headers={"Authorization": f"Bearer {token2}"})
    assert res_user2_get.status_code == 404

    # 6. Update profile for User 1
    res_update = client.put("/students/profile/me", json={"district": "Mysuru"}, headers={"Authorization": f"Bearer {token1}"})
    assert res_update.status_code == 200
    assert res_update.json()["district"] == "Mysuru"
