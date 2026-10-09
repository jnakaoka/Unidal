"""Campo opcional de observação nos apontamentos."""
from alembic import op
import sqlalchemy as sa

revision = "a72c4e9b6100"
down_revision = "f83a2d6c9100"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("registros_hora", sa.Column("observacao", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("registros_hora", "observacao")
