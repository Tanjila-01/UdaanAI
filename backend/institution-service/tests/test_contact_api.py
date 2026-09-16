import sys
import uuid
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Clear cached 'app' modules to ensure service isolation
for mod in list(sys.modules.keys()):
    if mod == 'app' or mod.startswith('app.'):
        del sys.modules[mod]

service_root = Path(__file__).resolve().parent.parent
if str(service_root) not in sys.path:
    sys.path.insert(0, str(service_root))

from app.core.config import settings
settings.DB_SCHEMA = ""
settings.JWT_SECRET_KEY = "test_institution_jwt_secret_key_32_bytes_long"
settings.JWT_ALGORITHM = "HS256"

from app.db.session import Base, get_db
from app.models.inquiry import GeneralInquiry
from app.services.inquiry_service import reset_rate_limits

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

import jwt
from datetime import datetime, timezone, timedelta


def make_jwt(user_id=None, role="admin"):
    sub = user_id if user_id is not None else str(uuid.uuid4())
    payload = {
        "sub": sub,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


@pytest.fixture(autouse=True)
def setup_teardown():
    reset_rate_limits()
    db = TestingSessionLocal()
    db.query(GeneralInquiry).delete()
    db.commit()
    db.close()
    yield
    reset_rate_limits()


def test_submit_valid_contact_inquiry():
    payload = {
        "name": "Kavitha Rao",
        "email": "kavitha.rao@example.com",
        "subject": "Question about PUC Science pathways",
        "message": "Hello, I wanted to understand the difference between PCMB and PCMC for engineering admissions.",
    }
    response = client.post("/contact", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "RECEIVED"
    assert "Your enquiry has been received" in data["message"]
    assert "created_at" in data

    # Verify persistence in DB
    db = TestingSessionLocal()
    saved = db.query(GeneralInquiry).filter_by(id=uuid.UUID(data["id"])).first()
    assert saved is not None
    assert saved.name == "Kavitha Rao"
    assert saved.email == "kavitha.rao@example.com"
    assert saved.subject == "Question about PUC Science pathways"
    assert saved.status == "NEW"
    db.close()


def test_contact_inquiry_invalid_name():
    # Name too short (<2 chars)
    payload = {
        "name": "A",
        "email": "valid@example.com",
        "subject": "Valid Subject",
        "message": "Valid message with more than 10 characters.",
    }
    response = client.post("/contact", json=payload)
    assert response.status_code == 422

    # Name too long (>100 chars)
    payload["name"] = "A" * 101
    response = client.post("/contact", json=payload)
    assert response.status_code == 422


def test_contact_inquiry_invalid_email():
    payload = {
        "name": "Valid Name",
        "email": "not-a-valid-email",
        "subject": "Valid Subject",
        "message": "Valid message with more than 10 characters.",
    }
    response = client.post("/contact", json=payload)
    assert response.status_code == 422


def test_contact_inquiry_invalid_subject():
    # Subject too short (<3 chars)
    payload = {
        "name": "Valid Name",
        "email": "valid@example.com",
        "subject": "Hi",
        "message": "Valid message with more than 10 characters.",
    }
    response = client.post("/contact", json=payload)
    assert response.status_code == 422

    # Subject too long (>150 chars)
    payload["subject"] = "S" * 151
    response = client.post("/contact", json=payload)
    assert response.status_code == 422


def test_contact_inquiry_invalid_message():
    # Message too short (<10 chars)
    payload = {
        "name": "Valid Name",
        "email": "valid@example.com",
        "subject": "Valid Subject",
        "message": "Short",
    }
    response = client.post("/contact", json=payload)
    assert response.status_code == 422

    # Message too long (>2000 chars)
    payload["message"] = "M" * 2001
    response = client.post("/contact", json=payload)
    assert response.status_code == 422


def test_contact_rate_limiting():
    payload = {
        "name": "Spam Tester",
        "email": "spammer@example.com",
        "subject": "Repeated inquiry",
        "message": "Sending this message repeatedly to test rate limiting.",
    }
    for i in range(5):
        res = client.post("/contact", json=payload)
        assert res.status_code == 201

    # 6th attempt should be blocked with 429
    res6 = client.post("/contact", json=payload)
    assert res6.status_code == 429
    assert "Too many contact submissions" in res6.json()["detail"]


def test_public_user_cannot_read_contact_inquiries():
    # Attempting to read inquiries without token returns 401
    response = client.get("/contact/admin")
    assert response.status_code in [401, 403]

    # Attempting with student role returns 403
    student_token = make_jwt(role="student")
    response_student = client.get("/contact/admin", headers={"Authorization": f"Bearer {student_token}"})
    assert response_student.status_code == 403


def test_admin_can_retrieve_inquiries():
    # Submit 2 inquiries
    client.post("/contact", json={
        "name": "User One",
        "email": "one@example.com",
        "subject": "First subject",
        "message": "First message with enough text.",
    })
    client.post("/contact", json={
        "name": "User Two",
        "email": "two@example.com",
        "subject": "Second subject",
        "message": "Second message with enough text.",
    })

    admin_token = make_jwt(role="admin")
    res = client.get("/contact/admin", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    inquiries = res.json()
    assert len(inquiries) >= 2
    assert inquiries[0]["name"] in ["User One", "User Two"]
