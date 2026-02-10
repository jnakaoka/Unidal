# 1133864bc769_add_coli_and_intemperie_fields.py
from alembic import op
import sqlalchemy as sa

revision = "1133864bc769"
down_revision = "10abf25bf770"  # <- o anterior da sua cadeia linear
branch_labels = None
depends_on = None

def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    rows = bind.exec_driver_sql(f"SHOW COLUMNS FROM `{table_name}` LIKE '{column_name}'").fetchall()
    return len(rows) > 0

def upgrade():
    # registros_hora.coli (boolean)
    if not _column_exists("registros_hora", "coli"):
        op.add_column(
            "registros_hora",
            sa.Column("coli", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        )

    # registros_hora_equipa.intemperie (boolean)
    if not _column_exists("registros_hora_equipa", "intemperie"):
        op.add_column(
            "registros_hora_equipa",
            sa.Column("intemperie", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        )

    # remove default persistente (somente se a coluna existir)
    if _column_exists("registros_hora", "coli"):
        with op.batch_alter_table("registros_hora") as batch:
            batch.alter_column("coli", server_default=None)

    if _column_exists("registros_hora_equipa", "intemperie"):
        with op.batch_alter_table("registros_hora_equipa") as batch:
            batch.alter_column("intemperie", server_default=None)

def downgrade():
    if _column_exists("registros_hora_equipa", "intemperie"):
        op.drop_column("registros_hora_equipa", "intemperie")
    if _column_exists("registros_hora", "coli"):
        op.drop_column("registros_hora", "coli")
