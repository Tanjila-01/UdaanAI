"""004_add_recommendation_dimensions

Revision ID: 004_add_recommendation_dimensions
Revises: 003_add_pathway_parent_id
Create Date: 2026-08-28 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision = "004_add_recommendation_dimensions"
down_revision = "003_add_pathway_parent_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "pathways",
        sa.Column("recommendation_dimensions", sa.JSON(), nullable=True),
        schema="roadmap",
    )


def downgrade() -> None:
    op.drop_column("pathways", "recommendation_dimensions", schema="roadmap")
