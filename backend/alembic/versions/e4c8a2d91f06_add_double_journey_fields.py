"""add double journey fields

Revision ID: e4c8a2d91f06
Revises: b557ffcd2731
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e4c8a2d91f06"
down_revision: Union[str, None] = "b557ffcd2731"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "registros_hora",
        sa.Column(
            "double_journey_lider",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "registros_hora_equipa",
        sa.Column(
            "double_journey",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("registros_hora_equipa", "double_journey")
    op.drop_column("registros_hora", "double_journey_lider")
