"""add tamanhos materiais

Revision ID: f19a6c4e2b71
Revises: e42a7c1d9b30
"""
from alembic import op
import sqlalchemy as sa

revision = "f19a6c4e2b71"
down_revision = "e42a7c1d9b30"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("materiais", sa.Column("controla_tamanho", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_table(
        "material_tamanhos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("material_id", sa.Integer(), sa.ForeignKey("materiais.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tamanho", sa.String(length=30), nullable=False),
        sa.Column("estoque_fisico", sa.Numeric(12, 3), nullable=False, server_default="0"),
        sa.Column("estoque_minimo", sa.Numeric(12, 3), nullable=False, server_default="0"),
        sa.UniqueConstraint("material_id", "tamanho", name="uq_material_tamanho"),
    )
    op.create_index("ix_material_tamanhos_material_id", "material_tamanhos", ["material_id"])
    op.add_column("pedido_material_itens", sa.Column("tamanho_solicitado", sa.String(length=30), nullable=True))
    op.add_column("pedido_material_itens", sa.Column("tamanho_enviado", sa.String(length=30), nullable=True))
    op.add_column("movimentos_estoque", sa.Column("tamanho", sa.String(length=30), nullable=True))


def downgrade():
    op.drop_column("movimentos_estoque", "tamanho")
    op.drop_column("pedido_material_itens", "tamanho_enviado")
    op.drop_column("pedido_material_itens", "tamanho_solicitado")
    op.drop_index("ix_material_tamanhos_material_id", table_name="material_tamanhos")
    op.drop_table("material_tamanhos")
    op.drop_column("materiais", "controla_tamanho")
