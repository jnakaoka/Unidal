"""fix: cria clientes/obras e FKs em registros_hora

Revision ID: 16f000b862c0
Revises: 29acb85cc738
Create Date: 2025-09-01 11:01:49.093798

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'fix_clientes_obras_20250901'
down_revision = '29acb85cc738'  # <- MUITO IMPORTANTE: o head atual
branch_labels = None
depends_on = None


def upgrade():
    # 1) TABELA clientes
    op.create_table(
        'clientes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('nome', sa.String(255), nullable=False, unique=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4',
    )

    # 2) TABELA obras
    op.create_table(
        'obras',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('nome', sa.String(255), nullable=False),
        sa.Column('descricao', sa.Text(), nullable=True),
        sa.Column('cliente_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['cliente_id'], ['clientes.id'], ondelete='CASCADE'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4',
    )
    op.create_index('ix_obras_cliente_id', 'obras', ['cliente_id'])

    # 3) NOVAS COLUNAS em registros_hora (NULL por enquanto)
    op.add_column('registros_hora', sa.Column('cliente_id', sa.Integer(), nullable=True))
    op.add_column('registros_hora', sa.Column('obra_id', sa.Integer(), nullable=True))

    # 4) FKs + índices
    op.create_foreign_key(
        'fk_registros_hora_cliente', 'registros_hora', 'clientes',
        ['cliente_id'], ['id'], ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_registros_hora_obra', 'registros_hora', 'obras',
        ['obra_id'], ['id'], ondelete='SET NULL'
    )
    op.create_index('ix_registros_hora_cliente_id', 'registros_hora', ['cliente_id'])
    op.create_index('ix_registros_hora_obra_id', 'registros_hora', ['obra_id'])

    # 5) OPCIONAL: backfill a partir dos campos texto antigos (se ainda existirem)
    # cria clientes distintos
    op.execute("""
        INSERT INTO clientes (nome, is_active)
        SELECT DISTINCT TRIM(cliente) AS nome, 1
        FROM registros_hora
        WHERE cliente IS NOT NULL AND cliente <> ''
          AND NOT EXISTS (
            SELECT 1 FROM clientes c WHERE c.nome = TRIM(registros_hora.cliente)
          )
    """)

    # preenche cliente_id
    op.execute("""
        UPDATE registros_hora rh
        LEFT JOIN clientes c ON c.nome = TRIM(rh.cliente)
        SET rh.cliente_id = c.id
        WHERE rh.cliente_id IS NULL
    """)

    # cria obras por par (cliente, obra)
    op.execute("""
        INSERT INTO obras (nome, descricao, cliente_id)
        SELECT DISTINCT TRIM(rh.obra) AS nome, NULL, c.id
        FROM registros_hora rh
        JOIN clientes c ON c.nome = TRIM(rh.cliente)
        WHERE rh.obra IS NOT NULL AND rh.obra <> ''
          AND NOT EXISTS (
            SELECT 1 FROM obras o
            WHERE o.nome = TRIM(rh.obra) AND o.cliente_id = c.id
          )
    """)

    # preenche obra_id
    op.execute("""
        UPDATE registros_hora rh
        JOIN clientes c ON c.nome = TRIM(rh.cliente)
        JOIN obras o ON o.nome = TRIM(rh.obra) AND o.cliente_id = c.id
        SET rh.obra_id = o.id
        WHERE rh.obra_id IS NULL
    """)


def downgrade():
    # Remoção em ordem inversa
    op.drop_index('ix_registros_hora_obra_id', table_name='registros_hora')
    op.drop_index('ix_registros_hora_cliente_id', table_name='registros_hora')
    op.drop_constraint('fk_registros_hora_obra', 'registros_hora', type_='foreignkey')
    op.drop_constraint('fk_registros_hora_cliente', 'registros_hora', type_='foreignkey')
    op.drop_column('registros_hora', 'obra_id')
    op.drop_column('registros_hora', 'cliente_id')

    op.drop_index('ix_obras_cliente_id', table_name='obras')
    op.drop_table('obras')
    op.drop_table('clientes')

