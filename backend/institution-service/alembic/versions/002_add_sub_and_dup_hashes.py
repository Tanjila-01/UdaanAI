"""Add submission_id, payload_hash, and active_duplicate_hash to workshop_requests

Revision ID: 002_add_sub_and_dup_hashes
Revises: 001_initial_workshop_tables
Create Date: 2026-09-10 11:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic (max 32 chars).
revision: str = "002_add_sub_and_dup_hashes"
down_revision: Union[str, None] = "001_initial_workshop_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "workshop_requests",
        sa.Column("submission_id", sa.String(length=64), nullable=True),
        schema="institution",
    )
    op.add_column(
        "workshop_requests",
        sa.Column("payload_hash", sa.String(length=64), nullable=True),
        schema="institution",
    )
    op.add_column(
        "workshop_requests",
        sa.Column("active_duplicate_hash", sa.String(length=64), nullable=True),
        schema="institution",
    )
    op.create_index(
        "ix_workshop_requests_submission_id",
        "workshop_requests",
        ["submission_id"],
        unique=True,
        schema="institution",
    )
    op.create_index(
        "ix_workshop_requests_active_duplicate",
        "workshop_requests",
        ["active_duplicate_hash"],
        unique=True,
        postgresql_where=sa.text("status IN ('NEW', 'CONTACTED', 'SCHEDULED')"),
        schema="institution",
    )


def downgrade() -> None:
    op.drop_index(
        "ix_workshop_requests_active_duplicate",
        table_name="workshop_requests",
        schema="institution",
    )
    op.drop_index(
        "ix_workshop_requests_submission_id",
        table_name="workshop_requests",
        schema="institution",
    )
    op.drop_column("workshop_requests", "active_duplicate_hash", schema="institution")
    op.drop_column("workshop_requests", "payload_hash", schema="institution")
    op.drop_column("workshop_requests", "submission_id", schema="institution")
