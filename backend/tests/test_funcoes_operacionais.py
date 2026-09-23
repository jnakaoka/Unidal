def test_lista_funcoes_operacionais(client):
    response = client.get("/users/funcoes-disponiveis")

    assert response.status_code == 200
    codigos = {item["codigo"] for item in response.json()}
    assert {"CHEFE_EQUIPE", "RESPONSAVEL_ESTALEIRO", "CONDUTOR"} <= codigos


def test_atribui_multiplas_funcoes_ao_utilizador(client, operador):
    response = client.put(
        f"/users/{operador.id}",
        json={
            "funcao_codigos": ["CHEFE_EQUIPE", "RESPONSAVEL_ESTALEIRO"],
        },
    )

    assert response.status_code == 200, response.text
    data = response.json()
    codigos = {item["codigo"] for item in data["funcoes"]}
    assert codigos == {"CHEFE_EQUIPE", "RESPONSAVEL_ESTALEIRO"}
    assert data["e_condutor"] is False


def test_funcao_condutor_mantem_compatibilidade(client, operador):
    response = client.put(
        f"/users/{operador.id}",
        json={"funcao_codigos": ["CONDUTOR"]},
    )

    assert response.status_code == 200, response.text
    assert response.json()["e_condutor"] is True


def test_rejeita_funcao_desconhecida(client, operador):
    response = client.put(
        f"/users/{operador.id}",
        json={"funcao_codigos": ["FUNCAO_INEXISTENTE"]},
    )

    assert response.status_code == 400
