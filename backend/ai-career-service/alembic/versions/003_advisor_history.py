"""Student-owned advisor answer history."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('advisor_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('question', sa.String(1000), nullable=False),
        sa.Column('request', postgresql.JSONB(), nullable=False),
        sa.Column('response', postgresql.JSONB(), nullable=False), schema='career_ai')
    op.create_index('ix_advisor_history_owner_created', 'advisor_history', ['user_id', 'created_at', 'id'], schema='career_ai')

def downgrade():
    op.drop_table('advisor_history', schema='career_ai')
