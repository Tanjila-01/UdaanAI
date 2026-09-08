"""006_add_unique_active_goal_index

Revision ID: 006_add_unique_active_goal_index
Revises: 005_add_is_active_to_milestones
Create Date: 2026-09-08 16:00:00.000000

MIGRATION & RECOVERY PLAN:
1. Pre-Migration Safety Check (Duplicate Detection):
   Before creating the partial unique index, this migration queries for existing records:
   SELECT student_id, COUNT(*) FROM roadmap.student_goals WHERE status = 'ACTIVE' GROUP BY student_id HAVING COUNT(*) > 1;
   If any student has multiple active goals, the migration aborts with a detailed RuntimeError without modifying data.

2. Non-Destructive Operation:
   Creates a partial unique index 'uq_student_active_goal' on student_goals(student_id) WHERE status = 'ACTIVE'.
   Existing records are NOT deleted, updated, or reset.

3. Lock Implications in Production PostgreSQL:
   - Standard CREATE UNIQUE INDEX acquires a SHARE lock on the table, which blocks concurrent writes (INSERTS/UPDATES)
     for the duration of the index build. Reads (SELECTs) continue without interruption.
   - For high-traffic production with large datasets, the recommended operational approach is CREATE UNIQUE INDEX CONCURRENTLY.
     Note: In PostgreSQL, CONCURRENTLY cannot run inside a multi-statement transaction block (Alembic default transaction).
     To execute CONCURRENTLY, run with autocommit_block() or execute the DDL directly outside an Alembic transaction.

4. Complete Backup & Restoration Verification Plan (Against Disposable Database Only):
   Note: roadmap.student_goals and roadmap.student_milestone_progress have foreign key constraints
   referencing roadmap.pathways, roadmap.pathway_options, and roadmap.pathway_milestones.
   Additionally, Alembic migration state is tracked in roadmap.alembic_version.
   Restoration requires preserving Alembic metadata and referenced tables, or explicitly verifying
   revision 005 schema compatibility before stamping.

   Step A: Pre-migration backup command from live database (preserving alembic_version and prerequisite tables):
     pg_dump -h <live-host> -U <live-user> -d <live-db> -n roadmap \
       -t roadmap.alembic_version \
       -t roadmap.pathways -t roadmap.pathway_options -t roadmap.pathway_milestones \
       -t roadmap.student_goals -t roadmap.student_milestone_progress \
       -Fc -f backup_roadmap_pre_006.dump

   Step B: Verification on a SEPARATE DISPOSABLE staging/test database (NEVER the live database):
     # 1. Create a disposable scratch database
     createdb -h <test-host> -U <test-user> udaan_restore_verification
     # 2. Ensure schema exists or restore the complete dump
     psql -h <test-host> -U <test-user> -d udaan_restore_verification -c "CREATE SCHEMA IF NOT EXISTS roadmap;"
     pg_restore -h <test-host> -U <test-user> -d udaan_restore_verification --clean --if-exists backup_roadmap_pre_006.dump

     # 3. Verify Alembic migration-version metadata:
     # If alembic_version was restored from dump, confirm current revision is '005_add_is_active_to_milestones':
     psql -h <test-host> -U <test-user> -d udaan_restore_verification -c "SELECT version_num FROM roadmap.alembic_version;"

     # If restoring from a dump lacking alembic_version metadata, NEVER blindly stamp an unknown schema.
     # Verify that schema matches revision 005 before stamping:
     # Check that roadmap.pathway_milestones has is_active column (added in 005)
     # Check that roadmap.pathways has recommendation_dimensions (004) and parent_id (003)
     # Check that roadmap.student_goals and student_milestone_progress exist (002)
     psql -h <test-host> -U <test-user> -d udaan_restore_verification -c "
       SELECT column_name FROM information_schema.columns 
       WHERE table_schema = 'roadmap' AND table_name = 'pathway_milestones' AND column_name = 'is_active';
     "
     # Only after schema verification confirms revision 005 compatibility, stamp if table was absent:
     # DATABASE_URL=\"postgresql://<test-user>:<test-pass>@<test-host>:5432/udaan_restore_verification\" alembic stamp 005_add_is_active_to_milestones

     # 4. Verify record integrity and row counts
     psql -h <test-host> -U <test-user> -d udaan_restore_verification -c "SELECT count(*) FROM roadmap.student_goals;"
     psql -h <test-host> -U <test-user> -d udaan_restore_verification -c "SELECT count(*) FROM roadmap.student_milestone_progress;"

     # 5. Dry-run migration 006 against the disposable database
     DATABASE_URL="postgresql://<test-user>:<test-pass>@<test-host>:5432/udaan_restore_verification" alembic upgrade 006_add_unique_active_goal_index

     # 6. Clean up scratch database
     dropdb -h <test-host> -U <test-user> udaan_restore_verification

   Step C: Rollback / Downgrade Plan (if ever needed on live after scheduled migration):
     alembic downgrade 005_add_is_active_to_milestones
     (Cleanly drops the partial unique index uq_student_active_goal).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "006_add_unique_active_goal_index"
down_revision: Union[str, None] = "005_add_is_active_to_milestones"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    schema = "roadmap"
    bind = op.get_bind()

    # Pre-migration safety check: detect existing duplicate active goals
    check_sql = sa.text(f"""
        SELECT student_id, COUNT(*) as active_count
        FROM {schema}.student_goals
        WHERE status = 'ACTIVE'
        GROUP BY student_id
        HAVING COUNT(*) > 1
    """)
    try:
        duplicates = bind.execute(check_sql).fetchall()
        if duplicates:
            dup_details = ", ".join(f"student_id={row[0]} (active_count={row[1]})" for row in duplicates)
            raise RuntimeError(
                f"Cannot create partial unique index 'uq_student_active_goal'. "
                f"Found {len(duplicates)} student(s) with multiple ACTIVE goals: {dup_details}. "
                f"Please review and resolve these conflicting records before applying the migration. "
                f"No student data was altered."
            )
    except Exception as exc:
        if "does not exist" in str(exc).lower() or "no such table" in str(exc).lower():
            pass
        elif isinstance(exc, RuntimeError):
            raise
        else:
            raise

    # Create partial unique index
    op.create_index(
        "uq_student_active_goal",
        "student_goals",
        ["student_id"],
        unique=True,
        schema=schema,
        postgresql_where=sa.text("status = 'ACTIVE'"),
        sqlite_where=sa.text("status = 'ACTIVE'"),
    )


def downgrade() -> None:
    schema = "roadmap"
    op.drop_index(
        "uq_student_active_goal",
        table_name="student_goals",
        schema=schema,
    )
