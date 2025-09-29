# 1133864bc769_add_coli_and_intemperie_fields.py
from alembic import op
import sqlalchemy as sa

revision = "1133864bc769"
down_revision = "10abf25bf770"  # <- o anterior da sua cadeia linear
branch_labels = None
depends_on = None

def upgrade():
    # registros_hora.coli (boolean)
    op.add_column(
        "registros_hora",
        sa.Column("coli", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )

    # registros_hora_equipa.intemperie (boolean)
    op.add_column(
        "registros_hora_equipa",
        sa.Column("intemperie", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )

    # opcional: depois de criar com default, remove o default persistente
    with op.batch_alter_table("registros_hora") as batch:
        batch.alter_column("coli", server_default=None)
    with op.batch_alter_table("registros_hora_equipa") as batch:
        batch.alter_column("intemperie", server_default=None)

def downgrade():
    op.drop_column("registros_hora_equipa", "intemperie")
    op.drop_column("registros_hora", "coli")
