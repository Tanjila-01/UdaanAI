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


def test_auth_token_validation_boundaries():
    # Setup a registered active user
    reg_payload = {
        "full_name": "Boundary Test User",
        "email": "boundary@test.com",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res_reg = client.post("/auth/register", json=reg_payload)
    assert res_reg.status_code in (201, 400)

    login_res = client.post("/auth/login", json={
        "email": "boundary@test.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    tokens = login_res.json()
    valid_access = tokens["access_token"]
    valid_refresh = tokens["refresh_token"]

    # 1. Refresh token cannot access /auth/me -> 401 Invalid token type
    res_refresh_on_me = client.get("/auth/me", headers={"Authorization": f"Bearer {valid_refresh}"})
    assert res_refresh_on_me.status_code == 401
    assert "Invalid token type" in res_refresh_on_me.json()["detail"]

    # 2. Refresh token cannot access /auth/logout -> 401 Invalid token type
    res_refresh_on_logout = client.post("/auth/logout", headers={"Authorization": f"Bearer {valid_refresh}"})
    assert res_refresh_on_logout.status_code == 401
    assert "Invalid token type" in res_refresh_on_logout.json()["detail"]

    # 3. Access token cannot be used at /auth/refresh -> 401 Invalid token type
    res_access_on_refresh = client.post("/auth/refresh", json={"refresh_token": valid_access})
    assert res_access_on_refresh.status_code == 401
    assert "Invalid token type" in res_access_on_refresh.json()["detail"]

    # 4. Expired access token -> 401 Token has expired
    expired_access = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "boundary@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=5)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_expired = client.get("/auth/me", headers={"Authorization": f"Bearer {expired_access}"})
    assert res_expired.status_code == 401
    assert res_expired.json()["detail"] == "Token has expired"

    # 5. Invalid signature -> 401 Invalid token
    bad_sig_token = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "boundary@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        "wrong_secret_key_that_does_not_match_settings",
        algorithm=settings.JWT_ALGORITHM
    )
    res_bad_sig = client.get("/auth/me", headers={"Authorization": f"Bearer {bad_sig_token}"})
    assert res_bad_sig.status_code == 401
    assert res_bad_sig.json()["detail"] == "Invalid token"

    # 6. Missing exp claim -> 401 Invalid token
    no_exp_token = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "boundary@test.com",
            "role": "student",
            "type": "access"
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_no_exp = client.get("/auth/me", headers={"Authorization": f"Bearer {no_exp_token}"})
    assert res_no_exp.status_code == 401
    assert res_no_exp.json()["detail"] == "Invalid token"

    # 7. Missing sub claim -> 401 Invalid token
    no_sub_token = jwt.encode(
        {
            "email": "boundary@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_no_sub = client.get("/auth/me", headers={"Authorization": f"Bearer {no_sub_token}"})
    assert res_no_sub.status_code == 401
    assert res_no_sub.json()["detail"] == "Invalid token"

    # 8. Missing type claim -> 401 Invalid token
    no_type_token = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "boundary@test.com",
            "role": "student",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_no_type = client.get("/auth/me", headers={"Authorization": f"Bearer {no_type_token}"})
    assert res_no_type.status_code == 401
    assert res_no_type.json()["detail"] == "Invalid token"

    # 9. Malformed subject (non-UUID string) -> 401 Invalid user ID in token
    malformed_sub_token = jwt.encode(
        {
            "sub": "not-a-valid-uuid",
            "email": "boundary@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_malformed_sub = client.get("/auth/me", headers={"Authorization": f"Bearer {malformed_sub_token}"})
    assert res_malformed_sub.status_code == 401
    assert res_malformed_sub.json()["detail"] == "Invalid user ID in token"

    # 10. Empty subject -> 401 Invalid user ID in token
    empty_sub_token = jwt.encode(
        {
            "sub": "",
            "email": "boundary@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_empty_sub = client.get("/auth/me", headers={"Authorization": f"Bearer {empty_sub_token}"})
    assert res_empty_sub.status_code == 401
    assert res_empty_sub.json()["detail"] == "Invalid user ID in token"

    # 11. Refresh endpoint tests:
    # 11a. Expired refresh token -> 401
    expired_refresh = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "boundary@test.com",
            "role": "student",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) - timedelta(days=1)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_exp_ref = client.post("/auth/refresh", json={"refresh_token": expired_refresh})
    assert res_exp_ref.status_code == 401
    assert res_exp_ref.json()["detail"] == "Token has expired"

    # 11b. Refresh token with bad signature -> 401
    bad_sig_refresh = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "boundary@test.com",
            "role": "student",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(days=7)
        },
        "wrong_secret",
        algorithm=settings.JWT_ALGORITHM
    )
    res_bad_sig_ref = client.post("/auth/refresh", json={"refresh_token": bad_sig_refresh})
    assert res_bad_sig_ref.status_code == 401
    assert res_bad_sig_ref.json()["detail"] == "Invalid token"

    # 11c. Refresh token with malformed UUID subject -> 401
    malformed_sub_refresh = jwt.encode(
        {
            "sub": "not-a-uuid",
            "email": "boundary@test.com",
            "role": "student",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(days=7)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_malformed_ref = client.post("/auth/refresh", json={"refresh_token": malformed_sub_refresh})
    assert res_malformed_ref.status_code == 401
    assert res_malformed_ref.json()["detail"] == "Invalid user ID in token"

    # 11d. Refresh token with non-existent user UUID -> 401 User not found or inactive
    nonexistent_user_refresh = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "email": "ghost@test.com",
            "role": "student",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(days=7)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_ghost_ref = client.post("/auth/refresh", json={"refresh_token": nonexistent_user_refresh})
    assert res_ghost_ref.status_code == 401
    assert res_ghost_ref.json()["detail"] == "User not found or inactive"

    # 12. Malformed exp values (e.g., list, dict, non-numeric string) -> 401 Invalid token (never 500)
    for bad_exp in [[], {}, "not-a-number"]:
        bad_exp_token = jwt.encode(
            {
                "sub": str(uuid.uuid4()),
                "email": "boundary@test.com",
                "role": "student",
                "type": "access",
                "exp": bad_exp
            },
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        res_bad_exp = client.get("/auth/me", headers={"Authorization": f"Bearer {bad_exp_token}"})
        assert res_bad_exp.status_code == 401
        assert res_bad_exp.json()["detail"] == "Invalid token"

        bad_exp_ref = jwt.encode(
            {
                "sub": str(uuid.uuid4()),
                "email": "boundary@test.com",
                "role": "student",
                "type": "refresh",
                "exp": bad_exp
            },
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        res_bad_exp_ref = client.post("/auth/refresh", json={"refresh_token": bad_exp_ref})
        assert res_bad_exp_ref.status_code == 401
        assert res_bad_exp_ref.json()["detail"] == "Invalid token"
