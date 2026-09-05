"""Initial workshop requests and schedules tables in schema institution

Revision ID: 001_initial_workshop_tables
Revises: 
Create Date: 2026-09-05 15:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision: str = "001_initial_workshop_tables"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create workshop_requests table
    op.create_table(
        "workshop_requests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("institution_name", sa.String(length=255), nullable=False),
        sa.Column("institution_type", sa.String(length=50), nullable=False),
        sa.Column("contact_name", sa.String(length=255), nullable=False),
        sa.Column("contact_phone", sa.String(length=30), nullable=False),
        sa.Column("contact_email", sa.String(length=255), nullable=False),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("student_count", sa.Integer(), nullable=False),
        sa.Column("preferred_mode", sa.String(length=30), nullable=False),
        sa.Column("preferred_topics", JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("preferred_date", sa.Date(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=30), server_default="NEW", nullable=False),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        schema="institution",
    )

    # Indexes on workshop_requests
    op.create_index(
        "ix_workshop_requests_status",
        "workshop_requests",
        ["status"],
        unique=False,
        schema="institution",
    )
    op.create_index(
        "ix_workshop_requests_created_at",
        "workshop_requests",
        ["created_at"],
        unique=False,
        schema="institution",
    )
    op.create_index(
        "ix_workshop_requests_district",
        "workshop_requests",
        ["district"],
        unique=False,
        schema="institution",
    )
    op.create_index(
        "ix_workshop_requests_preferred_mode",
        "workshop_requests",
        ["preferred_mode"],
        unique=False,
        schema="institution",
    )

    # 2. Create workshop_schedules table
    op.create_table(
        "workshop_schedules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "request_id",
            UUID(as_uuid=True),
            sa.ForeignKey("institution.workshop_requests.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("scheduled_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("mode", sa.String(length=30), nullable=False),
        sa.Column("venue_or_meeting_link", sa.Text(), nullable=False),
        sa.Column("assigned_facilitator", sa.String(length=255), nullable=True),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.Column("actual_attendance", sa.Integer(), nullable=True),
        sa.Column("completion_notes", sa.Text(), nullable=True),
        sa.Column("feedback_score", sa.Numeric(precision=2, scale=1), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        schema="institution",
    )


def downgrade() -> None:
    op.drop_table("workshop_schedules", schema="institution")
    op.drop_index("ix_workshop_requests_preferred_mode", table_name="workshop_requests", schema="institution")
    op.drop_index("ix_workshop_requests_district", table_name="workshop_requests", schema="institution")
    op.drop_index("ix_workshop_requests_created_at", table_name="workshop_requests", schema="institution")
    op.drop_index("ix_workshop_requests_status", table_name="workshop_requests", schema="institution")
    op.drop_table("workshop_requests", schema="institution")
