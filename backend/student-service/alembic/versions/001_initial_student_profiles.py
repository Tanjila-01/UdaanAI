"""Initial student profiles schema with stream, diploma_branch, and iti_trade columns

Revision ID: 001_initial_student_profiles
Revises: 
Create Date: 2026-08-04

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_student_profiles'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS student;")
    op.execute("""
        CREATE TABLE IF NOT EXISTS student.student_profiles (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL UNIQUE,
            full_name VARCHAR(255) NOT NULL,
            current_level VARCHAR(100) NOT NULL,
            class_or_year VARCHAR(50) NOT NULL,
            board VARCHAR(150) NOT NULL,
            stream VARCHAR(100),
            diploma_branch VARCHAR(150),
            iti_trade VARCHAR(150),
            institution_name VARCHAR(255) NOT NULL,
            district VARCHAR(150) NOT NULL,
            state VARCHAR(100) NOT NULL DEFAULT 'Karnataka',
            preferred_language VARCHAR(50),
            is_complete BOOLEAN NOT NULL DEFAULT FALSE,
            completion_percentage INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """)
    # Ensure columns exist safely if table pre-existed from earlier phase
    op.execute("ALTER TABLE student.student_profiles ADD COLUMN IF NOT EXISTS stream VARCHAR(100);")
    op.execute("ALTER TABLE student.student_profiles ADD COLUMN IF NOT EXISTS diploma_branch VARCHAR(150);")
    op.execute("ALTER TABLE student.student_profiles ADD COLUMN IF NOT EXISTS iti_trade VARCHAR(150);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_student_student_profiles_user_id ON student.student_profiles (user_id);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS student.student_profiles;")
