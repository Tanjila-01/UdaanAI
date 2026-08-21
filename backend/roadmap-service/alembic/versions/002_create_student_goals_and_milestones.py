"""002_create_student_goals_and_milestones

Revision ID: 002_create_student_goals_and_milestones
Revises: 001_initial_roadmap_tables
Create Date: 2026-08-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_create_student_goals_and_milestones'
down_revision: Union[str, None] = '001_initial_roadmap_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create roadmap.student_goals table
    op.create_table(
        'student_goals',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('pathway_id', sa.String(length=50), nullable=False),
        sa.Column('pathway_option_id', sa.UUID(), nullable=True),
        sa.Column('goal_title', sa.String(length=150), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='ACTIVE', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['pathway_id'], ['roadmap.pathways.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pathway_option_id'], ['roadmap.pathway_options.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        schema='roadmap'
    )
    op.create_index(op.f('ix_roadmap_student_goals_student_id'), 'student_goals', ['student_id'], unique=False, schema='roadmap')

    # 2. Create roadmap.student_milestone_progress table
    op.create_table(
        'student_milestone_progress',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('goal_id', sa.UUID(), nullable=False),
        sa.Column('milestone_id', sa.UUID(), nullable=False),
        sa.Column('step_number', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='LOCKED', nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['goal_id'], ['roadmap.student_goals.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['milestone_id'], ['roadmap.pathway_milestones.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('goal_id', 'milestone_id', name='uq_student_goal_milestone'),
        schema='roadmap'
    )
    op.create_index(op.f('ix_roadmap_student_milestone_progress_goal_id'), 'student_milestone_progress', ['goal_id'], unique=False, schema='roadmap')


def downgrade() -> None:
    op.drop_index(op.f('ix_roadmap_student_milestone_progress_goal_id'), table_name='student_milestone_progress', schema='roadmap')
    op.drop_table('student_milestone_progress', schema='roadmap')
    op.drop_index(op.f('ix_roadmap_student_goals_student_id'), table_name='student_goals', schema='roadmap')
    op.drop_table('student_goals', schema='roadmap')
