"""add JSON intervencao_maquinas_opcoes em registros_hora

Revision ID: af386c87a3a0
Revises: fix_clientes_obras_20250901
Create Date: 2025-09-04 16:12:03.783650

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'af386c87a3a0'
down_revision: Union[str, None] = 'fix_clientes_obras_20250901'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        'registros_hora',
        sa.Column('intervencao_maquinas_opcoes', sa.JSON(), nullable=True)
    )

def downgrade():
    op.drop_column('registros_hora', 'intervencao_maquinas_opcoes')
