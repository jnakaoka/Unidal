"""Documentos com acesso por categoria e notificações de edições."""
from alembic import op
import sqlalchemy as sa

revision = "f83a2d6c9100"
down_revision = "f19a6c4e2b71"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("documento_categorias",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nome", sa.String(120), nullable=False, unique=True),
        sa.Column("visibilidade", sa.String(20), nullable=False),
        sa.Column("perfil_ids", sa.JSON(), nullable=False),
        sa.Column("usuario_ids", sa.JSON(), nullable=False))
    op.create_table("documentos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("categoria_id", sa.Integer(), sa.ForeignKey("documento_categorias.id"), nullable=False),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=False),
        sa.Column("arquivado", sa.Boolean(), nullable=False))
    op.create_table("documento_versoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("documento_id", sa.Integer(), sa.ForeignKey("documentos.id"), nullable=False),
        sa.Column("nome_original", sa.String(255), nullable=False),
        sa.Column("chave", sa.String(80), nullable=False, unique=True),
        sa.Column("tamanho", sa.Integer(), nullable=False),
        sa.Column("criado_por", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_documento_versoes_documento_id", "documento_versoes", ["documento_id"])
    op.create_table("apontamento_edicoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("registro_id", sa.Integer(), nullable=False),
        sa.Column("autor_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("autor_nome", sa.String(255), nullable=False),
        sa.Column("resumo", sa.String(500), nullable=False),
        sa.Column("alteracoes", sa.JSON(), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_apontamento_edicoes_registro_id", "apontamento_edicoes", ["registro_id"])
    op.create_table("notificacoes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("usuario_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("edicao_id", sa.Integer(), sa.ForeignKey("apontamento_edicoes.id"), nullable=False),
        sa.Column("lida_em", sa.DateTime(timezone=True)))
    op.create_index("ix_notificacoes_usuario_id", "notificacoes", ["usuario_id"])


def downgrade():
    for table in ("notificacoes", "apontamento_edicoes", "documento_versoes", "documentos", "documento_categorias"):
        op.drop_table(table)
