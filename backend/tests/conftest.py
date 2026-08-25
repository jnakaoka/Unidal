import os

import pytest
from sqlalchemy import text

from app.database import engine


@pytest.fixture(
    scope="session",
    autouse=True,
)
def proteger_banco_de_testes():
    nome = os.environ.get("DB_NAME")
    host = os.environ.get("DB_HOST")

    assert nome == "unidal_test", (
        "Testes interrompidos: DB_NAME não é "
        "'unidal_test'."
    )
    assert nome.endswith("_test"), (
        "Testes interrompidos: o banco não termina "
        "em '_test'."
    )
    assert host == "db-test", (
        "Testes interrompidos: DB_HOST não é "
        "'db-test'."
    )

    with engine.connect() as conexao:
        banco_atual = conexao.scalar(
            text("SELECT DATABASE()"),
        )

    assert banco_atual == "unidal_test", (
        "Testes interrompidos: a conexão não aponta "
        "para 'unidal_test'."
    )

    yield