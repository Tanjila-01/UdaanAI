"""Add general_inquiries table
 
Revision ID: 004_add_general_inquiries
Revises: 003_add_workshop_feedback
Create Date: 2026-09-14 19:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "004_add_general_inquiries"
down_revision: Union[str, None] = "003_add_workshop_feedback"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "general_inquiries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("subject", sa.String(length=150), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="NEW"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        schema="institution",
    )
    op.create_index(
        "ix_general_inquiries_status",
        "general_inquiries",
        ["status"],
        unique=False,
        schema="institution",
    )
    op.create_index(
        "ix_general_inquiries_created_at",
        "general_inquiries",
        ["created_at"],
        unique=False,
        schema="institution",
    )


def downgrade() -> None:
    op.drop_index(
        "ix_general_inquiries_created_at",
        table_name="general_inquiries",
        schema="institution",
    )
    op.drop_index(
        "ix_general_inquiries_status",
        table_name="general_inquiries",
        schema="institution",
    )
    op.drop_table("general_inquiries", schema="institution")
