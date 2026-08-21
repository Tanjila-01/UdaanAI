import sys
import jwt
import uuid
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
TEST_STUDENT_ID = str(uuid.uuid4())


def get_test_token(student_id=TEST_STUDENT_ID):
    payload = {
        "sub": student_id,
        "email": "student@test.com",
        "role": "student",
        "type": "access",
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
