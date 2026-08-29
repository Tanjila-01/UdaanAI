"""002_add_assessment_versioning

Revision ID: 002
Revises: 001
Create Date: 2026-08-28 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add columns to assessments table
    op.add_column(
        "assessments",
        sa.Column("target_level", sa.String(length=50), nullable=False, server_default="Class 10"),
        schema="assessment",
    )
    op.add_column(
        "assessments",
        sa.Column("target_stream", sa.String(length=50), nullable=True),
        schema="assessment",
    )
    op.add_column(
        "assessments",
        sa.Column("assessment_version", sa.String(length=50), nullable=False, server_default="v1"),
        schema="assessment",
    )
    op.add_column(
        "assessments",
        sa.Column("scoring_version", sa.String(length=50), nullable=False, server_default="rule-v1"),
        schema="assessment",
    )

    # Add columns to assessment_results table
    op.add_column(
        "assessment_results",
        sa.Column("assessment_id", sa.String(length=50), nullable=False, server_default="karnataka-sslc-interest-v1"),
        schema="assessment",
    )
    op.add_column(
        "assessment_results",
        sa.Column("assessment_version", sa.String(length=50), nullable=False, server_default="v1"),
        schema="assessment",
    )
    op.add_column(
        "assessment_results",
        sa.Column("scoring_version", sa.String(length=50), nullable=False, server_default="rule-v1"),
        schema="assessment",
    )


def downgrade() -> None:
    # Remove columns from assessments table
    op.drop_column("assessments", "target_level", schema="assessment")
    op.drop_column("assessments", "target_stream", schema="assessment")
    op.drop_column("assessments", "assessment_version", schema="assessment")
    op.drop_column("assessments", "scoring_version", schema="assessment")

    # Remove columns from assessment_results table
    op.drop_column("assessment_results", "assessment_id", schema="assessment")
    op.drop_column("assessment_results", "assessment_version", schema="assessment")
    op.drop_column("assessment_results", "scoring_version", schema="assessment")
