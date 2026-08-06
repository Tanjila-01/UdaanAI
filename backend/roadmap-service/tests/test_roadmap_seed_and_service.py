import sys
from pathlib import Path
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Clear cached 'app' modules to ensure service isolation when running full test suite
for mod in list(sys.modules.keys()):
    if mod == 'app' or mod.startswith('app.'):
        del sys.modules[mod]

service_root = Path(__file__).resolve().parent.parent
if str(service_root) not in sys.path:
    sys.path.insert(0, str(service_root))

from app.core.config import settings
settings.DB_SCHEMA = ""

from app.db.session import Base
from app.models.pathway import Pathway, PathwayOption, PathwayMilestone
from app.schemas.pathway import (
    PathwayDetailResponse,
    PathwaySummaryResponse,
    PathwayOptionResponse,
    PathwayMilestoneResponse,
    PathwayListResponse,
)
from app.services.roadmap_service import RoadmapService
from app.db import seed_runner

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


def test_seed_idempotency_and_update_behavior():
    db = TestingSessionLocal()

    # First seed run
    count1 = RoadmapService.seed_initial_data(db)
    assert count1 == 6
    assert db.query(Pathway).count() == 6
    assert db.query(PathwayOption).count() == 18
    assert db.query(PathwayMilestone).count() == 18

    # Verify initial seed data content
    c10_puc = db.query(Pathway).filter(Pathway.id == "c10-puc").first()
    assert c10_puc is not None
    assert c10_puc.title == "Pre-University College (PUC)"

    # Second seed run (must maintain exact same counts without duplicates)
    count2 = RoadmapService.seed_initial_data(db)
    assert count2 == 6
    assert db.query(Pathway).count() == 6
    assert db.query(PathwayOption).count() == 18
    assert db.query(PathwayMilestone).count() == 18

    # Verify update-or-insert (upsert) in-place modification
    c10_puc.title = "Temporary Modified Title"
    db.commit()
    assert db.query(Pathway).filter(Pathway.id == "c10-puc").first().title == "Temporary Modified Title"

    # Re-running seed restores the authoritative title in-place
    RoadmapService.seed_initial_data(db)
    assert db.query(Pathway).filter(Pathway.id == "c10-puc").first().title == "Pre-University College (PUC)"
    assert db.query(Pathway).count() == 6

    db.close()


def test_seed_runner_execution(monkeypatch):
    monkeypatch.setattr(seed_runner, "SessionLocal", TestingSessionLocal)
    exit_code = seed_runner.run_seed()
    assert exit_code == 0

    db = TestingSessionLocal()
    assert db.query(Pathway).count() == 6
    assert db.query(PathwayOption).count() == 18
    assert db.query(PathwayMilestone).count() == 18
    db.close()


def test_service_queries_and_filtering():
    db = TestingSessionLocal()
    RoadmapService.seed_initial_data(db)

    # 1. No filters -> returns all 6 pathways
    all_pathways = RoadmapService.get_pathways(db)
    assert len(all_pathways) == 6

    # 2. Query post-Class 10 pathways -> returns 3 pathways
    class10_pathways = RoadmapService.get_pathways(db, education_level="Class 10")
    assert len(class10_pathways) == 3
    pathway_ids = [p.id for p in class10_pathways]
    assert "c10-puc" in pathway_ids
    assert "c10-diploma" in pathway_ids
    assert "c10-iti" in pathway_ids

    # 3. Query Middle School (Class 8 / Class 9) -> includes Class 10 SSLC choices
    class8_pathways = RoadmapService.get_pathways(db, education_level="Class 8")
    assert len(class8_pathways) == 3

    # 4. Query PUC 2 Science pathway
    puc_science = RoadmapService.get_pathways(db, education_level="PUC 2", stream="Science")
    assert len(puc_science) == 1
    assert puc_science[0].id == "puc-science-eng"
    assert puc_science[0].title == "Engineering & Technology Degrees (B.E / B.Tech)"

    # 5. Query PUC 2 Commerce pathway
    puc_commerce = RoadmapService.get_pathways(db, education_level="PUC 2", stream="Commerce")
    assert len(puc_commerce) == 1
    assert puc_commerce[0].id == "puc-commerce-fin"

    # 6. Query PUC 2 Arts pathway
    puc_arts = RoadmapService.get_pathways(db, education_level="PUC 2", stream="Arts")
    assert len(puc_arts) == 1
    assert puc_arts[0].id == "puc-arts-hum"

    # 7. Valid filter with zero matching pathways -> returns empty list without error
    empty_result = RoadmapService.get_pathways(db, education_level="Diploma")
    assert empty_result == []

    # 8. Query single pathway by ID
    pathway_detail = RoadmapService.get_pathway_by_id(db, "c10-puc")
    assert pathway_detail is not None
    assert pathway_detail.title == "Pre-University College (PUC)"
    assert len(pathway_detail.options) == 3
    assert len(pathway_detail.milestones) == 3

    # Verify deterministic ordering
    assert pathway_detail.options[0].display_order == 1
    assert pathway_detail.options[1].display_order == 2
    assert pathway_detail.options[2].display_order == 3

    assert pathway_detail.milestones[0].step_number == 1
    assert pathway_detail.milestones[1].step_number == 2
    assert pathway_detail.milestones[2].step_number == 3

    # 9. Missing pathway handling -> None
    missing = RoadmapService.get_pathway_by_id(db, "non-existent-pathway-id")
    assert missing is None

    db.close()


def test_query_efficiency_bounded_sql_statements():
    db = TestingSessionLocal()
    RoadmapService.seed_initial_data(db)

    # Listen to executed SQL statements to verify bounded queries
    statements = []

    def callback(conn, cursor, statement, parameters, context, executemany):
        statements.append(statement)

    event.listen(test_engine, "before_cursor_execute", callback)

    # Execute get_pathways query with selectinload
    pathways = RoadmapService.get_pathways(db, education_level="Class 10")
    assert len(pathways) == 3

    # Access child relationships for all 3 pathways
    for p in pathways:
        _ = len(p.options)
        _ = len(p.milestones)

    event.remove(test_engine, "before_cursor_execute", callback)

    # Exactly 3 SQL statements executed: 1 for Pathways, 1 SELECT IN for options, 1 SELECT IN for milestones
    assert len(statements) == 3

    db.close()


def test_pydantic_schema_serialization():
    db = TestingSessionLocal()
    RoadmapService.seed_initial_data(db)

    pathway_orm = RoadmapService.get_pathway_by_id(db, "c10-diploma")
    assert pathway_orm is not None

    # 1. Test PathwayDetailResponse model validation
    schema_detail = PathwayDetailResponse.model_validate(pathway_orm)
    assert schema_detail.id == "c10-diploma"
    assert schema_detail.education_level == "Class 10"
    assert schema_detail.category == "Technical"
    assert len(schema_detail.options) == 3
    assert len(schema_detail.milestones) == 3

    opt1 = schema_detail.options[0]
    assert isinstance(opt1, PathwayOptionResponse)
    assert opt1.option_name == "Computer Science & Engineering Diploma"
    assert opt1.stream_or_code == "CS-DIP"

    ms1 = schema_detail.milestones[0]
    assert isinstance(ms1, PathwayMilestoneResponse)
    assert ms1.step_number == 1
    assert ms1.title == "DTE Polytechnic Seat Allotment"

    # 2. Test PathwaySummaryResponse model validation
    summary = PathwaySummaryResponse(
        id=pathway_orm.id,
        education_level=pathway_orm.education_level,
        stream=pathway_orm.stream,
        title=pathway_orm.title,
        category=pathway_orm.category,
        duration=pathway_orm.duration,
        description=pathway_orm.description,
        created_at=pathway_orm.created_at,
        options_count=len(pathway_orm.options),
        milestones_count=len(pathway_orm.milestones),
    )
    assert summary.id == "c10-diploma"
    assert summary.options_count == 3
    assert summary.milestones_count == 3

    # 3. Test PathwayListResponse container validation
    list_response = PathwayListResponse(
        total=1,
        education_level="Class 10",
        stream=None,
        pathways=[schema_detail],
    )
    assert list_response.total == 1
    assert len(list_response.pathways) == 1
    assert list_response.pathways[0].id == "c10-diploma"

    db.close()
