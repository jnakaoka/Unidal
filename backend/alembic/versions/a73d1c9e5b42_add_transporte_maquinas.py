"""add transporte maquinas

Revision ID: a73d1c9e5b42
Revises: f2a7c4e81b39
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a73d1c9e5b42"
down_revision: Union[str, None] = "f2a7c4e81b39"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "maquinas",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("referencia", sa.String(120), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_maquinas_id", "maquinas", ["id"])
    with op.batch_alter_table("registros_hora") as batch:
        batch.add_column(sa.Column("transporte_veiculo_id", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("transporte_maquina_ids", sa.JSON(), nullable=True))
        batch.add_column(sa.Column("origem_morada", sa.String(255), nullable=True))
        batch.add_column(sa.Column("origem_codigo_postal", sa.String(20), nullable=True))
        batch.add_column(sa.Column("origem_regiao", sa.String(120), nullable=True))
        batch.add_column(sa.Column("destino_morada", sa.String(255), nullable=True))
        batch.add_column(sa.Column("destino_codigo_postal", sa.String(20), nullable=True))
        batch.add_column(sa.Column("destino_regiao", sa.String(120), nullable=True))
        batch.create_foreign_key("fk_registro_transporte_veiculo", "veiculos", ["transporte_veiculo_id"], ["id"])


def downgrade() -> None:
    with op.batch_alter_table("registros_hora") as batch:
        batch.drop_constraint("fk_registro_transporte_veiculo", type_="foreignkey")
        for coluna in (
            "destino_regiao", "destino_codigo_postal", "destino_morada",
            "origem_regiao", "origem_codigo_postal", "origem_morada",
            "transporte_maquina_ids", "transporte_veiculo_id",
        ):
            batch.drop_column(coluna)
    op.drop_index("ix_maquinas_id", table_name="maquinas")
    op.drop_table("maquinas")
