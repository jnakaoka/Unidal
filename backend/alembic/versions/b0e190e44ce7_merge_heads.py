"""merge heads

Revision ID: b0e190e44ce7
Revises: 1133864bc769, af386c87a3a0
Create Date: 2026-02-08 12:05:26.254185

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b0e190e44ce7'
down_revision: Union[str, None] = ('1133864bc769', 'af386c87a3a0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
