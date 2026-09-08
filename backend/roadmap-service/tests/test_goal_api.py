import sys
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Clear cached 'app' modules
for mod in list(sys.modules.keys()):
    if mod == 'app' or mod.startswith('app.'):
        del sys.modules[mod]

service_root = Path(__file__).resolve().parent.parent
if str(service_root) not in sys.path:
    sys.path.insert(0, str(service_root))

from app.core.config import settings
settings.DB_SCHEMA = ""

from app.db.session import Base, get_db
from app.services.roadmap_service import RoadmapService

import tempfile
import os

_temp_db_file = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
_temp_db_file.close()
_temp_db_path = _temp_db_file.name.replace("\\", "/")

test_engine = create_engine(
    f"sqlite:///{_temp_db_path}",
    connect_args={"check_same_thread": False, "timeout": 30},
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
TEST_STUDENT_ID = str(uuid.uuid4())


def get_test_token(student_id=TEST_STUDENT_ID):
    payload = {
        "sub": student_id,
        "email": "student@test.com",
        "role": "student",
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    RoadmapService.seed_initial_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


def test_unauthenticated_goal_requests():
    res_post = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"})
    assert res_post.status_code == 401

    res_get = client.get("/roadmaps/goals/me")
    assert res_get.status_code == 401


def test_get_active_goal_when_none_exists():
    token = get_test_token()
    res = client.get("/roadmaps/goals/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json() is None


def test_create_and_manage_student_goal_flow():
    token = get_test_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Goal with invalid pathway -> 404
    res_bad = client.post("/roadmaps/goals", json={"pathway_id": "invalid-pathway"}, headers=headers)
    assert res_bad.status_code == 404

    # 2. Create Goal with valid pathway 'c10-puc'
    res_create = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    assert res_create.status_code == 201
    data = res_create.json()
    assert data["student_id"] == TEST_STUDENT_ID
    assert data["pathway_id"] == "c10-puc"
    assert data["status"] == "ACTIVE"
    assert data["progress"]["completed"] == 0
    assert len(data["milestones"]) > 0

    # Milestone 1 should be AVAILABLE, remaining LOCKED
    assert data["milestones"][0]["status"] == "AVAILABLE"
    for ms in data["milestones"][1:]:
        assert ms["status"] == "LOCKED"

    m1_id = data["milestones"][0]["id"]
    m2_id = data["milestones"][1]["id"]

    # 3. Retrieve Goal via GET /roadmaps/goals/me
    res_me = client.get("/roadmaps/goals/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["id"] == data["id"]

    # 4. Attempt to complete locked milestone 2 -> 400
    res_locked = client.patch(f"/roadmaps/goals/me/milestones/{m2_id}", headers=headers)
    assert res_locked.status_code == 400

    # 5. Complete available milestone 1 -> 200
    res_m1 = client.patch(f"/roadmaps/goals/me/milestones/{m1_id}", headers=headers)
    assert res_m1.status_code == 200
    data_m1 = res_m1.json()
    assert data_m1["progress"]["completed"] == 1
    assert data_m1["milestones"][0]["status"] == "COMPLETED"
    assert data_m1["milestones"][1]["status"] == "AVAILABLE"  # Milestone 2 is unlocked!

    # 6. Complete milestone 2
    res_m2 = client.patch(f"/roadmaps/goals/me/milestones/{m2_id}", headers=headers)
    assert res_m2.status_code == 200
    data_m2 = res_m2.json()
    assert data_m2["progress"]["completed"] == 2
    assert data_m2["milestones"][1]["status"] == "COMPLETED"


def test_goal_replacement_archives_previous_goal():
    token = get_test_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Create first goal
    res1 = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    assert res1.status_code == 201
    goal1_id = res1.json()["id"]

    # Create second goal (replaces first)
    res2 = client.post("/roadmaps/goals", json={"pathway_id": "c10-diploma"}, headers=headers)
    assert res2.status_code == 201
    goal2_id = res2.json()["id"]
    assert goal2_id != goal1_id
    assert res2.json()["pathway_id"] == "c10-diploma"

    # Verify first goal is archived in DB
    db = TestingSessionLocal()
    from app.models.pathway import StudentGoal
    g1 = db.query(StudentGoal).filter(StudentGoal.id == uuid.UUID(goal1_id)).first()
    assert g1.status == "ARCHIVED"
    db.close()


def test_completed_goal_remains_visible_after_refresh():
    token = get_test_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create goal
    res = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    assert res.status_code == 201
    goal = res.json()
    goal_id = goal["id"]
    milestones = goal["milestones"]

    # 2. Complete all milestones sequentially
    for ms in milestones:
        res_ms = client.patch(f"/roadmaps/goals/me/milestones/{ms['id']}", headers=headers)
        assert res_ms.status_code == 200

    last_ms_res = res_ms.json()
    assert last_ms_res["status"] == "COMPLETED"
    assert last_ms_res["progress"]["completed"] == len(milestones)
    assert last_ms_res["progress"]["percentage"] == 100.0

    # 3. Refresh (GET /roadmaps/goals/me) must return the completed goal, NOT None
    res_refresh = client.get("/roadmaps/goals/me", headers=headers)
    assert res_refresh.status_code == 200
    data_refreshed = res_refresh.json()
    assert data_refreshed is not None
    assert data_refreshed["id"] == goal_id
    assert data_refreshed["status"] == "COMPLETED"
    assert data_refreshed["progress"]["percentage"] == 100.0
    for ms in data_refreshed["milestones"]:
        assert ms["status"] == "COMPLETED"
        assert ms["completed_at"] is not None


def test_repeated_milestone_completion_is_safe_and_idempotent():
    token = get_test_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    m1_id = res.json()["milestones"][0]["id"]

    # First completion -> 200 OK
    res_comp1 = client.patch(f"/roadmaps/goals/me/milestones/{m1_id}", headers=headers)
    assert res_comp1.status_code == 200
    assert res_comp1.json()["milestones"][0]["status"] == "COMPLETED"

    # Repeated completion -> 200 OK (idempotent, safe, no 404 or 400)
    res_comp2 = client.patch(f"/roadmaps/goals/me/milestones/{m1_id}", headers=headers)
    assert res_comp2.status_code == 200
    assert res_comp2.json()["milestones"][0]["status"] == "COMPLETED"

    # Complete remaining milestones
    for ms in res.json()["milestones"][1:]:
        client.patch(f"/roadmaps/goals/me/milestones/{ms['id']}", headers=headers)

    # Now goal is COMPLETED. Repeat completion on the final milestone
    last_m_id = res.json()["milestones"][-1]["id"]
    res_comp_last = client.patch(f"/roadmaps/goals/me/milestones/{last_m_id}", headers=headers)
    assert res_comp_last.status_code == 200
    assert res_comp_last.json()["status"] == "COMPLETED"


def test_same_pathway_reselection_preserves_goal_and_progress():
    token = get_test_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Select pathway
    res1 = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    assert res1.status_code == 201
    goal1_id = res1.json()["id"]
    m1_id = res1.json()["milestones"][0]["id"]

    # 2. Complete milestone 1
    res_m1 = client.patch(f"/roadmaps/goals/me/milestones/{m1_id}", headers=headers)
    assert res_m1.status_code == 200
    assert res_m1.json()["progress"]["completed"] == 1

    # 3. Student re-selects the EXACT same pathway
    res2 = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    assert res2.status_code in [200, 201]
    goal2 = res2.json()

    # Must be the exact same goal, NOT reset or recreated!
    assert goal2["id"] == goal1_id
    assert goal2["progress"]["completed"] == 1
    assert goal2["milestones"][0]["status"] == "COMPLETED"
    assert goal2["milestones"][1]["status"] == "AVAILABLE"


def test_completed_a_active_b_select_a_archives_b_displays_completed_a():
    """
    Case: 'completed A exists, B is active, student selects A':
    after explicit switch confirmation, archive B and display completed A without resetting/reopening A.
    POST and subsequent GET must agree. Preserve all history.
    """
    token = get_test_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Complete goal A ('c10-puc')
    res_a = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    goal_a_id = res_a.json()["id"]
    for ms in res_a.json()["milestones"]:
        client.patch(f"/roadmaps/goals/me/milestones/{ms['id']}", headers=headers)

    # Verify A is COMPLETED
    res_a_comp = client.get("/roadmaps/goals/me", headers=headers)
    assert res_a_comp.json()["id"] == goal_a_id
    assert res_a_comp.json()["status"] == "COMPLETED"

    # 2. Student activates pathway B ('c10-diploma')
    res_b = client.post("/roadmaps/goals", json={"pathway_id": "c10-diploma"}, headers=headers)
    assert res_b.status_code == 201
    goal_b_id = res_b.json()["id"]
    assert goal_b_id != goal_a_id
    assert res_b.json()["status"] == "ACTIVE"

    # 3. Student re-selects pathway A ('c10-puc')
    res_select_a = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    assert res_select_a.status_code in [200, 201]
    data_selected_a = res_select_a.json()

    # Must return completed goal A, WITHOUT reopening it!
    assert data_selected_a["id"] == goal_a_id
    assert data_selected_a["status"] == "COMPLETED"
    assert data_selected_a["progress"]["completed"] == len(data_selected_a["milestones"])
    for ms in data_selected_a["milestones"]:
        assert ms["status"] == "COMPLETED"

    # 4. Subsequent GET /roadmaps/goals/me must agree and return completed goal A
    res_get_a = client.get("/roadmaps/goals/me", headers=headers)
    assert res_get_a.status_code == 200
    assert res_get_a.json()["id"] == goal_a_id
    assert res_get_a.json()["status"] == "COMPLETED"

    # 5. Verify database history: B is ARCHIVED, A is COMPLETED
    db = TestingSessionLocal()
    from app.models.pathway import StudentGoal
    goal_b_db = db.query(StudentGoal).filter(StudentGoal.id == uuid.UUID(goal_b_id)).first()
    assert goal_b_db.status == "ARCHIVED"
    goal_a_db = db.query(StudentGoal).filter(StudentGoal.id == uuid.UUID(goal_a_id)).first()
    assert goal_a_db.status == "COMPLETED"
    db.close()


def test_cross_student_ownership_enforcement():
    token_student_1 = get_test_token(str(uuid.uuid4()))
    token_student_2 = get_test_token(str(uuid.uuid4()))
    headers_1 = {"Authorization": f"Bearer {token_student_1}"}
    headers_2 = {"Authorization": f"Bearer {token_student_2}"}

    # Student 1 creates goal
    res_s1 = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers_1)
    assert res_s1.status_code == 201
    s1_milestone_id = res_s1.json()["milestones"][0]["id"]

    # Student 2 checks their goal -> should be None
    res_s2_me = client.get("/roadmaps/goals/me", headers=headers_2)
    assert res_s2_me.status_code == 200
    assert res_s2_me.json() is None

    # Student 2 tries to complete Student 1's milestone -> 404
    res_hack = client.patch(f"/roadmaps/goals/me/milestones/{s1_milestone_id}", headers=headers_2)
    assert res_hack.status_code == 404

    # Verify Student 1's milestone remains uncompleted (AVAILABLE)
    res_s1_check = client.get("/roadmaps/goals/me", headers=headers_1)
    assert res_s1_check.json()["milestones"][0]["status"] == "AVAILABLE"


def test_simultaneous_same_pathway_requests_no_conflict():
    import concurrent.futures
    student_id = str(uuid.uuid4())
    token = get_test_token(student_id)
    headers = {"Authorization": f"Bearer {token}"}

    def create_goal():
        return client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(create_goal) for _ in range(5)]
        responses = [f.result() for f in futures]

    for r in responses:
        assert r.status_code in [200, 201]

    # Verify only ONE active goal exists in the database for this student
    db = TestingSessionLocal()
    from app.models.pathway import StudentGoal
    active_goals = db.query(StudentGoal).filter(
        StudentGoal.student_id == uuid.UUID(student_id),
        StudentGoal.status == "ACTIVE"
    ).all()
    assert len(active_goals) == 1
    db.close()


def test_simultaneous_different_pathway_requests_409_conflict():
    import concurrent.futures
    student_id = str(uuid.uuid4())
    token = get_test_token(student_id)
    headers = {"Authorization": f"Bearer {token}"}

    def create_goal_puc():
        return client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)

    def create_goal_diploma():
        return client.post("/roadmaps/goals", json={"pathway_id": "c10-diploma"}, headers=headers)

    # Execute multiple competing requests for different pathways simultaneously
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        f1 = executor.submit(create_goal_puc)
        f2 = executor.submit(create_goal_diploma)
        responses = [f1.result(), f2.result()]

    status_codes = [r.status_code for r in responses]
    # One must succeed (201), the other either succeeds (if serialized) or receives 409 Conflict
    assert 201 in status_codes
    for r in responses:
        assert r.status_code in [200, 201, 409]

    # At no point can there be more than one ACTIVE goal for the student
    db = TestingSessionLocal()
    from app.models.pathway import StudentGoal
    active_goals = db.query(StudentGoal).filter(
        StudentGoal.student_id == uuid.UUID(student_id),
        StudentGoal.status == "ACTIVE"
    ).all()
    assert len(active_goals) == 1
    db.close()


def test_completion_versus_switch_race():
    import concurrent.futures
    student_id = str(uuid.uuid4())
    token = get_test_token(student_id)
    headers = {"Authorization": f"Bearer {token}"}

    # Set initial goal
    res = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    m1_id = res.json()["milestones"][0]["id"]

    def complete_m():
        return client.patch(f"/roadmaps/goals/me/milestones/{m1_id}", headers=headers)

    def switch_pathway():
        return client.post("/roadmaps/goals", json={"pathway_id": "c10-diploma"}, headers=headers)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f_comp = executor.submit(complete_m)
        f_switch = executor.submit(switch_pathway)
        r_comp = f_comp.result()
        r_switch = f_switch.result()

    assert r_comp.status_code in [200, 400, 404]
    assert r_switch.status_code in [200, 201, 409]

    # Exactly 1 active goal in database
    db = TestingSessionLocal()
    from app.models.pathway import StudentGoal
    active_goals = db.query(StudentGoal).filter(
        StudentGoal.student_id == uuid.UUID(student_id),
        StudentGoal.status == "ACTIVE"
    ).all()
    assert len(active_goals) == 1
    db.close()


def test_controlled_final_milestone_completion_versus_switch():
    """
    Strengthened controlled overlap concurrency test:
    Goal A has all milestones completed except the final one.
    Simultaneously:
      Thread 1: completes final milestone on Goal A.
      Thread 2: switches pathway to Goal B.
    Verify:
      - Controlled synchronization via threading.Barrier(2).
      - Both threads return valid status codes (200, 201, or safe 409).
      - Goal A's completed milestone progress is strictly preserved (never reset or lost).
      - Final goal statuses in database are valid: Goal A is COMPLETED or ARCHIVED (with progress intact),
        and at most 1 ACTIVE goal exists for the student.
    """
    import threading
    import concurrent.futures
    student_id = str(uuid.uuid4())
    token = get_test_token(student_id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Goal A ('c10-puc')
    res_a = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    assert res_a.status_code == 201
    goal_a_id = res_a.json()["id"]
    milestones_a = res_a.json()["milestones"]
    assert len(milestones_a) >= 2

    # 2. Complete all milestones except the last one
    for ms in milestones_a[:-1]:
        res_comp = client.patch(f"/roadmaps/goals/me/milestones/{ms['id']}", headers=headers)
        assert res_comp.status_code == 200

    last_milestone_id = milestones_a[-1]["id"]

    # 3. Controlled overlap concurrency using threading.Barrier
    barrier = threading.Barrier(2)

    def worker_complete_final():
        barrier.wait()
        return client.patch(f"/roadmaps/goals/me/milestones/{last_milestone_id}", headers=headers)

    def worker_switch_pathway():
        barrier.wait()
        return client.post("/roadmaps/goals", json={"pathway_id": "c10-diploma"}, headers=headers)

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f_comp = executor.submit(worker_complete_final)
        f_switch = executor.submit(worker_switch_pathway)
        res_comp_final = f_comp.result()
        res_switch = f_switch.result()

    # Both requests must return clean controlled codes
    assert res_comp_final.status_code in [200, 400, 404]
    assert res_switch.status_code in [200, 201, 409]

    # 4. Assert Database State Integrity:
    db = TestingSessionLocal()
    from app.models.pathway import StudentGoal, StudentMilestoneProgress
    goal_a = db.query(StudentGoal).filter(StudentGoal.id == uuid.UUID(goal_a_id)).first()
    assert goal_a is not None
    # Goal A status must be COMPLETED or ARCHIVED (never corrupted)
    assert goal_a.status in ["COMPLETED", "ARCHIVED"]

    # Assert progress preservation: all earlier completed milestones MUST remain completed
    for ms in milestones_a[:-1]:
        prog = db.query(StudentMilestoneProgress).filter(StudentMilestoneProgress.id == uuid.UUID(ms["id"])).first()
        assert prog.status == "COMPLETED"
        assert prog.completed_at is not None

    # At most 1 ACTIVE goal exists across the student
    active_goals = db.query(StudentGoal).filter(
        StudentGoal.student_id == uuid.UUID(student_id),
        StudentGoal.status == "ACTIVE"
    ).all()
    assert len(active_goals) <= 1

    # If switch succeeded (201), the active goal must be Goal B
    if res_switch.status_code == 201:
        assert len(active_goals) == 1
        assert active_goals[0].pathway_id == "c10-diploma"

    db.close()


def test_deterministic_completion_versus_switching_race():
    """
    Deterministic interleaved execution test:
    1. Student creates Goal A ('c10-puc').
    2. Complete all milestones on Goal A except the final one.
    3. Completion session begins completing final milestone: reads Goal A (ACTIVE at read time).
    4. Interleaved: Another session switches pathway to Goal B ('c10-diploma'),
       which archives Goal A (status='ARCHIVED') and creates Goal B (status='ACTIVE'), and commits.
    5. Completion resumes in the first session: executes complete_student_milestone on final milestone.
       It performs the conditional DB update: UPDATE ... WHERE id=A AND status='ACTIVE'.
       Because Goal A was archived in step 4, the conditional update affects 0 rows.
       Completion session commits and refreshes Goal A.
    6. Assert:
       - Goal A stays ARCHIVED (never erroneously overwritten with COMPLETED).
       - Goal B stays ACTIVE.
       - All milestone progress for Goal A (including final milestone) is preserved as COMPLETED.
    """
    student_id = uuid.uuid4()
    student_id_str = str(student_id)
    token = get_test_token(student_id_str)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Goal A ('c10-puc')
    res_a = client.post("/roadmaps/goals", json={"pathway_id": "c10-puc"}, headers=headers)
    assert res_a.status_code == 201
    goal_a_id = uuid.UUID(res_a.json()["id"])
    milestones_a = res_a.json()["milestones"]
    assert len(milestones_a) >= 2

    # 2. Complete all milestones except the last one
    for ms in milestones_a[:-1]:
        res_comp = client.patch(f"/roadmaps/goals/me/milestones/{ms['id']}", headers=headers)
        assert res_comp.status_code == 200

    last_milestone_id = uuid.UUID(milestones_a[-1]["id"])

    # 3. Define interleaved action: another session switches pathway to Goal B while completion is in-flight
    goal_b_info = {}

    def switch_while_completing():
        res_b = client.post("/roadmaps/goals", json={"pathway_id": "c10-diploma"}, headers=headers)
        assert res_b.status_code == 201
        goal_b_info["id"] = uuid.UUID(res_b.json()["id"])

    # 4. Completion session reads Goal A while ACTIVE, prepares completion, then switch runs and commits,
    # and then completion attempts conditional update and commits.
    db_completion = TestingSessionLocal()
    from app.models.pathway import StudentGoal, StudentMilestoneProgress
    resp = RoadmapService.complete_student_milestone(
        db=db_completion,
        student_id=student_id,
        milestone_id=last_milestone_id,
        _before_commit_hook=switch_while_completing,
    )
    db_completion.close()

    # 6. Assert database state:
    db_final = TestingSessionLocal()
    goal_a_final = db_final.query(StudentGoal).filter(StudentGoal.id == goal_a_id).first()
    goal_b_final = db_final.query(StudentGoal).filter(StudentGoal.id == goal_b_info["id"]).first()

    # Goal A must stay ARCHIVED (conditional transition prevented stale overwrite)
    assert goal_a_final.status == "ARCHIVED"
    # Goal B must stay ACTIVE
    assert goal_b_final.status == "ACTIVE"

    # All milestone progress on Goal A must be preserved as COMPLETED
    for ms in milestones_a:
        prog = db_final.query(StudentMilestoneProgress).filter(
            StudentMilestoneProgress.id == uuid.UUID(ms["id"])
        ).first()
        assert prog is not None
        assert prog.status == "COMPLETED"
        assert prog.completed_at is not None

    db_final.close()


def test_roadmap_token_validation_matrix():
    valid_uuid = str(uuid.uuid4())

    # 1. Missing Authorization header -> 401
    res_no_auth = client.get("/roadmaps/goals/me")
    assert res_no_auth.status_code == 401
    assert "Missing or invalid Authorization header" in res_no_auth.json()["detail"]

    # 2. Refresh token rejected -> 401 Invalid token type
    refresh_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "student@test.com",
            "role": "student",
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_ref = client.get("/roadmaps/goals/me", headers={"Authorization": f"Bearer {refresh_token}"})
    assert res_ref.status_code == 401
    assert "Invalid token type" in res_ref.json()["detail"]

    # 3. Expired token -> 401 Token has expired
    exp_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "student@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) - timedelta(minutes=5)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_exp = client.get("/roadmaps/goals/me", headers={"Authorization": f"Bearer {exp_token}"})
    assert res_exp.status_code == 401
    assert res_exp.json()["detail"] == "Token has expired"

    # 4. Invalid signature -> 401 Invalid token
    bad_sig_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "student@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        "wrong_secret_key",
        algorithm=settings.JWT_ALGORITHM
    )
    res_bad_sig = client.get("/roadmaps/goals/me", headers={"Authorization": f"Bearer {bad_sig_token}"})
    assert res_bad_sig.status_code == 401
    assert res_bad_sig.json()["detail"] == "Invalid token"

    # 5. Missing exp claim -> 401 Invalid token
    no_exp_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "student@test.com",
            "role": "student",
            "type": "access"
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_no_exp = client.get("/roadmaps/goals/me", headers={"Authorization": f"Bearer {no_exp_token}"})
    assert res_no_exp.status_code == 401
    assert res_no_exp.json()["detail"] == "Invalid token"

    # 6. Missing sub claim -> 401 Invalid token
    no_sub_token = jwt.encode(
        {
            "email": "student@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_no_sub = client.get("/roadmaps/goals/me", headers={"Authorization": f"Bearer {no_sub_token}"})
    assert res_no_sub.status_code == 401
    assert res_no_sub.json()["detail"] == "Invalid token"

    # 7. Missing type claim -> 401 Invalid token
    no_type_token = jwt.encode(
        {
            "sub": valid_uuid,
            "email": "student@test.com",
            "role": "student",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_no_type = client.get("/roadmaps/goals/me", headers={"Authorization": f"Bearer {no_type_token}"})
    assert res_no_type.status_code == 401
    assert res_no_type.json()["detail"] == "Invalid token"

    # 8. Malformed subject (non-UUID string) -> 401 Invalid user ID in token (MUST NOT be 500)
    malformed_sub_token = jwt.encode(
        {
            "sub": "not-a-valid-uuid",
            "email": "student@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_malformed_sub = client.get("/roadmaps/goals/me", headers={"Authorization": f"Bearer {malformed_sub_token}"})
    assert res_malformed_sub.status_code == 401
    assert res_malformed_sub.json()["detail"] == "Invalid user ID in token"

    # 9. Empty subject -> 401 Invalid user ID in token (MUST NOT be 500)
    empty_sub_token = jwt.encode(
        {
            "sub": "",
            "email": "student@test.com",
            "role": "student",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        },
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    res_empty_sub = client.get("/roadmaps/goals/me", headers={"Authorization": f"Bearer {empty_sub_token}"})
    assert res_empty_sub.status_code == 401
    assert res_empty_sub.json()["detail"] == "Invalid user ID in token"

    # 10. Malformed exp values (list, dict, non-numeric) -> 401 Invalid token (never 500)
    for bad_exp in [[], {}, "not-a-number"]:
        bad_exp_token = jwt.encode(
            {
                "sub": valid_uuid,
                "email": "student@test.com",
                "role": "student",
                "type": "access",
                "exp": bad_exp
            },
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        res_bad_exp = client.get("/roadmaps/goals/me", headers={"Authorization": f"Bearer {bad_exp_token}"})
        assert res_bad_exp.status_code == 401
        assert res_bad_exp.json()["detail"] == "Invalid token"
