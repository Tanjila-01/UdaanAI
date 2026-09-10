import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Date,
    DateTime,
    Text,
    Numeric,
    ForeignKey,
    Index,
    JSON,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.core.config import settings

schema_args = {"schema": settings.DB_SCHEMA} if settings.DB_SCHEMA else {}


class WorkshopRequest(Base):
    __tablename__ = "workshop_requests"
    __table_args__ = (
        Index("ix_workshop_requests_status", "status"),
        Index("ix_workshop_requests_created_at", "created_at"),
        Index("ix_workshop_requests_district", "district"),
        Index("ix_workshop_requests_preferred_mode", "preferred_mode"),
        Index("ix_workshop_requests_submission_id", "submission_id", unique=True),
        Index(
            "ix_workshop_requests_active_duplicate",
            "active_duplicate_hash",
            unique=True,
            postgresql_where=text("status IN ('NEW', 'CONTACTED', 'SCHEDULED')"),
            sqlite_where=text("status IN ('NEW', 'CONTACTED', 'SCHEDULED')"),
        ),
        schema_args,
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(String(64), nullable=True)
    payload_hash = Column(String(64), nullable=True)
    active_duplicate_hash = Column(String(64), nullable=True)
    institution_name = Column(String(255), nullable=False)
    institution_type = Column(String(50), nullable=False)
    contact_name = Column(String(255), nullable=False)
    contact_phone = Column(String(30), nullable=False)
    contact_email = Column(String(255), nullable=False)
    district = Column(String(100), nullable=False)
    city = Column(String(100), nullable=True)
    student_count = Column(Integer, nullable=False)
    preferred_mode = Column(String(30), nullable=False)
    preferred_topics = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    preferred_date = Column(Date, nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="NEW")
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    schedule = relationship(
        "WorkshopSchedule",
        back_populates="request",
        uselist=False,
        cascade="all, delete-orphan",
    )
    feedback = relationship(
        "WorkshopFeedback",
        back_populates="request",
        uselist=False,
        cascade="all, delete-orphan",
    )

    @property
    def coordinator_feedback(self):
        return self.feedback


class WorkshopSchedule(Base):
    __tablename__ = "workshop_schedules"
    __table_args__ = (
        schema_args,
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(
        UUID(as_uuid=True),
        ForeignKey(f"{settings.DB_SCHEMA}.workshop_requests.id" if settings.DB_SCHEMA else "workshop_requests.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    scheduled_start = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    mode = Column(String(30), nullable=False)
    venue_or_meeting_link = Column(Text, nullable=False)
    assigned_facilitator = Column(String(255), nullable=True)
    internal_notes = Column(Text, nullable=True)

    actual_attendance = Column(Integer, nullable=True)
    completion_notes = Column(Text, nullable=True)
    feedback_score = Column(Numeric(2, 1), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    request = relationship("WorkshopRequest", back_populates="schedule")


class WorkshopFeedback(Base):
    __tablename__ = "workshop_feedbacks"
    __table_args__ = (
        Index("ix_workshop_feedbacks_feedback_token", "feedback_token", unique=True),
        schema_args,
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(
        UUID(as_uuid=True),
        ForeignKey(f"{settings.DB_SCHEMA}.workshop_requests.id" if settings.DB_SCHEMA else "workshop_requests.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    feedback_token = Column(String(64), nullable=False, unique=True)
    rating = Column(Integer, nullable=True)
    comments = Column(String(1000), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    request = relationship("WorkshopRequest", back_populates="feedback")
