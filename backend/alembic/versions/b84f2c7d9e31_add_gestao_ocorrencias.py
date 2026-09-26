"""add gestao ocorrencias

Revision ID: b84f2c7d9e31
Revises: a73d1c9e5b42
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b84f2c7d9e31"
down_revision: Union[str, None] = "a73d1c9e5b42"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ocorrencias",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("data", sa.Date(), nullable=False),
        sa.Column("chefe_equipe_id", sa.Integer(), nullable=False),
        sa.Column("funcionario_id", sa.Integer(), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=False),
        sa.Column("criado_por_id", sa.Integer(), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["chefe_equipe_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["funcionario_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["criado_por_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ocorrencias_id"), "ocorrencias", ["id"], unique=False)
    op.create_index(op.f("ix_ocorrencias_data"), "ocorrencias", ["data"], unique=False)
    op.create_index(op.f("ix_ocorrencias_chefe_equipe_id"), "ocorrencias", ["chefe_equipe_id"], unique=False)
    op.create_index(op.f("ix_ocorrencias_funcionario_id"), "ocorrencias", ["funcionario_id"], unique=False)
    op.create_index(op.f("ix_ocorrencias_criado_por_id"), "ocorrencias", ["criado_por_id"], unique=False)

    op.create_table(
        "ocorrencia_testemunhas",
        sa.Column("ocorrencia_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["ocorrencia_id"], ["ocorrencias.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("ocorrencia_id", "user_id"),
    )


def downgrade() -> None:
    op.drop_table("ocorrencia_testemunhas")
    op.drop_index(op.f("ix_ocorrencias_criado_por_id"), table_name="ocorrencias")
    op.drop_index(op.f("ix_ocorrencias_funcionario_id"), table_name="ocorrencias")
    op.drop_index(op.f("ix_ocorrencias_chefe_equipe_id"), table_name="ocorrencias")
    op.drop_index(op.f("ix_ocorrencias_data"), table_name="ocorrencias")
    op.drop_index(op.f("ix_ocorrencias_id"), table_name="ocorrencias")
    op.drop_table("ocorrencias")
