"""add optipav to registro_horas

Revision ID: c7ccf17ce974
Revises: 004bf99640eb
Create Date: 2026-07-09 15:09:12.356041

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7ccf17ce974'
down_revision: Union[str, None] = '004bf99640eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "registro_horas",
        sa.Column("optipav", sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade():
    op.drop_column("registro_horas", "optipav")
