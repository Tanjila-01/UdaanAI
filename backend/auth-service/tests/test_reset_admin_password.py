import sys
from pathlib import Path
import pytest
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

service_root = Path(__file__).resolve().parent.parent
if str(service_root) not in sys.path:
    sys.path.insert(0, str(service_root))

from app.models.user import User
from app.db.session import Base
from app.core.security import hash_password, verify_password

User.__table__.schema = None

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)

from app.scripts.reset_admin_password import reset_admin_password, verify_authentication


@pytest.fixture(autouse=True)
def clean_db():
    db = TestingSessionLocal()
    db.query(User).delete()
    db.commit()
    db.close()


def test_reset_admin_password_validation_and_preservation():
    db = TestingSessionLocal()
    # Create an admin user and a student user
    admin_user = User(
        email="admin@udaan.ai",
        hashed_password=hash_password("OldPassword123!"),
        full_name="Udaan System Administrator",
        role="admin",
        is_active=True
    )
    student_user = User(
        email="student@udaan.ai",
        hashed_password=hash_password("StudentPassword123!"),
        full_name="Test Student",
        role="student",
        is_active=True
    )
    db.add(admin_user)
    db.add(student_user)
    db.commit()
    orig_admin_id = admin_user.id
    orig_student_hash = student_user.hashed_password
    db.close()

    with patch("app.scripts.reset_admin_password.SessionLocal", TestingSessionLocal):
        # 1. Rejects invalid email
        assert reset_admin_password("", "NewPassword123!") is False
        assert reset_admin_password("not-an-email", "NewPassword123!") is False

        # 2. Rejects passwords shorter than 8 chars
        assert reset_admin_password("admin@udaan.ai", "short") is False
        assert reset_admin_password("admin@udaan.ai", "") is False

        # 3. Fails if user not found
        assert reset_admin_password("nonexistent@udaan.ai", "NewPassword123!") is False

        # 4. Refuses if user role is not admin (preserves student account)
        assert reset_admin_password("student@udaan.ai", "NewPassword123!") is False

        # Verify student user was unaffected
        db = TestingSessionLocal()
        student_check = db.query(User).filter(User.email == "student@udaan.ai").first()
        assert student_check.hashed_password == orig_student_hash
        assert student_check.role == "student"
        db.close()

        # 5. Successfully resets admin password
        success = reset_admin_password("admin@udaan.ai", "NewSecurePassword456!")
        assert success is True

        # Verify admin data and role are preserved
        db = TestingSessionLocal()
        admin_check = db.query(User).filter(User.email == "admin@udaan.ai").first()
        assert admin_check.id == orig_admin_id
        assert admin_check.role == "admin"
        assert admin_check.full_name == "Udaan System Administrator"
        assert admin_check.is_active is True
        assert verify_password("NewSecurePassword456!", admin_check.hashed_password) is True
        assert verify_password("OldPassword123!", admin_check.hashed_password) is False
        db.close()


def test_verify_authentication_tokenless():
    db = TestingSessionLocal()
    admin_user = User(
        email="admin@udaan.ai",
        hashed_password=hash_password("VerifiedSecret123!"),
        full_name="Admin",
        role="admin",
        is_active=True
    )
    db.add(admin_user)
    db.commit()
    db.close()

    with patch("app.scripts.reset_admin_password.SessionLocal", TestingSessionLocal):
        # 1. In-service fallback verification
        assert verify_authentication("admin@udaan.ai", "VerifiedSecret123!", endpoints=[]) is True
        assert verify_authentication("admin@udaan.ai", "WrongPassword123!", endpoints=[]) is False

        # 2. HTTP endpoint verification (mocking urllib.request.urlopen)
        from unittest.mock import MagicMock
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.__enter__.return_value = mock_resp

        with patch("urllib.request.urlopen", return_value=mock_resp):
            assert verify_authentication("admin@udaan.ai", "VerifiedSecret123!", endpoints=["http://test-server/auth/login"]) is True

