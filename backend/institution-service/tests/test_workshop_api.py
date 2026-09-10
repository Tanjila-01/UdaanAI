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

from fastapi import HTTPException
from app.db.session import Base, get_db
from app.models.workshop import WorkshopRequest, WorkshopSchedule
from app.services.workshop_service import WorkshopService

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

    # 6. Premature Completion Rejection
    complete_payload = {
        "actual_attendance": 235,
        "completion_notes": "High engagement, interactive Q&A session on polytechnic vs science.",
        "feedback_score": 4.8,
    }
    comp_premature = client.post(f"/workshops/admin/requests/{req_id}/complete", json=complete_payload, headers=headers)
    assert comp_premature.status_code == 400
    assert "Cannot mark workshop as completed before its scheduled start time." in comp_premature.json()["detail"]

    # 7. Complete Workshop after scheduled start time (SCHEDULED -> COMPLETED)
    db = TestingSessionLocal()
    req_rec = db.query(WorkshopRequest).filter_by(id=uuid.UUID(req_id)).first()
    req_rec.schedule.scheduled_start = datetime.now(timezone.utc) - timedelta(minutes=30)
    db.commit()
    db.close()

    comp_res = client.post(f"/workshops/admin/requests/{req_id}/complete", json=complete_payload, headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["status"] == "COMPLETED"
    assert comp_data["schedule"]["actual_attendance"] == 235
    assert comp_data["schedule"]["feedback_score"] == 4.8
    assert comp_data["schedule"]["completed_at"] is not None
    assert comp_data["coordinator_feedback"] is not None
    assert comp_data["coordinator_feedback"]["feedback_token"] is not None
    assert comp_data["coordinator_feedback"]["submitted_at"] is None


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


# ============================================================================
# 5. WORKSHOP DATE VALIDATION & TIMEZONE HANDLING TESTS
# ============================================================================

def test_public_request_past_date_rejected():
    from zoneinfo import ZoneInfo
    today_kolkata = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    yesterday = today_kolkata - timedelta(days=1)

    payload = valid_payload()
    payload["preferred_date"] = yesterday.isoformat()
    response = client.post("/workshops/requests", json=payload)
    assert response.status_code == 422
    err_text = str(response.json())
    assert "Please choose today or a future date." in err_text


def test_public_request_today_and_future_date_accepted():
    from zoneinfo import ZoneInfo
    today_kolkata = datetime.now(ZoneInfo("Asia/Kolkata")).date()

    # 1. Today in Asia/Kolkata is accepted
    payload_today = valid_payload()
    payload_today["institution_name"] = "Today School"
    payload_today["contact_email"] = "today@school.edu"
    payload_today["preferred_date"] = today_kolkata.isoformat()
    res_today = client.post("/workshops/requests", json=payload_today)
    assert res_today.status_code == 201

    # 2. Future date is accepted
    payload_future = valid_payload()
    payload_future["institution_name"] = "Future School"
    payload_future["contact_email"] = "future@school.edu"
    payload_future["preferred_date"] = (today_kolkata + timedelta(days=45)).isoformat()
    res_future = client.post("/workshops/requests", json=payload_future)
    assert res_future.status_code == 201

    # 3. Omitted date is accepted
    payload_none = valid_payload()
    payload_none["institution_name"] = "Omitted Date School"
    payload_none["contact_email"] = "omitted@school.edu"
    payload_none["preferred_date"] = None
    res_none = client.post("/workshops/requests", json=payload_none)
    assert res_none.status_code == 201


def test_admin_schedule_past_time_and_naive_rejected():
    # Setup request to schedule
    payload = valid_payload()
    payload["institution_name"] = "Schedule Validation School"
    payload["contact_email"] = "sched@school.edu"
    res = client.post("/workshops/requests", json=payload)
    req_id = res.json()["id"]

    admin_token = make_jwt(role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Reject past start time
    past_utc = (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()
    res_past = client.post(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "scheduled_start": past_utc,
            "duration_minutes": 60,
            "mode": "offline",
            "venue_or_meeting_link": "Room 101",
        },
        headers=headers,
    )
    assert res_past.status_code in {400, 422}
    assert "Workshop scheduled start time cannot be in the past." in str(res_past.json())

    # 2. Reject ambiguous timezone-free timestamp (e.g. 2026-10-15T10:00:00 without offset or Z)
    res_naive = client.post(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "scheduled_start": "2026-11-15T10:00:00",
            "duration_minutes": 60,
            "mode": "offline",
            "venue_or_meeting_link": "Room 101",
        },
        headers=headers,
    )
    assert res_naive.status_code == 422
    assert "timezone-aware" in str(res_naive.json())

    # 3. Accept valid future timezone-aware timestamp
    future_utc = (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()
    res_valid = client.post(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "scheduled_start": future_utc,
            "duration_minutes": 60,
            "mode": "offline",
            "venue_or_meeting_link": "Room 101",
        },
        headers=headers,
    )
    assert res_valid.status_code == 200
    assert res_valid.json()["status"] == "SCHEDULED"


# ============================================================================
# 6. IDEMPOTENCY, DUPLICATE PREVENTION & CONCURRENCY TESTS
# ============================================================================

def test_submission_id_idempotent_network_retry():
    payload = valid_payload()
    payload["submission_id"] = "sub-idempotent-1"

    # Initial submission
    res1 = client.post("/workshops/requests", json=payload)
    assert res1.status_code == 201
    id1 = res1.json()["id"]

    # Retry of exact same submission with same submission_id
    res2 = client.post("/workshops/requests", json=payload)
    assert res2.status_code in {200, 201}
    assert res2.json()["id"] == id1

    # Verify only 1 database row exists
    db = TestingSessionLocal()
    count = db.query(WorkshopRequest).filter(WorkshopRequest.submission_id == "sub-idempotent-1").count()
    db.close()
    assert count == 1


def test_submission_id_changed_payload_conflict():
    payload1 = valid_payload()
    payload1["submission_id"] = "sub-conflict-test"
    payload1["student_count"] = 100

    res1 = client.post("/workshops/requests", json=payload1)
    assert res1.status_code == 201

    # Reusing submission_id with modified payload must return 409 conflict
    payload2 = valid_payload()
    payload2["submission_id"] = "sub-conflict-test"
    payload2["student_count"] = 350

    res2 = client.post("/workshops/requests", json=payload2)
    assert res2.status_code == 409
    assert "Submission ID conflict" in res2.json()["detail"]


def test_active_identical_request_rejected():
    payload = valid_payload()
    payload["institution_name"] = "National High School"
    payload["contact_email"] = "principal@national.edu"
    payload["district"] = "Bengaluru Urban"
    payload["preferred_topics"] = ["career_guidance", "ai_literacy"]

    res1 = client.post("/workshops/requests", json=payload)
    assert res1.status_code == 201

    # Attempt to submit identical active request (different submission_id or no submission_id)
    payload_dup = valid_payload()
    payload_dup["institution_name"] = " national high school "  # normalization check
    payload_dup["contact_email"] = "PRINCIPAL@national.edu "
    payload_dup["district"] = "Bengaluru Urban"
    payload_dup["preferred_topics"] = ["ai_literacy", "career_guidance"]  # sorted match
    payload_dup["submission_id"] = "different-submission-id"

    res2 = client.post("/workshops/requests", json=payload_dup)
    assert res2.status_code == 409
    assert res2.json()["detail"] == "This workshop request has already been submitted."
    # Ensure no previous requester data leaked
    assert "id" not in res2.json()
    assert "contact_phone" not in res2.json()


def test_distinct_institutions_same_preferred_date_allowed():
    payload1 = valid_payload()
    payload1["institution_name"] = "Institution Alpha"
    payload1["contact_email"] = "alpha@edu.in"
    payload1["preferred_date"] = "2026-11-20"
    res1 = client.post("/workshops/requests", json=payload1)
    assert res1.status_code == 201

    payload2 = valid_payload()
    payload2["institution_name"] = "Institution Beta"
    payload2["contact_email"] = "beta@edu.in"
    payload2["preferred_date"] = "2026-11-20"  # same date, different institution
    res2 = client.post("/workshops/requests", json=payload2)
    assert res2.status_code == 201


def test_same_institution_different_request_allowed():
    payload1 = valid_payload()
    payload1["institution_name"] = "St. Marys College"
    payload1["contact_email"] = "info@stmarys.edu"
    payload1["preferred_topics"] = ["career_guidance"]
    res1 = client.post("/workshops/requests", json=payload1)
    assert res1.status_code == 201

    # Same institution with different topic is allowed
    payload2 = valid_payload()
    payload2["institution_name"] = "St. Marys College"
    payload2["contact_email"] = "info@stmarys.edu"
    payload2["preferred_topics"] = ["future_skills"]
    res2 = client.post("/workshops/requests", json=payload2)
    assert res2.status_code == 201


def test_active_duplicate_allowed_after_cancellation():
    payload = valid_payload()
    payload["institution_name"] = "Resubmit College"
    payload["contact_email"] = "admin@resubmit.edu"
    res1 = client.post("/workshops/requests", json=payload)
    assert res1.status_code == 201
    req_id = res1.json()["id"]

    # Cancel first request
    admin_token = make_jwt(role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}
    client.post(
        f"/workshops/admin/requests/{req_id}/cancel",
        json={"cancellation_reason": "Date postponed to next academic term."},
        headers=headers,
    )

    # Re-submitting identical request is now allowed because previous request is terminal CANCELLED
    res2 = client.post("/workshops/requests", json=payload)
    assert res2.status_code == 201


def test_submission_id_integrity_race_handling(monkeypatch):
    payload = valid_payload()
    payload["submission_id"] = "race-sub-100"

    # First submission succeeds normally
    res1 = client.post("/workshops/requests", json=payload)
    assert res1.status_code == 201
    id1 = res1.json()["id"]

    # Now simulate concurrent race where another thread already committed:
    # We call create_public_request directly where db.commit raises IntegrityError
    db = TestingSessionLocal()
    from app.schemas.workshop import PublicWorkshopRequestCreate
    data = PublicWorkshopRequestCreate(**payload)

    orig_commit = db.commit
    def fail_commit_once():
        # Restore real commit before rollback in exception handler
        db.commit = orig_commit
        from sqlalchemy.exc import IntegrityError
        raise IntegrityError("mock race insert", {}, Exception("UNIQUE constraint failed"))

    db.commit = fail_commit_once
    recovered = WorkshopService.create_public_request(db, data)
    assert str(recovered.id) == id1
    db.close()


def test_active_duplicate_integrity_race_handling():
    payload1 = valid_payload()
    payload1["institution_name"] = "Race Active Dup Academy"
    payload1["contact_email"] = "race@academy.edu"
    payload1["submission_id"] = "sub-race-1"

    res1 = client.post("/workshops/requests", json=payload1)
    assert res1.status_code == 201

    # Simulate race where second request (with different submission_id) commits at same time
    payload2 = valid_payload()
    payload2["institution_name"] = "Race Active Dup Academy"
    payload2["contact_email"] = "race@academy.edu"
    payload2["submission_id"] = "sub-race-2"

    db = TestingSessionLocal()
    from app.schemas.workshop import PublicWorkshopRequestCreate
    data2 = PublicWorkshopRequestCreate(**payload2)

    orig_commit = db.commit
    def fail_commit_dup():
        db.commit = orig_commit
        from sqlalchemy.exc import IntegrityError
        raise IntegrityError("mock duplicate race", {}, Exception("UNIQUE constraint failed: active_duplicate_hash"))

    db.commit = fail_dup = fail_commit_dup
    with pytest.raises(HTTPException) as exc_info:
        WorkshopService.create_public_request(db, data2)
    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "This workshop request has already been submitted."
    db.close()


def test_update_schedule_clear_optional_fields_vs_omission():
    token = make_jwt()
    headers = {"Authorization": f"Bearer {token}"}

    payload = valid_payload()
    payload["institution_name"] = "Clear Optional College"
    payload["contact_email"] = "clear@optional.edu"
    create_res = client.post("/workshops/requests", json=payload)
    req_id = create_res.json()["id"]

    # Initial schedule with facilitator and internal_notes
    future_start = (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
    sched_res = client.post(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "scheduled_start": future_start,
            "duration_minutes": 90,
            "mode": "offline",
            "venue_or_meeting_link": "Room 101",
            "assigned_facilitator": "Prof. Smith",
            "internal_notes": "Initial internal note",
        },
        headers=headers,
    )
    assert sched_res.status_code == 200
    assert sched_res.json()["schedule"]["assigned_facilitator"] == "Prof. Smith"
    assert sched_res.json()["schedule"]["internal_notes"] == "Initial internal note"

    # 1. Update with omitted optional fields (e.g. only venue changed)
    patch_res1 = client.patch(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={"venue_or_meeting_link": "Room 102"},
        headers=headers,
    )
    assert patch_res1.status_code == 200
    assert patch_res1.json()["schedule"]["venue_or_meeting_link"] == "Room 102"
    # Preserved omitted fields
    assert patch_res1.json()["schedule"]["assigned_facilitator"] == "Prof. Smith"
    assert patch_res1.json()["schedule"]["internal_notes"] == "Initial internal note"

    # 2. Update with explicit null / blank to clear optional fields
    patch_res2 = client.patch(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "assigned_facilitator": None,
            "internal_notes": "   ",
        },
        headers=headers,
    )
    assert patch_res2.status_code == 200
    assert patch_res2.json()["schedule"]["assigned_facilitator"] is None
    assert patch_res2.json()["schedule"]["internal_notes"] is None

    # 3. Reject explicit null on required fields
    patch_bad_venue = client.patch(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={"venue_or_meeting_link": None},
        headers=headers,
    )
    assert patch_bad_venue.status_code == 400
    assert "Venue or meeting link is required" in patch_bad_venue.json()["detail"]

    patch_bad_mode = client.patch(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={"mode": None},
        headers=headers,
    )
    assert patch_bad_mode.status_code == 400
    assert "Mode is required" in patch_bad_mode.json()["detail"]

    patch_bad_start = client.patch(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={"scheduled_start": None},
        headers=headers,
    )
    assert patch_bad_start.status_code == 400
    assert "Scheduled start time is required" in patch_bad_start.json()["detail"]


def test_update_schedule_overdue_details_vs_past_rescheduling():
    token = make_jwt()
    headers = {"Authorization": f"Bearer {token}"}

    db = TestingSessionLocal()
    # Create request with overdue schedule in the past
    req_id = uuid.uuid4()
    past_start = datetime.now(timezone.utc) - timedelta(hours=4)
    req = WorkshopRequest(
        id=req_id,
        institution_name="Overdue Workshop College",
        institution_type="PU College",
        contact_name="Principal Past",
        contact_phone="9876543210",
        contact_email="past@overdue.edu",
        district="Bengaluru Urban",
        student_count=100,
        preferred_mode="offline",
        preferred_topics=["career_guidance"],
        status="SCHEDULED",
    )
    sched = WorkshopSchedule(
        request_id=req_id,
        scheduled_start=past_start,
        duration_minutes=90,
        mode="offline",
        venue_or_meeting_link="Old Hall",
        internal_notes="Started in past",
    )
    db.add(req)
    db.add(sched)
    db.commit()
    db.close()

    # 1. Details-only edit on overdue workshop (omitting scheduled_start) must succeed
    patch_res = client.patch(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "venue_or_meeting_link": "Auditorium Main",
            "internal_notes": "Updated post-commencement",
        },
        headers=headers,
    )
    assert patch_res.status_code == 200
    data = patch_res.json()["schedule"]
    assert data["venue_or_meeting_link"] == "Auditorium Main"
    assert data["internal_notes"] == "Updated post-commencement"
    # Historical start time is preserved unchanged
    assert data["scheduled_start"].startswith(past_start.strftime("%Y-%m-%d"))

    # 2. Attempting to reschedule to another past time must be rejected
    another_past = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
    patch_fail = client.patch(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={"scheduled_start": another_past},
        headers=headers,
    )
    assert patch_fail.status_code in {400, 422}
    assert "cannot be in the past" in patch_fail.text


def test_duplicate_check_matches_legacy_active_records():
    db = TestingSessionLocal()
    # Insert legacy active record with active_duplicate_hash = None
    legacy_id = uuid.uuid4()
    legacy_req = WorkshopRequest(
        id=legacy_id,
        institution_name="Legacy Active School",
        institution_type="high_school",
        contact_name="Headmaster",
        contact_phone="9876543210",
        contact_email="headmaster@legacy.edu",
        district="Mysuru",
        student_count=80,
        preferred_mode="offline",
        preferred_topics=["career_guidance", "polytechnic_vs_puc"],
        preferred_date=None,
        active_duplicate_hash=None,  # Pre-migration 002 legacy record
        status="NEW",
    )
    db.add(legacy_req)
    db.commit()
    db.close()

    # New request with identical normalized details matches legacy record
    dup_payload = {
        "institution_name": "  Legacy Active School  ",
        "institution_type": "high_school",
        "contact_name": "Headmaster Secondary",
        "contact_phone": "9876543210",
        "contact_email": "headmaster@legacy.edu",
        "district": "Mysuru",
        "student_count": 90,
        "preferred_mode": "offline",
        "preferred_topics": ["polytechnic_vs_puc", "career_guidance"],  # Permuted topic order
    }
    dup_res = client.post("/workshops/requests", json=dup_payload)
    assert dup_res.status_code == 409
    assert dup_res.json()["detail"] == "This workshop request has already been submitted."

    # Different topic does not collide
    diff_payload = dict(dup_payload)
    diff_payload["preferred_topics"] = ["future_skills"]
    diff_res = client.post("/workshops/requests", json=diff_payload)
    assert diff_res.status_code == 201

    # Mark legacy request COMPLETED
    token = make_jwt()
    headers = {"Authorization": f"Bearer {token}"}
    db2 = TestingSessionLocal()
    rec = db2.query(WorkshopRequest).filter_by(id=legacy_id).first()
    rec.status = "COMPLETED"
    db2.commit()
    db2.close()

    # Once legacy record is COMPLETED, identical request is permitted
    dup_res2 = client.post("/workshops/requests", json=dup_payload)
    assert dup_res2.status_code == 201


def test_premature_completion_rejected_and_completed_after_start():
    token = make_jwt()
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/workshops/requests", json=valid_payload())
    req_id = create_res.json()["id"]

    # Schedule for 2 hours in the future
    future_start = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    sched_res = client.post(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "scheduled_start": future_start,
            "duration_minutes": 60,
            "mode": "offline",
            "venue_or_meeting_link": "Room 201",
        },
        headers=headers,
    )
    assert sched_res.status_code == 200

    # Premature completion must be rejected with 400
    comp_fail = client.post(
        f"/workshops/admin/requests/{req_id}/complete",
        json={"actual_attendance": 100},
        headers=headers,
    )
    assert comp_fail.status_code == 400
    assert "Cannot mark workshop as completed before its scheduled start time." in comp_fail.json()["detail"]

    # Move schedule start to past in DB to simulate completion after workshop started
    db = TestingSessionLocal()
    rec = db.query(WorkshopRequest).filter_by(id=uuid.UUID(req_id)).first()
    rec.schedule.scheduled_start = datetime.now(timezone.utc) - timedelta(minutes=15)
    db.commit()
    db.close()

    # Now completion succeeds
    comp_success = client.post(
        f"/workshops/admin/requests/{req_id}/complete",
        json={"actual_attendance": 120},
        headers=headers,
    )
    assert comp_success.status_code == 200
    assert comp_success.json()["status"] == "COMPLETED"


def test_coordinator_feedback_public_context_privacy():
    token = make_jwt()
    headers = {"Authorization": f"Bearer {token}"}

    payload = valid_payload()
    payload["contact_name"] = "Private Coordinator"
    payload["contact_phone"] = "9988776655"
    payload["contact_email"] = "private@school.edu"
    create_res = client.post("/workshops/requests", json=payload)
    req_id = create_res.json()["id"]

    future_start = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    sched_res = client.post(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "scheduled_start": future_start,
            "duration_minutes": 60,
            "mode": "offline",
            "venue_or_meeting_link": "Auditorium A",
            "internal_notes": "Internal confidential admin notes about school funding",
        },
        headers=headers,
    )
    assert sched_res.status_code == 200

    # Move schedule to past in DB
    db = TestingSessionLocal()
    rec = db.query(WorkshopRequest).filter_by(id=uuid.UUID(req_id)).first()
    rec.schedule.scheduled_start = datetime.now(timezone.utc) - timedelta(hours=3)
    db.commit()
    db.close()

    comp_res = client.post(
        f"/workshops/admin/requests/{req_id}/complete",
        json={"actual_attendance": 80, "feedback_score": 4.5},
        headers=headers,
    )
    assert comp_res.status_code == 200
    fb_token = comp_res.json()["coordinator_feedback"]["feedback_token"]
    assert fb_token is not None

    # Public context access
    pub_res = client.get(f"/workshops/feedback/{fb_token}")
    assert pub_res.status_code == 200
    data = pub_res.json()
    assert data["institution_name"] == payload["institution_name"]
    assert data["mode"] == "offline"
    assert data["already_submitted"] is False
    assert data["submitted_at"] is None

    # CRITICAL: Verify coordinator contact details and internal notes are NEVER exposed in response
    pub_text = pub_res.text
    assert "Private Coordinator" not in pub_text
    assert "9988776655" not in pub_text
    assert "private@school.edu" not in pub_text
    assert "confidential" not in pub_text
    assert "funding" not in pub_text

    # Invalid token check
    inv_res = client.get("/workshops/feedback/non_existent_token_123")
    assert inv_res.status_code == 404
    assert "Invalid or expired feedback link." in inv_res.json()["detail"]


def test_coordinator_feedback_validation_and_duplicate_prevention():
    token = make_jwt()
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/workshops/requests", json=valid_payload())
    req_id = create_res.json()["id"]

    future_start = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    sched_res = client.post(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "scheduled_start": future_start,
            "mode": "online",
            "venue_or_meeting_link": "https://meet.google.com/abc",
        },
        headers=headers,
    )
    assert sched_res.status_code == 200

    # Move schedule to past in DB
    db = TestingSessionLocal()
    rec = db.query(WorkshopRequest).filter_by(id=uuid.UUID(req_id)).first()
    rec.schedule.scheduled_start = datetime.now(timezone.utc) - timedelta(hours=2)
    db.commit()
    db.close()

    comp_res = client.post(
        f"/workshops/admin/requests/{req_id}/complete",
        json={"actual_attendance": 50},
        headers=headers,
    )
    assert comp_res.status_code == 200
    fb_token = comp_res.json()["coordinator_feedback"]["feedback_token"]

    # 1. Validation: rating below 1
    res_low = client.post(f"/workshops/feedback/{fb_token}", json={"rating": 0})
    assert res_low.status_code in {400, 422}

    # 2. Validation: rating above 5
    res_high = client.post(f"/workshops/feedback/{fb_token}", json={"rating": 6})
    assert res_high.status_code in {400, 422}

    # 3. Validation: comments exceeding 1000 characters
    long_comments = "A" * 1001
    res_long = client.post(f"/workshops/feedback/{fb_token}", json={"rating": 5, "comments": long_comments})
    assert res_long.status_code in {400, 422}

    # 4. Valid initial submission
    res_valid = client.post(
        f"/workshops/feedback/{fb_token}",
        json={"rating": 5, "comments": "Excellent workshop for our students!"},
    )
    assert res_valid.status_code == 200
    assert "recorded" in res_valid.json()["message"]

    # 5. Duplicate submission prevention (atomic rejection)
    res_dup = client.post(
        f"/workshops/feedback/{fb_token}",
        json={"rating": 4, "comments": "Second attempt to submit"},
    )
    assert res_dup.status_code == 409
    assert "Feedback has already been submitted for this workshop." in res_dup.json()["detail"]

    # Public context now reflects already_submitted = True
    context_res = client.get(f"/workshops/feedback/{fb_token}")
    assert context_res.status_code == 200
    assert context_res.json()["already_submitted"] is True
    assert context_res.json()["submitted_at"] is not None


def test_coordinator_feedback_separation_from_admin_score():
    token = make_jwt()
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/workshops/requests", json=valid_payload())
    req_id = create_res.json()["id"]

    future_start = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    sched_res = client.post(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={
            "scheduled_start": future_start,
            "mode": "offline",
            "venue_or_meeting_link": "Campus Hall",
        },
        headers=headers,
    )
    assert sched_res.status_code == 200

    # Move schedule to past in DB
    db = TestingSessionLocal()
    rec = db.query(WorkshopRequest).filter_by(id=uuid.UUID(req_id)).first()
    rec.schedule.scheduled_start = datetime.now(timezone.utc) - timedelta(hours=5)
    db.commit()
    db.close()

    # Admin enters feedback_score = 3.5 upon completion
    comp_res = client.post(
        f"/workshops/admin/requests/{req_id}/complete",
        json={"actual_attendance": 65, "feedback_score": 3.5},
        headers=headers,
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["schedule"]["feedback_score"] == 3.5
    # Coordinator feedback is separate and currently Awaiting (rating is None, submitted_at is None)
    coord_fb = comp_res.json()["coordinator_feedback"]
    assert coord_fb["rating"] is None
    assert coord_fb["submitted_at"] is None
    fb_token = coord_fb["feedback_token"]

    # Coordinator submits a rating of 5
    sub_res = client.post(
        f"/workshops/feedback/{fb_token}",
        json={"rating": 5, "comments": "Coordinator loved it"},
    )
    assert sub_res.status_code == 200

    # Admin inspects completed workshop request
    admin_get = client.get(f"/workshops/admin/requests", headers=headers)
    assert admin_get.status_code == 200
    req_item = next(r for r in admin_get.json() if r["id"] == req_id)
    # Admin score remains 3.5
    assert req_item["schedule"]["feedback_score"] == 3.5
    # Coordinator feedback is 5 and recorded separately
    assert req_item["coordinator_feedback"]["rating"] == 5
    assert req_item["coordinator_feedback"]["comments"] == "Coordinator loved it"
    assert req_item["coordinator_feedback"]["submitted_at"] is not None


def test_admin_feedback_link_endpoint():
    token = make_jwt()
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post("/workshops/requests", json=valid_payload())
    req_id = create_res.json()["id"]

    # Cannot get feedback link for non-completed workshop (currently NEW)
    link_fail = client.get(f"/workshops/admin/requests/{req_id}/feedback-link", headers=headers)
    assert link_fail.status_code == 400
    assert "only available for completed workshops" in link_fail.json()["detail"]

    # Schedule and Complete
    future_start = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    sched_res = client.post(
        f"/workshops/admin/requests/{req_id}/schedule",
        json={"scheduled_start": future_start, "mode": "offline", "venue_or_meeting_link": "Hall 1"},
        headers=headers,
    )
    assert sched_res.status_code == 200

    db = TestingSessionLocal()
    rec = db.query(WorkshopRequest).filter_by(id=uuid.UUID(req_id)).first()
    rec.schedule.scheduled_start = datetime.now(timezone.utc) - timedelta(hours=2)
    db.commit()
    db.close()

    comp_res = client.post(
        f"/workshops/admin/requests/{req_id}/complete",
        json={"actual_attendance": 40},
        headers=headers,
    )
    assert comp_res.status_code == 200

    # Now admin can copy feedback link
    link_res = client.get(f"/workshops/admin/requests/{req_id}/feedback-link", headers=headers)
    assert link_res.status_code == 200
    data = link_res.json()
    assert data["request_id"] == req_id
    assert data["feedback_token"] is not None
    assert data["feedback_url"].startswith("/workshops/feedback/")


