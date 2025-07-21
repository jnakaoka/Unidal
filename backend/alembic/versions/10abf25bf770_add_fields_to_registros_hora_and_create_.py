"""Add fields to registros_hora and create equipa association

Revision ID: xxxx
Revises: c1de87c1458a
Create Date: 2025-07-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'xxxx'  # <- substitua pelo ID gerado
down_revision: Union[str, None] = 'c1de87c1458a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('registros_hora', sa.Column('cliente', sa.String(length=255), nullable=True))
    op.add_column('registros_hora', sa.Column('obra', sa.String(length=255), nullable=True))
    op.add_column('registros_hora', sa.Column('metros_quadrados', sa.String(length=50), nullable=True))
    op.add_column('registros_hora', sa.Column('preparacao', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('registros_hora', sa.Column('bruto', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('registros_hora', sa.Column('colagem', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('registros_hora', sa.Column('acabamento', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('registros_hora', sa.Column('serragem', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('registros_hora', sa.Column('intervencao_maquinas', sa.Boolean(), nullable=False, server_default=sa.false()))

    op.create_table(
        'registros_hora_equipa',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('registro_id', sa.Integer(), sa.ForeignKey('registros_hora.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    )


def downgrade() -> None:
    op.drop_table('registros_hora_equipa')
    op.drop_column('registros_hora', 'intervencao_maquinas')
    op.drop_column('registros_hora', 'serragem')
    op.drop_column('registros_hora', 'acabamento')
    op.drop_column('registros_hora', 'colagem')
    op.drop_column('registros_hora', 'bruto')
    op.drop_column('registros_hora', 'preparacao')
    op.drop_column('registros_hora', 'metros_quadrados')
    op.drop_column('registros_hora', 'obra')
    op.drop_column('registros_hora', 'cliente')
