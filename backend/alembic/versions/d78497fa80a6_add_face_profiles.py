"""add face profiles

Revision ID: d78497fa80a6
Revises: a73d1c9e5b42
Create Date: 2026-09-18 13:07:31.822797
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d78497fa80a6"
down_revision: Union[str, None] = "a73d1c9e5b42"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "face_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("embedding", sa.LargeBinary(), nullable=True),
        sa.Column("model_version", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("enrolled_by", sa.Integer(), nullable=True),
        sa.Column("enrolled_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["enrolled_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_face_profiles_user_id"),
    )
    op.create_index(op.f("ix_face_profiles_id"), "face_profiles", ["id"], unique=False)
    op.create_index(op.f("ix_face_profiles_user_id"), "face_profiles", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_face_profiles_user_id"), table_name="face_profiles")
    op.drop_index(op.f("ix_face_profiles_id"), table_name="face_profiles")
    op.drop_table("face_profiles")
