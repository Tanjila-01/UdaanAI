import sys
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

from app.models.user import User
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


def test_auth_full_flow():
    # 1. Successful registration
    reg_payload = {
        "full_name": "Test Student",
        "email": "student@test.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res_reg = client.post("/auth/register", json=reg_payload)
    assert res_reg.status_code == 201
    reg_data = res_reg.json()
    assert reg_data["user"]["email"] == "student@test.com"
    assert reg_data["user"]["role"] == "student"

    # 2. Duplicate email rejection
    res_dup = client.post("/auth/register", json=reg_payload)
    assert res_dup.status_code == 400
    assert "already registered" in res_dup.json()["detail"]

    # 3. Short password rejection (< 8 characters)
    res_short_5 = client.post("/auth/register", json={
        "full_name": "Short Pass User",
        "email": "short5@test.com",
        "password": "12345",
        "confirm_password": "12345"
    })
    assert res_short_5.status_code == 422

    res_short_7 = client.post("/auth/register", json={
        "full_name": "Short Pass User 7",
        "email": "short7@test.com",
        "password": "1234567",
        "confirm_password": "1234567"
    })
    assert res_short_7.status_code == 422

    # 4. Mismatched password rejection
    res_mismatch = client.post("/auth/register", json={
        "full_name": "Test Student 2",
        "email": "student2@test.com",
        "password": "Password123!",
        "confirm_password": "Password999!"
    })
    assert res_mismatch.status_code == 400
    assert "Passwords do not match" in res_mismatch.json()["detail"]

    # 4. Invalid login password
    res_bad_login = client.post("/auth/login", json={
        "email": "student@test.com",
        "password": "WrongPassword!"
    })
    assert res_bad_login.status_code == 401

    # 5. Successful login
    res_login = client.post("/auth/login", json={
        "email": "student@test.com",
        "password": "Password123!"
    })
    assert res_login.status_code == 200
    login_data = res_login.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data
    access_token = login_data["access_token"]
    refresh_token = login_data["refresh_token"]

    # 6. Access /auth/me without token -> 401
    res_no_auth = client.get("/auth/me")
    assert res_no_auth.status_code == 401

    # 7. Access /auth/me with valid token -> 200
    res_me = client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["email"] == "student@test.com"
    assert me_data["role"] == "student"

    # 8. Token refresh
    res_refresh = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert res_refresh.status_code == 200
    assert "access_token" in res_refresh.json()

    # 9. Logout
    res_logout = client.post("/auth/logout", headers={"Authorization": f"Bearer {access_token}"})
    assert res_logout.status_code == 200
    assert "discard tokens" in res_logout.json()["message"]
