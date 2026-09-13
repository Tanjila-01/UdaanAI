"""Saved advisor answers, owned by the authenticated student."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Index, JSON, String
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.config import settings
from app.db.session import Base

class AdvisorHistory(Base):
    __tablename__ = 'advisor_history'
    __table_args__ = (Index('ix_advisor_history_owner_created', 'user_id', 'created_at', 'id'),
                      {'schema': settings.DB_SCHEMA or None})
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    question = Column(String(1000), nullable=False)
    request = Column(JSON().with_variant(JSONB, 'postgresql'), nullable=False)
    response = Column(JSON().with_variant(JSONB, 'postgresql'), nullable=False)
