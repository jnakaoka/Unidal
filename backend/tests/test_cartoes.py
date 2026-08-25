from fastapi.testclient import TestClient


def payload_cartao(
    identificador: str = "CARTAO-TESTE-001",
) -> dict:
    return {
        "nome": "Cartão de teste",
        "identificador": identificador,
        "tipo": "combustivel",
        "emissor": "Emissor teste",
        "ultimos_quatro": "1234",
        "validade_mes": 12,
        "validade_ano": 2030,
        "estado": "ativo",
        "observacoes": "  Observação de teste  ",
    }


def criar_cartao(
    client: TestClient,
    headers_admin: dict[str, str],
):
    return client.post(
        "/cartoes/",
        headers=headers_admin,
        json=payload_cartao(),
    )


def test_criar_consultar_e_filtrar_cartao(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    criacao = criar_cartao(client, headers_admin)

    assert criacao.status_code == 201, criacao.text

    cartao = criacao.json()
    cartao_id = cartao["id"]

    assert cartao["tipo"] == "combustivel"
    assert cartao["estado"] == "ativo"
    assert cartao["observacoes"] == "Observação de teste"

    consulta = client.get(
        f"/cartoes/{cartao_id}",
        headers=headers_admin,
    )

    assert consulta.status_code == 200
    assert consulta.json()["id"] == cartao_id

    listagem = client.get(
        "/cartoes/",
        headers=headers_admin,
        params={
            "tipo": "combustivel",
            "estado": "ativo",
        },
    )

    assert listagem.status_code == 200
    assert [item["id"] for item in listagem.json()] == [
        cartao_id,
    ]


def test_recusa_identificador_duplicado(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    primeira = criar_cartao(client, headers_admin)
    assert primeira.status_code == 201

    duplicada = criar_cartao(client, headers_admin)

    assert duplicada.status_code == 409


def test_recusa_validade_incompleta(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    payload = payload_cartao()
    payload.pop("validade_ano")

    response = client.post(
        "/cartoes/",
        headers=headers_admin,
        json=payload,
    )

    assert response.status_code == 422


def test_recusa_mes_invalido(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    payload = payload_cartao()
    payload["validade_mes"] = 13

    response = client.post(
        "/cartoes/",
        headers=headers_admin,
        json=payload,
    )

    assert response.status_code == 422


def test_recusa_ultimos_quatro_invalidos(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    payload = payload_cartao()
    payload["ultimos_quatro"] = "12A4"

    response = client.post(
        "/cartoes/",
        headers=headers_admin,
        json=payload,
    )

    assert response.status_code == 422


def test_bloquear_cartao(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    criacao = criar_cartao(client, headers_admin)
    assert criacao.status_code == 201

    cartao_id = criacao.json()["id"]

    atualizacao = client.put(
        f"/cartoes/{cartao_id}",
        headers=headers_admin,
        json={
            "estado": "bloqueado",
            "observacoes": "   ",
        },
    )

    assert atualizacao.status_code == 200, atualizacao.text
    assert atualizacao.json()["estado"] == "bloqueado"
    assert atualizacao.json()["observacoes"] is None


def test_cartao_inexistente_retorna_404(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    response = client.get(
        "/cartoes/999999",
        headers=headers_admin,
    )

    assert response.status_code == 404