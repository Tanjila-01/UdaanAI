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

# Clear cached 'app' modules to ensure service isolation when running full test suite
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
from app.models.workshop import WorkshopRequest, WorkshopSchedule

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


from typing import Optional


def make_jwt(user_id: Optional[str] = None, role: str = "admin") -> str:
    sub = user_id if user_id is not None else str(uuid.uuid4())
    payload = {
        "sub": sub,
        "email": f"{sub}@udaan.ai",
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


@pytest.fixture(autouse=True)
def clean_db():
    db = TestingSessionLocal()
    db.query(WorkshopSchedule).delete()
    db.query(WorkshopRequest).delete()
    db.commit()
    db.close()


def valid_payload():
    return {
        "institution_name": "Government Polytechnic Mysuru",
        "institution_type": "polytechnic",
        "contact_name": "Dr. Ramesh Gowda",
        "contact_phone": "+91 9876543210",
        "contact_email": "principal@gptmysuru.ac.in",
        "district": "Mysuru",
        "city": "Mysuru",
        "student_count": 250,
        "preferred_mode": "offline",
        "preferred_topics": ["career_guidance", "polytechnic_vs_puc"],
        "preferred_date": "2026-10-15",
        "message": "Auditorium capacity of 300 with projector available.",
    }


# ============================================================================
# 1. PUBLIC ENDPOINT & VALIDATION TESTS
# ============================================================================

def test_public_request_creation_success():
    payload = valid_payload()
    response = client.post("/workshops/requests", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "NEW"
    assert "created_at" in data
    # Verify no sensitive contact or operational data leaked in public response
    assert "contact_phone" not in data
    assert "contact_email" not in data
    assert "cancellation_reason" not in data


def test_public_request_invalid_institution_type():
    payload = valid_payload()
    payload["institution_type"] = "kindergarten"
    response = client.post("/workshops/requests", json=payload)
    assert response.status_code == 422


def test_public_request_invalid_district():
    payload = valid_payload()
    payload["district"] = "Mumbai"
    response = client.post("/workshops/requests", json=payload)
    assert response.status_code == 422


def test_public_request_invalid_mode():
    payload = valid_payload()
    payload["preferred_mode"] = "metaverse"
    response = client.post("/workshops/requests", json=payload)
    assert response.status_code == 422


def test_public_request_invalid_topics():
    payload = valid_payload()
    payload["preferred_topics"] = ["cooking"]
    response = client.post("/workshops/requests", json=payload)
    assert response.status_code == 422


def test_public_request_empty_topics():
    payload = valid_payload()
    payload["preferred_topics"] = []
    response = client.post("/workshops/requests", json=payload)
    assert response.status_code == 422


def test_public_request_invalid_email():
    payload = valid_payload()
    payload["contact_email"] = "notanemail"
    response = client.post("/workshops/requests", json=payload)
    assert response.status_code == 422


def test_public_request_invalid_student_count():
    payload = valid_payload()
    payload["student_count"] = 0
    response = client.post("/workshops/requests", json=payload)
    assert response.status_code == 422


# ============================================================================
# 2. RBAC & ADMIN SECURITY TESTS
# ============================================================================

def test_admin_endpoints_require_auth():
    # Overview requires auth
    res_overview = client.get("/workshops/admin/overview")
    assert res_overview.status_code == 401

    # List requests requires auth
    res_list = client.get("/workshops/admin/requests")
    assert res_list.status_code == 401


def test_admin_endpoints_reject_student_role():
    student_token = make_jwt(role="student")
    headers = {"Authorization": f"Bearer {student_token}"}

    res = client.get("/workshops/admin/overview", headers=headers)
    assert res.status_code == 403
    assert "Admin privileges required" in res.json()["detail"]


def test_admin_endpoints_accept_admin_role():
    admin_token = make_jwt(role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/workshops/admin/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert data["metrics"]["new_requests"] == 0


# ============================================================================
# 3. OPERATIONAL LIFECYCLE & SEMANTIC ACTIONS TESTS
# ============================================================================

def test_full_operational_lifecycle():
    admin_token = make_jwt(role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Submit public request
    create_res = client.post("/workshops/requests", json=valid_payload())
    assert create_res.status_code == 201
    req_id = create_res.json()["id"]

    # 2. Admin inspects list
    list_res = client.get("/workshops/admin/requests", headers=headers)
    assert list_res.status_code == 200
    requests = list_res.json()
    assert len(requests) == 1
    assert requests[0]["status"] == "NEW"
    assert requests[0]["contact_name"] == "Dr. Ramesh Gowda"

    # 3. Mark Contacted (NEW -> CONTACTED)
    contact_res = client.post(f"/workshops/admin/requests/{req_id}/contact", headers=headers)
    assert contact_res.status_code == 200
    assert contact_res.json()["status"] == "CONTACTED"

    # 4. Schedule Workshop (CONTACTED -> SCHEDULED)
    start_time = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    sched_payload = {
        "scheduled_start": start_time,
        "duration_minutes": 90,
        "mode": "offline",
        "venue_or_meeting_link": "Campus Auditorium, 2nd Floor",
        "assigned_facilitator": "Ananya Sharma",
        "internal_notes": "Projector tested, 2 cordless mics needed.",
    }
    sched_res = client.post(f"/workshops/admin/requests/{req_id}/schedule", json=sched_payload, headers=headers)
    assert sched_res.status_code == 200
    sched_data = sched_res.json()
    assert sched_data["status"] == "SCHEDULED"
    assert sched_data["schedule"] is not None
    assert sched_data["schedule"]["assigned_facilitator"] == "Ananya Sharma"

    # 5. Update Schedule
    update_payload = {
        "assigned_facilitator": "Prof. Ananya Sharma & Dr. Vivek",
        "venue_or_meeting_link": "Main Auditorium (Air Conditioned)",
    }
    update_res = client.patch(f"/workshops/admin/requests/{req_id}/schedule", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["schedule"]["assigned_facilitator"] == "Prof. Ananya Sharma & Dr. Vivek"

    # 6. Complete Workshop (SCHEDULED -> COMPLETED)
    complete_payload = {
        "actual_attendance": 235,
        "completion_notes": "High engagement, interactive Q&A session on polytechnic vs science.",
        "feedback_score": 4.8,
    }
    comp_res = client.post(f"/workshops/admin/requests/{req_id}/complete", json=complete_payload, headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["status"] == "COMPLETED"
    assert comp_data["schedule"]["actual_attendance"] == 235
    assert comp_data["schedule"]["feedback_score"] == 4.8
    assert comp_data["schedule"]["completed_at"] is not None


def test_illegal_lifecycle_transitions():
    admin_token = make_jwt(role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Submit request
    create_res = client.post("/workshops/requests", json=valid_payload())
    req_id = create_res.json()["id"]

    # Attempt to complete an unscheduled request -> 409 Conflict
    comp_res = client.post(
        f"/workshops/admin/requests/{req_id}/complete",
        json={"actual_attendance": 100},
        headers=headers,
    )
    assert comp_res.status_code == 409

    # Cancel request
    cancel_res = client.post(
        f"/workshops/admin/requests/{req_id}/cancel",
        json={"cancellation_reason": "Principal transferred; postponed indefinitely."},
        headers=headers,
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"
    assert cancel_res.json()["cancellation_reason"] == "Principal transferred; postponed indefinitely."

    # Cannot schedule a CANCELLED request -> 409 Conflict
    sched_res = client.post(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "scheduled_start": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "mode": "online",
            "venue_or_meeting_link": "https://meet.google.com/abc-defg-hij",
        },
        headers=headers,
    )
    assert sched_res.status_code == 409


def test_historical_records_preserved():
    admin_token = make_jwt(role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    create_res = client.post("/workshops/requests", json=valid_payload())
    req_id = create_res.json()["id"]

    client.post(
        f"/workshops/admin/requests/{req_id}/cancel",
        json={"cancellation_reason": "Test cancel"},
        headers=headers,
    )

    # Verify request still exists in DB
    detail_res = client.get(f"/workshops/admin/requests/{req_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["status"] == "CANCELLED"


def test_institution_token_validation_matrix():
    valid_uuid = str(uuid.uuid4())

    # 1. Missing Authorization header -> 401
    res_no_auth = client.get("/workshops/admin/overview")
    assert res_no_auth.status_code == 401
    assert "Missing or invalid Authorization header" in res_no_auth.json()["detail"]

    # 2. Refresh token rejected -> 401 Invalid token type (even if role is admin)
    refresh_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "admin@test.com",
            "role": "admin",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_ref = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {refresh_token}"})
    assert res_ref.status_code == 401
    assert "Invalid token type" in res_ref.json()["detail"]

    # 3. Expired token -> 401 Token has expired
    exp_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "admin@test.com",
            "role": "admin",
            "type": "access",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=5)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_exp = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {exp_token}"})
    assert res_exp.status_code == 401
    assert res_exp.json()["detail"] == "Token has expired"

    # 4. Invalid signature -> 401 Invalid token
    bad_sig_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "admin@test.com",
            "role": "admin",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        "wrong_secret_key",
        algorithm=settings.JWT_ALGORITHM
    )
    res_bad_sig = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {bad_sig_token}"})
    assert res_bad_sig.status_code == 401
    assert res_bad_sig.json()["detail"] == "Invalid token"

    # 5. Missing exp claim -> 401 Invalid token
    no_exp_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "admin@test.com",
            "role": "admin",
            "type": "access"
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_no_exp = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {no_exp_token}"})
    assert res_no_exp.status_code == 401
    assert res_no_exp.json()["detail"] == "Invalid token"

    # 6. Missing sub claim -> 401 Invalid token
    no_sub_token = jwt.encode(
        {
            "email": "admin@test.com",
            "role": "admin",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_no_sub = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {no_sub_token}"})
    assert res_no_sub.status_code == 401
    assert res_no_sub.json()["detail"] == "Invalid token"

    # 7. Missing type claim -> 401 Invalid token
    no_type_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "admin@test.com",
            "role": "admin",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_no_type = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {no_type_token}"})
    assert res_no_type.status_code == 401
    assert res_no_type.json()["detail"] == "Invalid token"

    # 8. Malformed subject (non-UUID string) -> 401 Invalid user ID in token (MUST NOT be 500)
    malformed_sub_token = jwt.encode(
        {
            "sub": "not-a-valid-uuid",
            "email": "admin@test.com",
            "role": "admin",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_malformed_sub = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {malformed_sub_token}"})
    assert res_malformed_sub.status_code == 401
    assert res_malformed_sub.json()["detail"] == "Invalid user ID in token"

    # 9. Empty subject -> 401 Invalid user ID in token (MUST NOT be 500)
    empty_sub_token = jwt.encode(
        {
            "sub": "",
            "email": "admin@test.com",
            "role": "admin",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_empty_sub = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {empty_sub_token}"})
    assert res_empty_sub.status_code == 401
    assert res_empty_sub.json()["detail"] == "Invalid user ID in token"

    # 10. Malformed exp values (list, dict, non-numeric) -> 401 Invalid token (never 500)
    for bad_exp in [[], {}, "not-a-number"]:
        bad_exp_token = jwt.encode(
            {
                "sub": valid_uuid,
                "email": "admin@test.com",
                "role": "admin",
                "type": "access",
                "exp": bad_exp
            },
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        res_bad_exp = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {bad_exp_token}"})
        assert res_bad_exp.status_code == 401
        assert res_bad_exp.json()["detail"] == "Invalid token"

    # 11. Identity checked BEFORE role: invalid token with non-admin role returns 401, not 403
    bad_token_student = jwt.encode(
        {
            "sub": "invalid-uuid",
            "email": "student@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_bad_token_student = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {bad_token_student}"})
    assert res_bad_token_student.status_code == 401
    assert res_bad_token_student.json()["detail"] == "Invalid user ID in token"

    # 12. Valid token with student role returns 403
    valid_student_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "student@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_valid_student = client.get("/workshops/admin/overview", headers={"Authorization": f"Bearer {valid_student_token}"})
    assert res_valid_student.status_code == 403
    assert "Admin privileges required" in res_valid_student.json()["detail"]
