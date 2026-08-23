"""create cartao veiculo associacoes table

Revision ID: 30f127731379
Revises: 8bb128cb6231
Create Date: 2026-08-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "30f127731379"
down_revision: Union[str, None] = "8bb128cb6231"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cartao_veiculo_associacoes",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "cartao_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "veiculo_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "associado_em",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "desassociado_em",
            sa.DateTime(),
            nullable=True,
        ),
        sa.Column(
            "associado_por_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "desassociado_por_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "observacoes",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "cartao_ativo_id",
            sa.Integer(),
            sa.Computed(
                (
                    "CASE WHEN desassociado_em IS NULL "
                    "THEN cartao_id ELSE NULL END"
                ),
                persisted=True,
            ),
            nullable=True,
        ),
        sa.Column(
            "criado_em",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "atualizado_em",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.CheckConstraint(
            (
                "desassociado_em IS NULL "
                "OR desassociado_em >= associado_em"
            ),
            name=(
                "ck_cartao_veiculo_associacoes_"
                "periodo"
            ),
        ),
        sa.CheckConstraint(
            (
                "("
                "desassociado_em IS NULL "
                "AND desassociado_por_id IS NULL"
                ") OR ("
                "desassociado_em IS NOT NULL "
                "AND desassociado_por_id IS NOT NULL"
                ")"
            ),
            name=(
                "ck_cartao_veiculo_associacoes_"
                "encerramento"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["cartao_id"],
            ["cartoes.id"],
            name=(
                "fk_cartao_veiculo_associacoes_"
                "cartao_id"
            ),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["veiculo_id"],
            ["veiculos.id"],
            name=(
                "fk_cartao_veiculo_associacoes_"
                "veiculo_id"
            ),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["associado_por_id"],
            ["users.id"],
            name=(
                "fk_cartao_veiculo_associacoes_"
                "associado_por_id"
            ),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["desassociado_por_id"],
            ["users.id"],
            name=(
                "fk_cartao_veiculo_associacoes_"
                "desassociado_por_id"
            ),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name="pk_cartao_veiculo_associacoes",
        ),
        sa.UniqueConstraint(
            "cartao_ativo_id",
            name=(
                "uq_cartao_veiculo_associacoes_"
                "cartao_ativo"
            ),
        ),
    )

    op.create_index(
        "ix_cartao_veiculo_associacoes_id",
        "cartao_veiculo_associacoes",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_cartao_veiculo_associacoes_cartao_id",
        "cartao_veiculo_associacoes",
        ["cartao_id"],
        unique=False,
    )

    op.create_index(
        "ix_cartao_veiculo_associacoes_veiculo_id",
        "cartao_veiculo_associacoes",
        ["veiculo_id"],
        unique=False,
    )

    op.create_index(
        (
            "ix_cartao_veiculo_associacoes_"
            "associado_por_id"
        ),
        "cartao_veiculo_associacoes",
        ["associado_por_id"],
        unique=False,
    )

    op.create_index(
        (
            "ix_cartao_veiculo_associacoes_"
            "desassociado_por_id"
        ),
        "cartao_veiculo_associacoes",
        ["desassociado_por_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("cartao_veiculo_associacoes")