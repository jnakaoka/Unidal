"""create veiculos table

Revision ID: b71b8ee32720
Revises: 4e74a3514675
Create Date: 2026-08-15

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b71b8ee32720"
down_revision: Union[str, None] = "4e74a3514675"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "veiculos",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "matricula",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column(
            "matricula_normalizada",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column(
            "tipo",
            sa.String(length=30),
            nullable=False,
            server_default=sa.text("'carrinha'"),
        ),
        sa.Column(
            "descricao",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "ativo",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("1"),
        ),
        sa.Column(
            "criado_em",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_veiculos_id",
        "veiculos",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_veiculos_matricula_normalizada",
        "veiculos",
        ["matricula_normalizada"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_veiculos_matricula_normalizada",
        table_name="veiculos",
    )

    op.drop_index(
        "ix_veiculos_id",
        table_name="veiculos",
    )

    op.drop_table("veiculos")