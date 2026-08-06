import sys
import uuid
from pathlib import Path
import pytest
from sqlalchemy import create_engine
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

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def test_roadmap_models_metadata():
    assert Pathway.__tablename__ == "pathways"
    assert PathwayOption.__tablename__ == "pathway_options"
    assert PathwayMilestone.__tablename__ == "pathway_milestones"

    assert "id" in Pathway.__table__.columns
    assert "education_level" in Pathway.__table__.columns
    assert "stream" in Pathway.__table__.columns
    assert "category" in Pathway.__table__.columns

    assert "pathway_id" in PathwayOption.__table__.columns
    assert "display_order" in PathwayOption.__table__.columns

    assert "pathway_id" in PathwayMilestone.__table__.columns
    assert "step_number" in PathwayMilestone.__table__.columns


def test_roadmap_models_orm_relationships():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    pathway = Pathway(
        id="c10-puc",
        education_level="Class 10",
        stream=None,
        title="Pre-University College (PUC)",
        category="Pre-University",
        duration="2 Years",
        description="2-year Pre-University education in Karnataka State.",
    )
    db.add(pathway)

    option1 = PathwayOption(
        id=uuid.uuid4(),
        pathway_id="c10-puc",
        option_name="Science Stream",
        stream_or_code="PCMB",
        description="Prepares for Engineering and Medicine.",
        eligibility="Class 10 Pass",
        display_order=1,
    )
    option2 = PathwayOption(
        id=uuid.uuid4(),
        pathway_id="c10-puc",
        option_name="Commerce Stream",
        stream_or_code="CEBA",
        description="Prepares for Finance and Business Administration.",
        eligibility="Class 10 Pass",
        display_order=2,
    )
    db.add_all([option1, option2])

    milestone1 = PathwayMilestone(
        id=uuid.uuid4(),
        pathway_id="c10-puc",
        step_number=1,
        title="SSLC Board Completion",
        description="Complete Class 10 SSLC exams.",
        key_action="Obtain qualifying SSLC marks card.",
    )
    milestone2 = PathwayMilestone(
        id=uuid.uuid4(),
        pathway_id="c10-puc",
        step_number=2,
        title="Stream Selection & Admission",
        description="Select Science, Commerce, or Arts.",
        key_action="Apply via PU Department admissions.",
    )
    db.add_all([milestone1, milestone2])

    db.commit()

    fetched = db.query(Pathway).filter(Pathway.id == "c10-puc").first()
    assert fetched is not None
    assert fetched.title == "Pre-University College (PUC)"
    assert len(fetched.options) == 2
    assert fetched.options[0].option_name == "Science Stream"
    assert fetched.options[1].option_name == "Commerce Stream"
    assert len(fetched.milestones) == 2
    assert fetched.milestones[0].step_number == 1
    assert fetched.milestones[1].step_number == 2

    db.close()
