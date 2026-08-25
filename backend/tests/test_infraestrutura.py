from alembic.config import Config
from alembic.runtime.migration import (
    MigrationContext,
)
from alembic.script import ScriptDirectory
from sqlalchemy import inspect

from app.database import engine


def test_banco_possui_tabelas_principais():
    inspetor = inspect(engine)
    tabelas = set(inspetor.get_table_names())

    esperadas = {
        "alembic_version",
        "users",
        "perfis",
        "veiculos",
        "cartoes",
        "cartao_veiculo_associacoes",
        "veiculo_condutor_associacoes",
    }

    assert esperadas.issubset(tabelas), {
        "faltando": esperadas - tabelas,
        "encontradas": tabelas,
    }


def test_banco_esta_no_head_do_alembic():
    configuracao = Config("/app/alembic.ini")
    scripts = ScriptDirectory.from_config(
        configuracao,
    )
    heads_esperados = set(scripts.get_heads())

    with engine.connect() as conexao:
        contexto = MigrationContext.configure(
            conexao,
        )
        heads_atuais = set(
            contexto.get_current_heads(),
        )

    assert heads_atuais == heads_esperados, {
        "esperados": heads_esperados,
        "atuais": heads_atuais,
    }