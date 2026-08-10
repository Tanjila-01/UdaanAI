import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    JSON,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.core.config import settings

schema = settings.DB_SCHEMA if settings.DB_SCHEMA else None
schema_args = {"schema": schema} if schema else {}

fk_assessments = f"{schema}.assessments.id" if schema else "assessments.id"
fk_questions = f"{schema}.assessment_questions.id" if schema else "assessment_questions.id"
fk_options = f"{schema}.assessment_question_options.id" if schema else "assessment_question_options.id"
fk_attempts = f"{schema}.assessment_attempts.id" if schema else "assessment_attempts.id"


class Assessment(Base):
    __tablename__ = "assessments"
    __table_args__ = schema_args

    id = Column(String(50), primary_key=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, default="general")
    total_questions = Column(Integer, nullable=False, default=10)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    questions = relationship(
        "AssessmentQuestion",
        back_populates="assessment",
        cascade="all, delete-orphan",
        order_by="AssessmentQuestion.display_order",
    )
    attempts = relationship(
        "AssessmentAttempt",
        back_populates="assessment",
        cascade="all, delete-orphan",
    )


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"
    __table_args__ = (
        UniqueConstraint("assessment_id", "display_order", name="uq_question_display_order"),
        schema_args,
    ) if schema else (
        UniqueConstraint("assessment_id", "display_order", name="uq_question_display_order"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(String(50), ForeignKey(fk_assessments, ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    dimension = Column(String(50), nullable=False, default="general")
    display_order = Column(Integer, nullable=False, default=1)

    assessment = relationship("Assessment", back_populates="questions")
    options = relationship(
        "AssessmentOption",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="AssessmentOption.display_order",
    )


class AssessmentOption(Base):
    __tablename__ = "assessment_question_options"
    __table_args__ = schema_args

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey(fk_questions, ondelete="CASCADE"), nullable=False, index=True)
    option_text = Column(String(255), nullable=False)
    option_code = Column(String(50), nullable=False)  # e.g., 'A', 'B', 'C', 'D'
    weight_dimension = Column(String(50), nullable=False)  # 'science', 'commerce', 'arts', 'diploma', 'iti'
    weight_score = Column(Integer, nullable=False, default=1)
    display_order = Column(Integer, nullable=False, default=1)

    question = relationship("AssessmentQuestion", back_populates="options")


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"
    __table_args__ = schema_args

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    assessment_id = Column(String(50), ForeignKey(fk_assessments, ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="in_progress")  # 'in_progress', 'completed'
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    assessment = relationship("Assessment", back_populates="attempts")
    answers = relationship(
        "AssessmentAnswer",
        back_populates="attempt",
        cascade="all, delete-orphan",
    )
    result = relationship(
        "AssessmentResult",
        back_populates="attempt",
        uselist=False,
        cascade="all, delete-orphan",
    )


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"
    __table_args__ = (
        UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question_answer"),
        schema_args,
    ) if schema else (
        UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question_answer"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey(fk_attempts, ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey(fk_questions, ondelete="CASCADE"), nullable=False)
    selected_option_id = Column(UUID(as_uuid=True), ForeignKey(fk_options, ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="answers")
    question = relationship("AssessmentQuestion")
    selected_option = relationship("AssessmentOption")


class AssessmentResult(Base):
    __tablename__ = "assessment_results"
    __table_args__ = schema_args

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey(fk_attempts, ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    primary_stream_recommendation = Column(String(50), nullable=False)
    secondary_stream_recommendation = Column(String(50), nullable=True)
    top_career_match = Column(String(100), nullable=False)
    dimension_scores = Column(JSON, nullable=False)
    summary_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="result")
