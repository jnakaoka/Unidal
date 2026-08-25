from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User


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


def criar_condutor(
    db: Session,
    admin: User,
    email: str,
    *,
    e_condutor: bool = True,
    ativo: bool = True,
) -> User:
    condutor = User(
        name=f"Condutor {email}",
        email=email,
        empresa="UNIDAL TESTE",
        hashed_password=admin.hashed_password,
        must_change_password=False,
        is_active=ativo,
        e_condutor=e_condutor,
        perfil_id=admin.perfil_id,
    )

    db.add(condutor)
    db.commit()
    db.refresh(condutor)

    return condutor


def associar(
    client: TestClient,
    headers: dict[str, str],
    veiculo_id: int,
    condutor_id: int,
):
    return client.post(
        "/veiculo-condutor-associacoes/",
        headers=headers,
        json={
            "veiculo_id": veiculo_id,
            "condutor_id": condutor_id,
            "observacoes": "Associação de teste",
        },
    )


def test_ciclo_completo_preserva_historico_condutor(
    client: TestClient,
    headers_admin: dict[str, str],
    db: Session,
    admin: User,
) -> None:
    condutor = criar_condutor(
        db,
        admin,
        "condutor.ciclo@example.com",
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
        origem["id"],
        condutor.id,
    )

    assert primeira.status_code == 201, primeira.text
    primeira_id = primeira.json()["id"]
    assert primeira.json()["ativa"] is True

    ativa_veiculo = client.get(
        (
            "/veiculo-condutor-associacoes/"
            f"veiculos/{origem['id']}/ativa"
        ),
        headers=headers_admin,
    )
    ativa_condutor = client.get(
        (
            "/veiculo-condutor-associacoes/"
            f"condutores/{condutor.id}/ativa"
        ),
        headers=headers_admin,
    )

    assert ativa_veiculo.status_code == 200
    assert ativa_condutor.status_code == 200

    transferencia = client.post(
        (
            "/veiculo-condutor-associacoes/"
            f"condutores/{condutor.id}/transferir"
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

    historico_condutor = client.get(
        (
            "/veiculo-condutor-associacoes/"
            f"condutores/{condutor.id}/historico"
        ),
        headers=headers_admin,
    )

    assert historico_condutor.status_code == 200
    itens = historico_condutor.json()
    assert len(itens) == 2

    por_id = {
        item["id"]: item
        for item in itens
    }

    assert por_id[primeira_id]["ativa"] is False
    assert por_id[primeira_id]["desassociado_em"] is not None
    assert por_id[segunda_id]["ativa"] is True

    historico_origem = client.get(
        (
            "/veiculo-condutor-associacoes/"
            f"veiculos/{origem['id']}/historico"
        ),
        headers=headers_admin,
    )

    assert historico_origem.status_code == 200
    assert len(historico_origem.json()) == 1
    assert historico_origem.json()[0]["ativa"] is False

    desassociacao = client.post(
        (
            "/veiculo-condutor-associacoes/"
            f"veiculos/{destino['id']}/desassociar"
        ),
        headers=headers_admin,
    )

    assert desassociacao.status_code == 200
    assert desassociacao.json()["ativa"] is False

    ativa_final = client.get(
        (
            "/veiculo-condutor-associacoes/"
            f"condutores/{condutor.id}/ativa"
        ),
        headers=headers_admin,
    )

    assert ativa_final.status_code == 404

    historico_final = client.get(
        (
            "/veiculo-condutor-associacoes/"
            f"condutores/{condutor.id}/historico"
        ),
        headers=headers_admin,
    )

    assert historico_final.status_code == 200
    assert len(historico_final.json()) == 2
    assert all(
        item["ativa"] is False
        for item in historico_final.json()
    )


def test_recusa_condutor_em_dois_veiculos(
    client: TestClient,
    headers_admin: dict[str, str],
    db: Session,
    admin: User,
) -> None:
    condutor = criar_condutor(
        db,
        admin,
        "condutor.unico@example.com",
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

    inicial = associar(
        client,
        headers_admin,
        primeiro["id"],
        condutor.id,
    )
    assert inicial.status_code == 201

    duplicada = associar(
        client,
        headers_admin,
        segundo["id"],
        condutor.id,
    )

    assert duplicada.status_code == 409


def test_recusa_dois_condutores_no_mesmo_veiculo(
    client: TestClient,
    headers_admin: dict[str, str],
    db: Session,
    admin: User,
) -> None:
    primeiro = criar_condutor(
        db,
        admin,
        "condutor.um@example.com",
    )
    segundo = criar_condutor(
        db,
        admin,
        "condutor.dois@example.com",
    )
    veiculo = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )

    inicial = associar(
        client,
        headers_admin,
        veiculo["id"],
        primeiro.id,
    )
    assert inicial.status_code == 201

    conflito = associar(
        client,
        headers_admin,
        veiculo["id"],
        segundo.id,
    )

    assert conflito.status_code == 409


def test_recusa_utilizador_que_nao_e_condutor(
    client: TestClient,
    headers_admin: dict[str, str],
    db: Session,
    admin: User,
) -> None:
    utilizador = criar_condutor(
        db,
        admin,
        "nao.condutor@example.com",
        e_condutor=False,
    )
    veiculo = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )

    response = associar(
        client,
        headers_admin,
        veiculo["id"],
        utilizador.id,
    )

    assert response.status_code == 409


def test_recusa_condutor_inativo(
    client: TestClient,
    headers_admin: dict[str, str],
    db: Session,
    admin: User,
) -> None:
    condutor = criar_condutor(
        db,
        admin,
        "condutor.inativo@example.com",
        ativo=False,
    )
    veiculo = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )

    response = associar(
        client,
        headers_admin,
        veiculo["id"],
        condutor.id,
    )

    assert response.status_code == 409


def test_recusa_segunda_desassociacao_condutor(
    client: TestClient,
    headers_admin: dict[str, str],
    db: Session,
    admin: User,
) -> None:
    condutor = criar_condutor(
        db,
        admin,
        "condutor.desassociar@example.com",
    )
    veiculo = criar_veiculo(
        client,
        headers_admin,
        "AA-00-BB",
    )

    inicial = associar(
        client,
        headers_admin,
        veiculo["id"],
        condutor.id,
    )
    assert inicial.status_code == 201

    rota = (
        "/veiculo-condutor-associacoes/"
        f"veiculos/{veiculo['id']}/desassociar"
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