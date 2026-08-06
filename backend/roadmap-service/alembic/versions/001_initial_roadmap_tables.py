"""001_initial_roadmap_tables

Revision ID: 001_initial_roadmap_tables
Revises: 
Create Date: 2026-08-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_roadmap_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure roadmap schema exists
    op.execute("CREATE SCHEMA IF NOT EXISTS roadmap;")

    # 1. Create roadmap.pathways table
    op.create_table(
        'pathways',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('education_level', sa.String(length=50), nullable=False),
        sa.Column('stream', sa.String(length=50), nullable=True),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('duration', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        schema='roadmap'
    )
    op.create_index(op.f('ix_roadmap_pathways_education_level'), 'pathways', ['education_level'], unique=False, schema='roadmap')
    op.create_index(op.f('ix_roadmap_pathways_stream'), 'pathways', ['stream'], unique=False, schema='roadmap')

    # 2. Create roadmap.pathway_options table
    op.create_table(
        'pathway_options',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('pathway_id', sa.String(length=50), nullable=False),
        sa.Column('option_name', sa.String(length=150), nullable=False),
        sa.Column('stream_or_code', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('eligibility', sa.String(length=255), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['pathway_id'], ['roadmap.pathways.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pathway_id', 'display_order', name='uq_pathway_option_display_order'),
        schema='roadmap'
    )

    # 3. Create roadmap.pathway_milestones table
    op.create_table(
        'pathway_milestones',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('pathway_id', sa.String(length=50), nullable=False),
        sa.Column('step_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('key_action', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['pathway_id'], ['roadmap.pathways.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pathway_id', 'step_number', name='uq_pathway_milestone_step_number'),
        schema='roadmap'
    )


def downgrade() -> None:
    op.drop_table('pathway_milestones', schema='roadmap')
    op.drop_table('pathway_options', schema='roadmap')
    op.drop_index(op.f('ix_roadmap_pathways_stream'), table_name='pathways', schema='roadmap')
    op.drop_index(op.f('ix_roadmap_pathways_education_level'), table_name='pathways', schema='roadmap')
    op.drop_table('pathways', schema='roadmap')
