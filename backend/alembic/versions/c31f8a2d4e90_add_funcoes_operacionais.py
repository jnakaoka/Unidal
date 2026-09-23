"""add funcoes operacionais

Revision ID: c31f8a2d4e90
Revises: f5b2c65bf301
Create Date: 2026-09-23
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c31f8a2d4e90"
down_revision: Union[str, None] = "f5b2c65bf301"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "funcoes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("codigo", sa.String(length=64), nullable=False),
        sa.Column("nome", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo"),
        sa.UniqueConstraint("nome"),
    )
    op.create_index(op.f("ix_funcoes_id"), "funcoes", ["id"], unique=False)
    op.create_index(op.f("ix_funcoes_codigo"), "funcoes", ["codigo"], unique=True)

    op.create_table(
        "usuario_funcoes",
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("funcao_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["funcao_id"], ["funcoes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("usuario_id", "funcao_id"),
    )

    funcoes = sa.table(
        "funcoes",
        sa.column("codigo", sa.String()),
        sa.column("nome", sa.String()),
        sa.column("is_active", sa.Boolean()),
    )
    op.bulk_insert(
        funcoes,
        [
            {"codigo": "CHEFE_EQUIPE", "nome": "Chefe de equipa", "is_active": True},
            {"codigo": "RESPONSAVEL_ESTaleiro", "nome": "Responsável do estaleiro", "is_active": True},
            {"codigo": "CONDUTOR", "nome": "Condutor", "is_active": True},
        ],
    )

    # Compatibilidade: quem já era condutor recebe também a nova função.
    op.execute(
        """
        INSERT INTO usuario_funcoes (usuario_id, funcao_id)
        SELECT u.id, f.id
        FROM users u
        JOIN funcoes f ON f.codigo = 'CONDUTOR'
        WHERE u.e_condutor = 1
        """
    )


def downgrade() -> None:
    op.drop_table("usuario_funcoes")
    op.drop_index(op.f("ix_funcoes_codigo"), table_name="funcoes")
    op.drop_index(op.f("ix_funcoes_id"), table_name="funcoes")
    op.drop_table("funcoes")
