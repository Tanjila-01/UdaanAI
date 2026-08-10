"""001_initial_assessment_tables

Revision ID: 001
Revises: 
Create Date: 2026-08-10 11:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS assessment")

    op.create_table(
        "assessments",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False, server_default="general"),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        schema="assessment",
    )

    op.create_table(
        "assessment_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_id", sa.String(length=50), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("dimension", sa.String(length=50), nullable=False, server_default="general"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="1"),
        sa.ForeignKeyConstraint(
            ["assessment_id"],
            ["assessment.assessments.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("assessment_id", "display_order", name="uq_question_display_order"),
        schema="assessment",
    )
    op.create_index(
        "ix_assessment_questions_assessment_id",
        "assessment_questions",
        ["assessment_id"],
        unique=False,
        schema="assessment",
    )

    op.create_table(
        "assessment_question_options",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("option_text", sa.String(length=255), nullable=False),
        sa.Column("option_code", sa.String(length=50), nullable=False),
        sa.Column("weight_dimension", sa.String(length=50), nullable=False),
        sa.Column("weight_score", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="1"),
        sa.ForeignKeyConstraint(
            ["question_id"],
            ["assessment.assessment_questions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        schema="assessment",
    )
    op.create_index(
        "ix_assessment_question_options_question_id",
        "assessment_question_options",
        ["question_id"],
        unique=False,
        schema="assessment",
    )

    op.create_table(
        "assessment_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_id", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="in_progress"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["assessment_id"],
            ["assessment.assessments.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        schema="assessment",
    )
    op.create_index(
        "ix_assessment_attempts_student_id",
        "assessment_attempts",
        ["student_id"],
        unique=False,
        schema="assessment",
    )
    op.create_index(
        "ix_assessment_attempts_assessment_id",
        "assessment_attempts",
        ["assessment_id"],
        unique=False,
        schema="assessment",
    )

    op.create_table(
        "assessment_answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attempt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("selected_option_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["attempt_id"],
            ["assessment.assessment_attempts.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["question_id"],
            ["assessment.assessment_questions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["selected_option_id"],
            ["assessment.assessment_question_options.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question_answer"),
        schema="assessment",
    )
    op.create_index(
        "ix_assessment_answers_attempt_id",
        "assessment_answers",
        ["attempt_id"],
        unique=False,
        schema="assessment",
    )

    op.create_table(
        "assessment_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attempt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("primary_stream_recommendation", sa.String(length=50), nullable=False),
        sa.Column("secondary_stream_recommendation", sa.String(length=50), nullable=True),
        sa.Column("top_career_match", sa.String(length=100), nullable=False),
        sa.Column("dimension_scores", sa.JSON(), nullable=False),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["attempt_id"],
            ["assessment.assessment_attempts.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("attempt_id"),
        schema="assessment",
    )
    op.create_index(
        "ix_assessment_results_user_id",
        "assessment_results",
        ["user_id"],
        unique=False,
        schema="assessment",
    )


def downgrade() -> None:
    op.drop_index("ix_assessment_results_user_id", table_name="assessment_results", schema="assessment")
    op.drop_table("assessment_results", schema="assessment")

    op.drop_index("ix_assessment_answers_attempt_id", table_name="assessment_answers", schema="assessment")
    op.drop_table("assessment_answers", schema="assessment")

    op.drop_index("ix_assessment_attempts_assessment_id", table_name="assessment_attempts", schema="assessment")
    op.drop_index("ix_assessment_attempts_student_id", table_name="assessment_attempts", schema="assessment")
    op.drop_table("assessment_attempts", schema="assessment")

    op.drop_index("ix_assessment_question_options_question_id", table_name="assessment_question_options", schema="assessment")
    op.drop_table("assessment_question_options", schema="assessment")

    op.drop_index("ix_assessment_questions_assessment_id", table_name="assessment_questions", schema="assessment")
    op.drop_table("assessment_questions", schema="assessment")

    op.drop_table("assessments", schema="assessment")
