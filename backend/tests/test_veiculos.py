from fastapi.testclient import TestClient


def criar_veiculo(
    client: TestClient,
    headers_admin: dict[str, str],
    matricula: str = "AA-00-BB",
):
    return client.post(
        "/veiculos/",
        headers=headers_admin,
        json={
            "matricula": matricula,
            "tipo": "carrinha",
            "descricao": "Veículo de teste",
        },
    )


def test_criar_consultar_e_listar_veiculo(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    criacao = criar_veiculo(client, headers_admin)

    assert criacao.status_code == 201, criacao.text

    veiculo = criacao.json()
    veiculo_id = veiculo["id"]

    assert veiculo["matricula"] == "AA-00-BB"
    assert veiculo["tipo"] == "carrinha"
    assert veiculo["ativo"] is True

    consulta = client.get(
        f"/veiculos/{veiculo_id}",
        headers=headers_admin,
    )

    assert consulta.status_code == 200
    assert consulta.json()["id"] == veiculo_id

    listagem = client.get(
        "/veiculos/",
        headers=headers_admin,
    )

    assert listagem.status_code == 200
    assert len(listagem.json()) == 1


def test_recusa_matricula_duplicada_normalizada(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    primeira = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )
    assert primeira.status_code == 201

    duplicada = criar_veiculo(
        client,
        headers_admin,
        "AA00BB",
    )

    assert duplicada.status_code == 409


def test_recusa_tipo_de_veiculo_invalido(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    response = client.post(
        "/veiculos/",
        headers=headers_admin,
        json={
            "matricula": "CC-11-DD",
            "tipo": "aviao",
        },
    )

    assert response.status_code == 422


def test_inativar_e_filtrar_veiculo(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    criacao = criar_veiculo(client, headers_admin)
    assert criacao.status_code == 201

    veiculo_id = criacao.json()["id"]

    atualizacao = client.put(
        f"/veiculos/{veiculo_id}",
        headers=headers_admin,
        json={"ativo": False},
    )

    assert atualizacao.status_code == 200
    assert atualizacao.json()["ativo"] is False

    inativos = client.get(
        "/veiculos/",
        headers=headers_admin,
        params={"ativo": "false"},
    )

    assert inativos.status_code == 200
    assert [item["id"] for item in inativos.json()] == [
        veiculo_id,
    ]


def test_veiculo_inexistente_retorna_404(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    response = client.get(
        "/veiculos/999999",
        headers=headers_admin,
    )

    assert response.status_code == 404

def test_criar_e_atualizar_dados_seguro(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    response = client.post(
        "/veiculos/",
        headers=headers_admin,
        json={
            "matricula": "SE-10-GU",
            "tipo": "carrinha",
            "seguradora": "Seguradora Teste",
            "numero_apolice": "AP-123",
            "seguro_inicio": "2026-09-01",
            "seguro_vencimento": "2027-09-01",
        },
    )
    assert response.status_code == 201, response.text
    veiculo = response.json()
    assert veiculo["seguradora"] == "Seguradora Teste"
    assert veiculo["numero_apolice"] == "AP-123"
    assert veiculo["seguro_vencimento"] == "2027-09-01"

    atualizado = client.put(
        f"/veiculos/{veiculo['id']}",
        headers=headers_admin,
        json={"seguro_vencimento": "2027-10-01"},
    )
    assert atualizado.status_code == 200, atualizado.text
    assert atualizado.json()["seguro_vencimento"] == "2027-10-01"
