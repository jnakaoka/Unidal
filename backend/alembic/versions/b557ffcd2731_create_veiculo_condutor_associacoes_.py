"""create veiculo condutor associacoes table

Revision ID: b557ffcd2731
Revises: 30f127731379
Create Date: 2026-08-21 14:03:19.278890
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b557ffcd2731"
down_revision: Union[str, None] = "30f127731379"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "veiculo_condutor_associacoes",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "veiculo_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "condutor_id",
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
            "veiculo_ativo_id",
            sa.Integer(),
            sa.Computed(
                (
                    "CASE WHEN desassociado_em IS NULL "
                    "THEN veiculo_id ELSE NULL END"
                ),
                persisted=True,
            ),
            nullable=True,
        ),
        sa.Column(
            "condutor_ativo_id",
            sa.Integer(),
            sa.Computed(
                (
                    "CASE WHEN desassociado_em IS NULL "
                    "THEN condutor_id ELSE NULL END"
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
                "ck_veiculo_condutor_associacoes_"
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
                "ck_veiculo_condutor_associacoes_"
                "encerramento"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["veiculo_id"],
            ["veiculos.id"],
            name=(
                "fk_veiculo_condutor_associacoes_"
                "veiculo_id"
            ),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["condutor_id"],
            ["users.id"],
            name=(
                "fk_veiculo_condutor_associacoes_"
                "condutor_id"
            ),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["associado_por_id"],
            ["users.id"],
            name=(
                "fk_veiculo_condutor_associacoes_"
                "associado_por_id"
            ),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["desassociado_por_id"],
            ["users.id"],
            name=(
                "fk_veiculo_condutor_associacoes_"
                "desassociado_por_id"
            ),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint(
            "id",
            name=(
                "pk_veiculo_condutor_associacoes"
            ),
        ),
        sa.UniqueConstraint(
            "veiculo_ativo_id",
            name=(
                "uq_veiculo_condutor_associacoes_"
                "veiculo_ativo"
            ),
        ),
        sa.UniqueConstraint(
            "condutor_ativo_id",
            name=(
                "uq_veiculo_condutor_associacoes_"
                "condutor_ativo"
            ),
        ),
    )

    op.create_index(
        "ix_veiculo_condutor_associacoes_id",
        "veiculo_condutor_associacoes",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_veiculo_condutor_associacoes_veiculo_id",
        "veiculo_condutor_associacoes",
        ["veiculo_id"],
        unique=False,
    )

    op.create_index(
        "ix_veiculo_condutor_associacoes_condutor_id",
        "veiculo_condutor_associacoes",
        ["condutor_id"],
        unique=False,
    )

    op.create_index(
        (
            "ix_veiculo_condutor_associacoes_"
            "associado_por_id"
        ),
        "veiculo_condutor_associacoes",
        ["associado_por_id"],
        unique=False,
    )

    op.create_index(
        (
            "ix_veiculo_condutor_associacoes_"
            "desassociado_por_id"
        ),
        "veiculo_condutor_associacoes",
        ["desassociado_por_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table(
        "veiculo_condutor_associacoes"
    )