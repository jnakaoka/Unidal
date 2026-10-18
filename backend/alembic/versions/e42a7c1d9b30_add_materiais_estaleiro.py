"""add materiais estaleiro
Revision ID: e42a7c1d9b30
Revises: c31f8a2d4e90
"""
from alembic import op
import sqlalchemy as sa

revision = "e42a7c1d9b30"
down_revision = "c31f8a2d4e90"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("materiais",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("unidade", sa.String(30), nullable=False),
        sa.Column("estoque_fisico", sa.Numeric(12,3), nullable=False, server_default="0"),
        sa.Column("estoque_minimo", sa.Numeric(12,3), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("nome", name="uq_materiais_nome"))
    op.create_index("ix_materiais_nome", "materiais", ["nome"])
    op.create_table("pedidos_materiais",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("solicitante_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="PENDENTE"),
        sa.Column("resultado", sa.String(30), nullable=True),
        sa.Column("observacao", sa.Text(), nullable=True),
        sa.Column("motivo_conclusao_parcial", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("atualizado_em", sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.create_index("ix_pedidos_materiais_solicitante_id","pedidos_materiais",["solicitante_id"])
    op.create_index("ix_pedidos_materiais_status","pedidos_materiais",["status"])
    op.create_table("pedido_material_itens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pedido_id", sa.Integer(), sa.ForeignKey("pedidos_materiais.id", ondelete="CASCADE"), nullable=False),
        sa.Column("material_solicitado_id", sa.Integer(), sa.ForeignKey("materiais.id"), nullable=False),
        sa.Column("material_enviado_id", sa.Integer(), sa.ForeignKey("materiais.id"), nullable=True),
        sa.Column("quantidade_solicitada", sa.Numeric(12,3), nullable=False),
        sa.Column("quantidade_enviada", sa.Numeric(12,3), nullable=False, server_default="0"),
        sa.Column("motivo_substituicao", sa.Text(), nullable=True))
    op.create_index("ix_pedido_material_itens_pedido_id","pedido_material_itens",["pedido_id"])
    op.create_table("movimentos_estoque",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("material_id", sa.Integer(), sa.ForeignKey("materiais.id"), nullable=False),
        sa.Column("pedido_id", sa.Integer(), sa.ForeignKey("pedidos_materiais.id"), nullable=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("tipo", sa.String(20), nullable=False),
        sa.Column("quantidade", sa.Numeric(12,3), nullable=False),
        sa.Column("observacao", sa.Text(), nullable=True),
        sa.Column("criado_em", sa.DateTime(), nullable=False, server_default=sa.func.now()))
    op.create_index("ix_movimentos_estoque_material_id","movimentos_estoque",["material_id"])
    op.create_index("ix_movimentos_estoque_pedido_id","movimentos_estoque",["pedido_id"])

def downgrade():
    op.drop_table("movimentos_estoque")
    op.drop_table("pedido_material_itens")
    op.drop_table("pedidos_materiais")
    op.drop_index("ix_materiais_nome", table_name="materiais")
    op.drop_table("materiais")
