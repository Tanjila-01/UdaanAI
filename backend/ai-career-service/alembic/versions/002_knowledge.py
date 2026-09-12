"""Local knowledge documents and 1024-dimensional Qwen embeddings."""
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public")
    op.execute("""
        CREATE TABLE career_ai.knowledge_documents (
            id text PRIMARY KEY,
            checksum text NOT NULL,
            metadata jsonb NOT NULL,
            active boolean NOT NULL DEFAULT true,
            updated_at timestamptz NOT NULL DEFAULT now()
        )
    """)
    op.execute("""
        CREATE TABLE career_ai.knowledge_chunks (
            id text PRIMARY KEY,
            document_id text NOT NULL REFERENCES career_ai.knowledge_documents(id) ON DELETE CASCADE,
            ordinal integer NOT NULL,
            heading text NOT NULL,
            content text NOT NULL,
            embedding public.vector(1024) NOT NULL,
            embedding_model text NOT NULL,
            model_digest text NOT NULL,
            recipe text NOT NULL,
            UNIQUE(document_id, ordinal)
        )
    """)
    op.execute("CREATE INDEX ix_knowledge_chunks_document ON career_ai.knowledge_chunks(document_id)")
    op.execute("CREATE INDEX ix_knowledge_documents_metadata ON career_ai.knowledge_documents USING gin(metadata)")
    # Exact cosine search is sufficient for this small corpus and avoids ANN filter recall loss.


def downgrade():
    op.execute("DROP TABLE career_ai.knowledge_chunks")
    op.execute("DROP TABLE career_ai.knowledge_documents")
    # Leave the shared extension available to other schemas.
