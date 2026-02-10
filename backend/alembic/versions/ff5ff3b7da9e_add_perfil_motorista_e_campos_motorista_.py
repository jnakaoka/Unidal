"""add perfil motorista e campos motorista registro_hora

Revision ID: ff5ff3b7da9e
Revises: b0e190e44ce7
Create Date: 2026-02-08 13:07:26.507213

"""

from alembic import op
import sqlalchemy as sa

revision: str = 'ff5ff3b7da9e'
down_revision = "b0e190e44ce7"
branch_labels = None
depends_on = None

def _scalar(sql: str, **params):
    bind = op.get_bind()
    return bind.execute(sa.text(sql), params).scalar()

def _exists(sql: str, **params) -> bool:
    bind = op.get_bind()
    return bind.execute(sa.text(sql), params).first() is not None

def table_exists(table_name: str) -> bool:
    db = _scalar("SELECT DATABASE()")
    return _exists("""
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = :db AND table_name = :t
        LIMIT 1
    """, db=db, t=table_name)

def column_exists(table_name: str, column_name: str) -> bool:
    db = _scalar("SELECT DATABASE()")
    return _exists("""
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = :db AND table_name = :t AND column_name = :c
        LIMIT 1
    """, db=db, t=table_name, c=column_name)

def upgrade():
    # 1) Perfil motorista (seed idempotente)
    if table_exists("perfis"):
        op.execute(sa.text("""
            INSERT INTO perfis (nome, is_active)
            SELECT 'motorista', 1
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM perfis WHERE nome = 'motorista')
        """))

    # 2) Campos no registros_hora (idempotente)
    if table_exists("registros_hora"):
        with op.batch_alter_table("registros_hora") as batch:
            if not column_exists("registros_hora", "origem"):
                batch.add_column(sa.Column("origem", sa.String(255), nullable=True))
            if not column_exists("registros_hora", "destino"):
                batch.add_column(sa.Column("destino", sa.String(255), nullable=True))
            if not column_exists("registros_hora", "matricula_veiculo"):
                batch.add_column(sa.Column("matricula_veiculo", sa.String(50), nullable=True))
            if not column_exists("registros_hora", "km_rodados"):
                batch.add_column(sa.Column("km_rodados", sa.Float(), nullable=True))
            if not column_exists("registros_hora", "maquinas_transportadas"):
                batch.add_column(sa.Column("maquinas_transportadas", sa.JSON(), nullable=True))

def downgrade():
    # downgrade também idempotente (pra não quebrar se algo já não existir)
    if table_exists("registros_hora"):
        with op.batch_alter_table("registros_hora") as batch:
            if column_exists("registros_hora", "maquinas_transportadas"):
                batch.drop_column("maquinas_transportadas")
            if column_exists("registros_hora", "km_rodados"):
                batch.drop_column("km_rodados")
            if column_exists("registros_hora", "matricula_veiculo"):
                batch.drop_column("matricula_veiculo")
            if column_exists("registros_hora", "destino"):
                batch.drop_column("destino")
            if column_exists("registros_hora", "origem"):
                batch.drop_column("origem")

    if table_exists("perfis"):
        op.execute(sa.text("DELETE FROM perfis WHERE nome = 'motorista'"))
