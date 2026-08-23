"""create cartoes table

Revision ID: 8bb128cb6231
Revises: b71b8ee32720
Create Date: 2026-08-16

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8bb128cb6231"
down_revision: Union[str, None] = "b71b8ee32720"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cartoes",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "nome",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "identificador",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "identificador_normalizado",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "tipo",
            sa.String(length=30),
            nullable=False,
        ),
        sa.Column(
            "emissor",
            sa.String(length=100),
            nullable=True,
        ),
        sa.Column(
            "ultimos_quatro",
            sa.String(length=4),
            nullable=True,
        ),
        sa.Column(
            "validade_mes",
            sa.SmallInteger(),
            nullable=True,
        ),
        sa.Column(
            "validade_ano",
            sa.SmallInteger(),
            nullable=True,
        ),
        sa.Column(
            "estado",
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'ativo'"),
        ),
        sa.Column(
            "observacoes",
            sa.Text(),
            nullable=True,
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
        sa.CheckConstraint(
            """
            tipo IN (
                'bancario',
                'combustivel',
                'via_verde',
                'outro'
            )
            """,
            name="ck_cartoes_tipo",
        ),
        sa.CheckConstraint(
            """
            estado IN (
                'ativo',
                'bloqueado',
                'perdido',
                'cancelado',
                'expirado'
            )
            """,
            name="ck_cartoes_estado",
        ),
        sa.CheckConstraint(
            """
            validade_mes IS NULL
            OR validade_mes BETWEEN 1 AND 12
            """,
            name="ck_cartoes_validade_mes",
        ),
        sa.CheckConstraint(
            """
            validade_ano IS NULL
            OR validade_ano BETWEEN 2000 AND 2100
            """,
            name="ck_cartoes_validade_ano",
        ),
        sa.CheckConstraint(
            """
            (
                validade_mes IS NULL
                AND validade_ano IS NULL
            )
            OR
            (
                validade_mes IS NOT NULL
                AND validade_ano IS NOT NULL
            )
            """,
            name="ck_cartoes_validade_completa",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_cartoes_id",
        "cartoes",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_cartoes_identificador_normalizado",
        "cartoes",
        ["identificador_normalizado"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_cartoes_identificador_normalizado",
        table_name="cartoes",
    )

    op.drop_index(
        "ix_cartoes_id",
        table_name="cartoes",
    )

    op.drop_table("cartoes")