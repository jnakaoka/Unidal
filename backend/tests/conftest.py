import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.main import app
from app.models.perfil import Perfil
from app.models.user import User
from app.utils.security import hash_password


SENHA_TESTE = "TesteSeguro#2026"

TABELAS_LIMPAS = [
    "veiculo_condutor_associacoes",
    "cartao_veiculo_associacoes",
    "cartoes",
    "veiculos",
    "registros_hora_equipa",
    "registros_hora",
    "users",
    "perfis",
]


def garantir_banco_de_testes() -> None:
    assert os.getenv("DB_HOST") == "db-test"
    assert os.getenv("DB_NAME") == "unidal_test"

    with engine.connect() as connection:
        banco = connection.execute(
            text("SELECT DATABASE()"),
        ).scalar_one()

    assert banco == "unidal_test"


def limpar_banco_de_testes() -> None:
    garantir_banco_de_testes()

    inspetor = inspect(engine)

    with engine.connect() as connection:
        connection.exec_driver_sql(
            "SET FOREIGN_KEY_CHECKS=0",
        )

        try:
            for tabela in TABELAS_LIMPAS:
                if inspetor.has_table(tabela):
                    connection.exec_driver_sql(
                        f"TRUNCATE TABLE `{tabela}`",
                    )
        finally:
            connection.exec_driver_sql(
                "SET FOREIGN_KEY_CHECKS=1",
            )
            connection.commit()


@pytest.fixture(
    scope="session",
    autouse=True,
)
def proteger_banco_de_dados() -> None:
    garantir_banco_de_testes()


@pytest.fixture(autouse=True)
def limpar_entre_testes(
    proteger_banco_de_dados: None,
) -> Generator[None, None, None]:
    limpar_banco_de_testes()
    yield
    limpar_banco_de_testes()


@pytest.fixture
def db() -> Generator[Session, None, None]:
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


def criar_utilizador(
    db: Session,
    perfil_nome: str,
    email: str,
) -> User:
    perfil = Perfil(
        nome=perfil_nome,
        is_active=True,
    )
    db.add(perfil)
    db.flush()

    utilizador = User(
        name=f"Utilizador {perfil_nome}",
        email=email,
        empresa="UNIDAL TESTE",
        hashed_password=hash_password(SENHA_TESTE),
        must_change_password=False,
        is_active=True,
        e_condutor=False,
        perfil_id=perfil.id,
    )
    db.add(utilizador)
    db.commit()
    db.refresh(utilizador)

    return utilizador


@pytest.fixture
def admin(db: Session) -> User:
    return criar_utilizador(
        db,
        perfil_nome="admin",
        email="admin.test@example.com",
    )


@pytest.fixture
def operador(db: Session) -> User:
    return criar_utilizador(
        db,
        perfil_nome="operador",
        email="operador.test@example.com",
    )


def autenticar(
    client: TestClient,
    utilizador: User,
) -> dict[str, str]:
    response = client.post(
        "/auth/login/",
        data={
            "username": utilizador.email,
            "password": SENHA_TESTE,
        },
    )

    assert response.status_code == 200, response.text

    access_token = response.json()["access_token"]

    return {
        "Authorization": f"Bearer {access_token}",
    }


@pytest.fixture
def headers_admin(
    client: TestClient,
    admin: User,
) -> dict[str, str]:
    return autenticar(client, admin)


@pytest.fixture
def headers_operador(
    client: TestClient,
    operador: User,
) -> dict[str, str]:
    return autenticar(client, operador)