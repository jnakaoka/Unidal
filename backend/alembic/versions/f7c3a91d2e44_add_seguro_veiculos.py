"""add seguro fields to veiculos
Revision ID: f7c3a91d2e44
Revises: e42a7c1d9b30
"""
from alembic import op
import sqlalchemy as sa

revision = "f7c3a91d2e44"
down_revision = "e42a7c1d9b30"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("veiculos", sa.Column("seguradora", sa.String(120), nullable=True))
    op.add_column("veiculos", sa.Column("numero_apolice", sa.String(100), nullable=True))
    op.add_column("veiculos", sa.Column("seguro_inicio", sa.Date(), nullable=True))
    op.add_column("veiculos", sa.Column("seguro_vencimento", sa.Date(), nullable=True))
    op.create_index("ix_veiculos_seguro_vencimento", "veiculos", ["seguro_vencimento"])


def downgrade():
    op.drop_index("ix_veiculos_seguro_vencimento", table_name="veiculos")
    op.drop_column("veiculos", "seguro_vencimento")
    op.drop_column("veiculos", "seguro_inicio")
    op.drop_column("veiculos", "numero_apolice")
    op.drop_column("veiculos", "seguradora")
