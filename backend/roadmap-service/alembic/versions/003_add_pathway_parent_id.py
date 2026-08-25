"""003_add_pathway_parent_id

Revision ID: 003_add_pathway_parent_id
Revises: 002_create_student_goals_and_milestones
Create Date: 2026-08-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_add_pathway_parent_id'
down_revision: Union[str, None] = '002_create_student_goals_and_milestones'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add parent_id column to roadmap.pathways table
    op.add_column(
        'pathways',
        sa.Column('parent_id', sa.String(length=50), nullable=True),
        schema='roadmap'
    )
    # Add self-referential foreign key constraint
    op.create_foreign_key(
        'fk_pathways_parent_id',
        'pathways', 'pathways',
        ['parent_id'], ['id'],
        source_schema='roadmap', referent_schema='roadmap',
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_pathways_parent_id', 'pathways', schema='roadmap', type_='foreignkey')
    op.drop_column('pathways', 'parent_id', schema='roadmap')
