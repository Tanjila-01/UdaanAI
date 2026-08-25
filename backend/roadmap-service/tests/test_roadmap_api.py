import sys
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


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    RoadmapService.seed_initial_data(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


def test_list_pathways_no_filters():
    response = client.get("/roadmaps/pathways")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "pathways" in data
    assert data["total"] == 22
    assert len(data["pathways"]) == 22
    
    # Verify response contract and field types
    p = data["pathways"][0]
    assert "id" in p
    assert isinstance(p["id"], str)
    assert "education_level" in p
    assert isinstance(p["education_level"], str)
    assert "title" in p
    assert isinstance(p["title"], str)
    assert "category" in p
    assert isinstance(p["category"], str)
    assert "description" in p
    assert isinstance(p["description"], str)
    assert "options" in p
    assert isinstance(p["options"], list)
    assert "milestones" in p
    assert isinstance(p["milestones"], list)


def test_list_pathways_filter_class10():
    response = client.get("/roadmaps/pathways?education_level=Class%2010")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert data["education_level"] == "Class 10"
    ids = [p["id"] for p in data["pathways"]]
    assert "c10-puc" in ids
    assert "c10-diploma" in ids
    assert "c10-iti" in ids


def test_list_pathways_filter_class8():
    response = client.get("/roadmaps/pathways?education_level=Class%208")
    assert response.status_code == 200
    data = response.json()
    # Business rule: Class 8 maps to Class 10 SSLC choices
    assert data["total"] == 3
    assert data["education_level"] == "Class 8"
    ids = [p["id"] for p in data["pathways"]]
    assert "c10-puc" in ids
    assert "c10-diploma" in ids
    assert "c10-iti" in ids


def test_list_pathways_filter_puc2_science():
    response = client.get("/roadmaps/pathways?education_level=PUC%202&stream=Science")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 4
    assert data["education_level"] == "PUC 2"
    assert data["stream"] == "Science"
    assert data["pathways"][0]["id"] == "puc-science"


def test_list_pathways_no_matches():
    response = client.get("/roadmaps/pathways?education_level=Diploma")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert len(data["pathways"]) == 0


def test_get_pathway_detail_existing():
    response = client.get("/roadmaps/pathways/c10-puc")
    assert response.status_code == 200
    p = response.json()
    assert p["id"] == "c10-puc"
    assert "options" in p
    assert len(p["options"]) > 0
    assert "milestones" in p
    assert len(p["milestones"]) > 0
    
    # Check nesting and custom serialization of UUID / datetime
    assert isinstance(p["options"][0]["option_name"], str)
    assert isinstance(p["options"][0]["id"], str)  # UUID serialization check
    assert isinstance(p["milestones"][0]["step_number"], int)
    assert isinstance(p["milestones"][0]["id"], str)  # UUID serialization check
    assert "created_at" in p
    assert isinstance(p["created_at"], str)  # Datetime serialization check


def test_get_pathway_detail_missing():
    response = client.get("/roadmaps/pathways/does-not-exist")
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Pathway 'does-not-exist' was not found."
