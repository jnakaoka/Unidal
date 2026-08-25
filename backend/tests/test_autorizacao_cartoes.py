import pytest
from fastapi.testclient import TestClient


ROTAS_ADMINISTRATIVAS = [
    "/veiculos/",
    "/cartoes/",
    "/cartao-veiculo-associacoes/",
    "/veiculo-condutor-associacoes/",
]


@pytest.mark.parametrize(
    "rota",
    ROTAS_ADMINISTRATIVAS,
)
def test_recusa_utilizador_sem_token(
    client: TestClient,
    rota: str,
) -> None:
    response = client.get(rota)

    assert response.status_code == 401


@pytest.mark.parametrize(
    "rota",
    ROTAS_ADMINISTRATIVAS,
)
def test_recusa_utilizador_nao_administrador(
    client: TestClient,
    headers_operador: dict[str, str],
    rota: str,
) -> None:
    response = client.get(
        rota,
        headers=headers_operador,
    )

    assert response.status_code == 403


@pytest.mark.parametrize(
    "rota",
    ROTAS_ADMINISTRATIVAS,
)
def test_permite_administrador(
    client: TestClient,
    headers_admin: dict[str, str],
    rota: str,
) -> None:
    response = client.get(
        rota,
        headers=headers_admin,
    )

    assert response.status_code == 200, response.text