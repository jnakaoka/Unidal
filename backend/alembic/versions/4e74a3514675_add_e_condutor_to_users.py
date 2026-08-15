"""add e_condutor to users

Revision ID: 4e74a3514675
Revises: c7ccf17ce974
Create Date: 2026-08-15

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4e74a3514675"
down_revision: Union[str, None] = "c7ccf17ce974"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "e_condutor",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )

    # Todo utilizador com perfil motorista já é necessariamente condutor.
    op.execute(
        sa.text(
            """
            UPDATE users AS u
            INNER JOIN perfis AS p
                ON p.id = u.perfil_id
            SET u.e_condutor = 1
            WHERE LOWER(TRIM(p.nome)) = 'motorista'
            """
        )
    )


def downgrade() -> None:
    op.drop_column("users", "e_condutor")