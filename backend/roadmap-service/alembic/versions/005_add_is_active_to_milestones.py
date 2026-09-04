"""005_add_is_active_to_milestones

Revision ID: 005_add_is_active_to_milestones
Revises: 004_add_recommendation_dimensions
Create Date: 2026-09-01 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "005_add_is_active_to_milestones"
down_revision = "004_add_recommendation_dimensions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "pathway_milestones",
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        schema="roadmap",
    )


def downgrade() -> None:
    op.drop_column("pathway_milestones", "is_active", schema="roadmap")
