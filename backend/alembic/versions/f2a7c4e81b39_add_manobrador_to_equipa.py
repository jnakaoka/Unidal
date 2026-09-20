"""add manobrador to equipa

Revision ID: f2a7c4e81b39
Revises: e4c8a2d91f06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f2a7c4e81b39"
down_revision: Union[str, None] = "e4c8a2d91f06"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "registros_hora_equipa",
        sa.Column("e_manobrador", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("registros_hora_equipa", "e_manobrador")
