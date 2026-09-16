import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Text,
    Index,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
from app.core.config import settings

schema_args = {"schema": settings.DB_SCHEMA} if settings.DB_SCHEMA else {}


class GeneralInquiry(Base):
    __tablename__ = "general_inquiries"
    __table_args__ = (
        Index("ix_general_inquiries_status", "status"),
        Index("ix_general_inquiries_created_at", "created_at"),
        schema_args,
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(254), nullable=False)
    subject = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="NEW")
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
