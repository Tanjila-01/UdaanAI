"""Migrate knowledge_chunks embedding column from vector(1024) to vector(384) for all-MiniLM-L6-v2."""
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade():
    # Convert embedding column from 1024 dimensions (Qwen) to 384 dimensions (MiniLM).
    # Drop NOT NULL temporarily to allow dimension change without destroying chunk rows.
    op.execute("ALTER TABLE career_ai.knowledge_chunks ALTER COLUMN embedding DROP NOT NULL")
    op.execute("ALTER TABLE career_ai.knowledge_chunks ALTER COLUMN embedding TYPE public.vector(384) USING NULL")


def downgrade():
    op.execute("ALTER TABLE career_ai.knowledge_chunks ALTER COLUMN embedding DROP NOT NULL")
    op.execute("ALTER TABLE career_ai.knowledge_chunks ALTER COLUMN embedding TYPE public.vector(1024) USING NULL")
