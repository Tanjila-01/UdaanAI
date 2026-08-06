import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.core.config import settings

schema = settings.DB_SCHEMA if settings.DB_SCHEMA else None
schema_args = {"schema": schema} if schema else {}
fk_target = f"{schema}.pathways.id" if schema else "pathways.id"


class Pathway(Base):
    __tablename__ = "pathways"
    __table_args__ = schema_args

    id = Column(String(50), primary_key=True)
    education_level = Column(String(50), nullable=False, index=True)
    stream = Column(String(50), nullable=True, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    duration = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    options = relationship(
        "PathwayOption",
        back_populates="pathway",
        cascade="all, delete-orphan",
        order_by="PathwayOption.display_order",
    )
    milestones = relationship(
        "PathwayMilestone",
        back_populates="pathway",
        cascade="all, delete-orphan",
        order_by="PathwayMilestone.step_number",
    )


class PathwayOption(Base):
    __tablename__ = "pathway_options"
    __table_args__ = (
        UniqueConstraint("pathway_id", "display_order", name="uq_pathway_option_display_order"),
        schema_args,
    ) if schema else (
        UniqueConstraint("pathway_id", "display_order", name="uq_pathway_option_display_order"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pathway_id = Column(String(50), ForeignKey(fk_target, ondelete="CASCADE"), nullable=False)
    option_name = Column(String(150), nullable=False)
    stream_or_code = Column(String(50), nullable=True)
    description = Column(Text, nullable=False)
    eligibility = Column(String(255), nullable=True)
    display_order = Column(Integer, nullable=False, default=1)

    pathway = relationship("Pathway", back_populates="options")


class PathwayMilestone(Base):
    __tablename__ = "pathway_milestones"
    __table_args__ = (
        UniqueConstraint("pathway_id", "step_number", name="uq_pathway_milestone_step_number"),
        schema_args,
    ) if schema else (
        UniqueConstraint("pathway_id", "step_number", name="uq_pathway_milestone_step_number"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pathway_id = Column(String(50), ForeignKey(fk_target, ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    key_action = Column(String(255), nullable=True)

    pathway = relationship("Pathway", back_populates="milestones")
