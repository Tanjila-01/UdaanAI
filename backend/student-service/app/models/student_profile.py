import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
from app.core.config import settings

table_args = {"schema": settings.DB_SCHEMA} if settings.DB_SCHEMA else {}


class StudentProfile(Base):
    __tablename__ = "student_profiles"
    __table_args__ = table_args

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    current_level = Column(String(100), nullable=False)
    class_or_year = Column(String(50), nullable=False)
    board = Column(String(150), nullable=False)
    stream = Column(String(100), nullable=True)
    diploma_branch = Column(String(150), nullable=True)
    iti_trade = Column(String(150), nullable=True)
    institution_name = Column(String(255), nullable=False)
    district = Column(String(150), nullable=False)
    state = Column(String(100), nullable=False, default="Karnataka")
    preferred_language = Column(String(50), nullable=True)
    is_complete = Column(Boolean, nullable=False, default=False)
    completion_percentage = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
