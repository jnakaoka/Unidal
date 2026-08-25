from fastapi.testclient import TestClient


def criar_veiculo(
    client: TestClient,
    headers: dict[str, str],
    matricula: str,
) -> dict:
    response = client.post(
        "/veiculos/",
        headers=headers,
        json={
            "matricula": matricula,
            "tipo": "carrinha",
        },
    )

    assert response.status_code == 201, response.text
    return response.json()


def criar_cartao(
    client: TestClient,
    headers: dict[str, str],
    identificador: str,
) -> dict:
    response = client.post(
        "/cartoes/",
        headers=headers,
        json={
            "nome": f"Cartão {identificador}",
            "identificador": identificador,
            "tipo": "combustivel",
            "estado": "ativo",
        },
    )

    assert response.status_code == 201, response.text
    return response.json()


def associar(
    client: TestClient,
    headers: dict[str, str],
    cartao_id: int,
    veiculo_id: int,
):
    return client.post(
        "/cartao-veiculo-associacoes/",
        headers=headers,
        json={
            "cartao_id": cartao_id,
            "veiculo_id": veiculo_id,
            "observacoes": "Associação de teste",
        },
    )


def test_ciclo_completo_preserva_historico(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    cartao = criar_cartao(
        client,
        headers_admin,
        "TESTE-CICLO-001",
    )
    origem = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )
    destino = criar_veiculo(
        client,
        headers_admin,
        "CC-11-DD",
    )

    primeira = associar(
        client,
        headers_admin,
        cartao["id"],
        origem["id"],
    )

    assert primeira.status_code == 201, primeira.text
    primeira_id = primeira.json()["id"]
    assert primeira.json()["ativa"] is True

    transferencia = client.post(
        (
            "/cartao-veiculo-associacoes/"
            f"cartoes/{cartao['id']}/transferir"
        ),
        headers=headers_admin,
        json={
            "veiculo_destino_id": destino["id"],
            "observacoes": "Transferência de teste",
        },
    )

    assert transferencia.status_code == 201, (
        transferencia.text
    )
    segunda_id = transferencia.json()["id"]

    assert segunda_id != primeira_id
    assert transferencia.json()["veiculo_id"] == destino["id"]
    assert transferencia.json()["ativa"] is True

    historico = client.get(
        (
            "/cartao-veiculo-associacoes/"
            f"cartoes/{cartao['id']}/historico"
        ),
        headers=headers_admin,
    )

    assert historico.status_code == 200
    itens = historico.json()
    assert len(itens) == 2

    por_id = {
        item["id"]: item
        for item in itens
    }

    assert por_id[primeira_id]["ativa"] is False
    assert por_id[primeira_id]["desassociado_em"] is not None
    assert por_id[segunda_id]["ativa"] is True

    desassociacao = client.post(
        (
            "/cartao-veiculo-associacoes/"
            f"cartoes/{cartao['id']}/desassociar"
        ),
        headers=headers_admin,
    )

    assert desassociacao.status_code == 200
    assert desassociacao.json()["ativa"] is False
    assert desassociacao.json()["desassociado_em"] is not None

    ativa = client.get(
        (
            "/cartao-veiculo-associacoes/"
            f"cartoes/{cartao['id']}/ativa"
        ),
        headers=headers_admin,
    )

    assert ativa.status_code == 404

    historico_final = client.get(
        (
            "/cartao-veiculo-associacoes/"
            f"cartoes/{cartao['id']}/historico"
        ),
        headers=headers_admin,
    )

    assert historico_final.status_code == 200
    assert len(historico_final.json()) == 2
    assert all(
        item["ativa"] is False
        for item in historico_final.json()
    )


def test_recusa_duas_associacoes_ativas_para_cartao(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    cartao = criar_cartao(
        client,
        headers_admin,
        "TESTE-DUPLICADA-001",
    )
    primeiro = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )
    segundo = criar_veiculo(
        client,
        headers_admin,
        "CC-11-DD",
    )

    resposta_inicial = associar(
        client,
        headers_admin,
        cartao["id"],
        primeiro["id"],
    )
    assert resposta_inicial.status_code == 201

    duplicada = associar(
        client,
        headers_admin,
        cartao["id"],
        segundo["id"],
    )

    assert duplicada.status_code == 409


def test_permite_multiplos_cartoes_no_mesmo_veiculo(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    veiculo = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )
    primeiro = criar_cartao(
        client,
        headers_admin,
        "MULTIPLO-001",
    )
    segundo = criar_cartao(
        client,
        headers_admin,
        "MULTIPLO-002",
    )

    associacao_um = associar(
        client,
        headers_admin,
        primeiro["id"],
        veiculo["id"],
    )
    associacao_dois = associar(
        client,
        headers_admin,
        segundo["id"],
        veiculo["id"],
    )

    assert associacao_um.status_code == 201
    assert associacao_dois.status_code == 201

    ativas = client.get(
        "/cartao-veiculo-associacoes/",
        headers=headers_admin,
        params={
            "veiculo_id": veiculo["id"],
            "ativa": "true",
        },
    )

    assert ativas.status_code == 200
    assert len(ativas.json()) == 2


def test_recusa_associar_cartao_bloqueado(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    cartao = criar_cartao(
        client,
        headers_admin,
        "BLOQUEADO-001",
    )
    veiculo = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )

    bloqueio = client.put(
        f"/cartoes/{cartao['id']}",
        headers=headers_admin,
        json={"estado": "bloqueado"},
    )
    assert bloqueio.status_code == 200

    response = associar(
        client,
        headers_admin,
        cartao["id"],
        veiculo["id"],
    )

    assert response.status_code == 409


def test_recusa_associar_veiculo_inativo(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    cartao = criar_cartao(
        client,
        headers_admin,
        "INATIVO-001",
    )
    veiculo = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )

    inativacao = client.put(
        f"/veiculos/{veiculo['id']}",
        headers=headers_admin,
        json={"ativo": False},
    )
    assert inativacao.status_code == 200

    response = associar(
        client,
        headers_admin,
        cartao["id"],
        veiculo["id"],
    )

    assert response.status_code == 409


def test_recusa_segunda_desassociacao(
    client: TestClient,
    headers_admin: dict[str, str],
) -> None:
    cartao = criar_cartao(
        client,
        headers_admin,
        "DESASSOCIAR-001",
    )
    veiculo = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )

    criacao = associar(
        client,
        headers_admin,
        cartao["id"],
        veiculo["id"],
    )
    assert criacao.status_code == 201

    rota = (
        "/cartao-veiculo-associacoes/"
        f"cartoes/{cartao['id']}/desassociar"
    )

    primeira = client.post(
        rota,
        headers=headers_admin,
    )
    segunda = client.post(
        rota,
        headers=headers_admin,
    )

    assert primeira.status_code == 200
    assert segunda.status_code == 409