"""merge face profiles and gestao ocorrencias

Revision ID: f5b2c65bf301
Revises: d78497fa80a6, b84f2c7d9e31
Create Date: 2026-09-22 16:57:06.298123

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5b2c65bf301'
down_revision: Union[str, None] = ('d78497fa80a6', 'b84f2c7d9e31')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
