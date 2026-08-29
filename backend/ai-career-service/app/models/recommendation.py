import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    JSON,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.core.config import settings

schema = settings.DB_SCHEMA if settings.DB_SCHEMA else None
schema_args = {"schema": schema} if schema else {}

fk_results = f"{schema}.career_recommendation_results.id" if schema else "career_recommendation_results.id"


class CareerRecommendationResult(Base):
    __tablename__ = "career_recommendation_results"
    __table_args__ = schema_args

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    generated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    source_scoring_version = Column(String(50), nullable=False)
    disclaimer = Column(String(255), nullable=False)
    source_assessment_id = Column(String(50), nullable=True)
    source_attempt_id = Column(UUID(as_uuid=True), nullable=True)

    recommendations = relationship(
        "CareerRecommendationItem",
        back_populates="result",
        cascade="all, delete-orphan",
        order_by="CareerRecommendationItem.rank",
    )


class CareerRecommendationItem(Base):
    __tablename__ = "career_recommendation_items"
    __table_args__ = schema_args

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    result_id = Column(UUID(as_uuid=True), ForeignKey(fk_results, ondelete="CASCADE"), nullable=False, index=True)
    rank = Column(Integer, nullable=False)
    pathway_id = Column(String(50), nullable=False)
    pathway_title = Column(String(255), nullable=False)
    match_score = Column(Integer, nullable=False)
    match_label = Column(String(20), nullable=False)
    reasons = Column(JSON, nullable=False)  # List of strings
    eligibility_warning = Column(String(255), nullable=True)

    result = relationship("CareerRecommendationResult", back_populates="recommendations")
