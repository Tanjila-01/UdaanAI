"""001_create_career_recommendations_tables

Revision ID: 001
Revises: 
Create Date: 2026-08-28 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS career_ai")

    op.create_table(
        "career_recommendation_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source_scoring_version", sa.String(length=50), nullable=False),
        sa.Column("disclaimer", sa.String(length=255), nullable=False),
        sa.Column("source_assessment_id", sa.String(length=50), nullable=True),
        sa.Column("source_attempt_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        schema="career_ai",
    )
    op.create_index(
        "ix_career_recommendation_results_user_id",
        "career_recommendation_results",
        ["user_id"],
        unique=False,
        schema="career_ai",
    )

    op.create_table(
        "career_recommendation_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("result_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("pathway_id", sa.String(length=50), nullable=False),
        sa.Column("pathway_title", sa.String(length=255), nullable=False),
        sa.Column("match_score", sa.Integer(), nullable=False),
        sa.Column("match_label", sa.String(length=20), nullable=False),
        sa.Column("reasons", sa.JSON(), nullable=False),
        sa.Column("eligibility_warning", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(
            ["result_id"],
            ["career_ai.career_recommendation_results.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        schema="career_ai",
    )
    op.create_index(
        "ix_career_recommendation_items_result_id",
        "career_recommendation_items",
        ["result_id"],
        unique=False,
        schema="career_ai",
    )


def downgrade() -> None:
    op.drop_index(
        "ix_career_recommendation_items_result_id",
        table_name="career_recommendation_items",
        schema="career_ai",
    )
    op.drop_table("career_recommendation_items", schema="career_ai")

    op.drop_index(
        "ix_career_recommendation_results_user_id",
        table_name="career_recommendation_results",
        schema="career_ai",
    )
    op.drop_table("career_recommendation_results", schema="career_ai")
