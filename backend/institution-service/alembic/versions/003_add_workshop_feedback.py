"""Add workshop_feedbacks table
 
Revision ID: 003_add_workshop_feedback
Revises: 002_add_sub_and_dup_hashes
Create Date: 2026-09-10 12:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic (max 32 chars).
revision: str = "003_add_workshop_feedback"
down_revision: Union[str, None] = "002_add_sub_and_dup_hashes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "workshop_feedbacks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "request_id",
            UUID(as_uuid=True),
            sa.ForeignKey("institution.workshop_requests.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("feedback_token", sa.String(length=64), nullable=False, unique=True),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("comments", sa.String(length=1000), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
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
    op.create_index(
        "ix_workshop_feedbacks_feedback_token",
        "workshop_feedbacks",
        ["feedback_token"],
        unique=True,
        schema="institution",
    )


def downgrade() -> None:
    op.drop_index(
        "ix_workshop_feedbacks_feedback_token",
        table_name="workshop_feedbacks",
        schema="institution",
    )
    op.drop_table("workshop_feedbacks", schema="institution")
