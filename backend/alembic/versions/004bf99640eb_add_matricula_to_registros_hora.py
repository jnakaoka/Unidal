"""add matricula to registros_hora

Revision ID: 004bf99640eb
Revises: ff5ff3b7da9e
Create Date: 2026-02-08 14:03:42.960571

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from typing import Sequence, Union

revision: str = '004bf99640eb'
down_revision: Union[str, None] = 'ff5ff3b7da9e'
branch_labels = None
depends_on = None

def _column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    db_name = bind.execute(text("SELECT DATABASE()")).scalar()
    q = text("""
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = :db
          AND table_name = :t
          AND column_name = :c
        LIMIT 1
    """)
    return bind.execute(q, {"db": db_name, "t": table, "c": column}).first() is not None

def upgrade():
    if not _column_exists("registros_hora", "matricula"):
        op.add_column("registros_hora", sa.Column("matricula", sa.String(50), nullable=True))

def downgrade():
    op.drop_column("registros_hora", "matricula")