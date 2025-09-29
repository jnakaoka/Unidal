"""clientes/obras e FKs em registros_hora

Revision ID: 29acb85cc738
Revises: 57446dd2c7e9
Create Date: 2025-09-01 10:47:50.727970

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '29acb85cc738'
down_revision: Union[str, None] = '57446dd2c7e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
