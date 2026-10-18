from datetime import date

from app.models.funcao import Funcao
from app.models.ocorrencia import Ocorrencia
from app.models.perfil import Perfil
from app.models.user import User
from app.utils.security import hash_password


def _user(db, nome, email, perfil):
    p = db.query(Perfil).filter(Perfil.nome == perfil).first()
    if not p:
        p = Perfil(nome=perfil)
        db.add(p)
        db.flush()
    u = User(
        name=nome,
        email=email,
        empresa="UNIDAL",
        hashed_password=hash_password("Teste123!"),
        perfil_id=p.id,
        is_active=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _atribuir_funcao(db, user, codigo="CHEFE_EQUIPE"):
    funcao = db.query(Funcao).filter(Funcao.codigo == codigo).first()
    assert funcao is not None
    user.funcoes.append(funcao)
    db.commit()
    db.refresh(user)
    return user


def _headers(client, email):
    response = client.post("/auth/login/", data={"username": email, "password": "Teste123!"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_operador_cria_e_ve_apenas_as_proprias_ocorrencias(client, db):
    operador1 = _user(db, "Chefe Um", "chefe1@teste.pt", "operador")
    _atribuir_funcao(db, operador1)
    operador2 = _user(db, "Chefe Dois", "chefe2@teste.pt", "operador")
    _atribuir_funcao(db, operador2)
    funcionario = _user(db, "Funcionário", "func@teste.pt", "operador")
    testemunha = _user(db, "Testemunha", "test@teste.pt", "operador")

    payload = {
        "data": "2026-09-22",
        "chefe_equipe_id": operador1.id,
        "funcionario_id": funcionario.id,
        "descricao": "Descrição da ocorrência para teste.",
        "testemunha_ids": [testemunha.id],
    }
    response = client.post("/ocorrencias/", json=payload, headers=_headers(client, operador1.email))
    assert response.status_code == 201
    assert response.json()["criado_por_id"] == operador1.id
    assert response.json()["testemunhas"][0]["id"] == testemunha.id

    response = client.get("/ocorrencias/", headers=_headers(client, operador2.email))
    assert response.status_code == 200
    assert response.json() == []


def test_admin_ve_todas_edita_e_elimina(client, db):
    admin = _user(db, "Admin", "admin.oc@teste.pt", "admin")
    chefe = _user(db, "Chefe", "chefe.oc@teste.pt", "operador")
    _atribuir_funcao(db, chefe)
    funcionario = _user(db, "Funcionário", "func.oc@teste.pt", "operador")

    ocorrencia = Ocorrencia(
        data=date(2026, 9, 22),
        chefe_equipe_id=chefe.id,
        funcionario_id=funcionario.id,
        descricao="Original",
        criado_por_id=chefe.id,
    )
    db.add(ocorrencia)
    db.commit()
    db.refresh(ocorrencia)

    headers = _headers(client, admin.email)
    response = client.get("/ocorrencias/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

    payload = {
        "data": "2026-09-23",
        "chefe_equipe_id": chefe.id,
        "funcionario_id": funcionario.id,
        "descricao": "Atualizada pelo administrador.",
        "testemunha_ids": [],
    }
    response = client.put(f"/ocorrencias/{ocorrencia.id}", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["descricao"] == payload["descricao"]

    response = client.delete(f"/ocorrencias/{ocorrencia.id}", headers=headers)
    assert response.status_code == 204


def test_operador_nao_edita_nem_elimina(client, db):
    operador = _user(db, "Chefe", "chefe.block@teste.pt", "operador")
    _atribuir_funcao(db, operador)
    funcionario = _user(db, "Funcionário", "func.block@teste.pt", "operador")
    ocorrencia = Ocorrencia(
        data=date(2026, 9, 22),
        chefe_equipe_id=operador.id,
        funcionario_id=funcionario.id,
        descricao="Teste",
        criado_por_id=operador.id,
    )
    db.add(ocorrencia)
    db.commit()
    db.refresh(ocorrencia)
    headers = _headers(client, operador.email)
    payload = {
        "data": "2026-09-22",
        "chefe_equipe_id": operador.id,
        "funcionario_id": funcionario.id,
        "descricao": "Tentativa de edição",
        "testemunha_ids": [],
    }
    assert client.put(f"/ocorrencias/{ocorrencia.id}", json=payload, headers=headers).status_code == 403
    assert client.delete(f"/ocorrencias/{ocorrencia.id}", headers=headers).status_code == 403


def test_funcionario_nao_pode_ser_testemunha(client, db):
    operador = _user(db, "Chefe", "chefe.valid@teste.pt", "operador")
    _atribuir_funcao(db, operador)
    funcionario = _user(db, "Funcionário", "func.valid@teste.pt", "operador")
    payload = {
        "data": "2026-09-22",
        "chefe_equipe_id": operador.id,
        "funcionario_id": funcionario.id,
        "descricao": "Teste de validação.",
        "testemunha_ids": [funcionario.id],
    }
    response = client.post("/ocorrencias/", json=payload, headers=_headers(client, operador.email))
    assert response.status_code == 422


def test_operador_nao_pode_registar_outro_chefe(client, db):
    operador = _user(db, "Chefe autenticado", "chefe.auth@teste.pt", "operador")
    _atribuir_funcao(db, operador)
    outro_chefe = _user(db, "Outro chefe", "outro.chefe@teste.pt", "operador")
    _atribuir_funcao(db, outro_chefe)
    funcionario = _user(db, "Funcionário", "func.chefe@teste.pt", "operador")
    payload = {
        "data": "2026-09-23",
        "chefe_equipe_id": outro_chefe.id,
        "funcionario_id": funcionario.id,
        "descricao": "Tentativa de registar por outro chefe.",
        "testemunha_ids": [],
    }
    response = client.post("/ocorrencias/", json=payload, headers=_headers(client, operador.email))
    assert response.status_code == 403


def test_descricao_apenas_espacos_e_rejeitada(client, db):
    operador = _user(db, "Chefe espaços", "chefe.espacos@teste.pt", "operador")
    _atribuir_funcao(db, operador)
    funcionario = _user(db, "Funcionário espaços", "func.espacos@teste.pt", "operador")
    payload = {
        "data": "2026-09-23",
        "chefe_equipe_id": operador.id,
        "funcionario_id": funcionario.id,
        "descricao": "     ",
        "testemunha_ids": [],
    }
    response = client.post("/ocorrencias/", json=payload, headers=_headers(client, operador.email))
    assert response.status_code == 422


def test_perfil_administrador_tem_permissoes_de_admin(client, db):
    admin = _user(db, "Administrador", "administrador.oc@teste.pt", "administrador")
    chefe = _user(db, "Chefe alias", "chefe.alias@teste.pt", "operador")
    _atribuir_funcao(db, chefe)
    funcionario = _user(db, "Funcionário alias", "func.alias@teste.pt", "operador")
    payload = {
        "data": "2026-09-23",
        "chefe_equipe_id": chefe.id,
        "funcionario_id": funcionario.id,
        "descricao": "Ocorrência criada pelo perfil administrador.",
        "testemunha_ids": [],
    }
    response = client.post("/ocorrencias/", json=payload, headers=_headers(client, admin.email))
    assert response.status_code == 201
    ocorrencia_id = response.json()["id"]
    assert client.delete(
        f"/ocorrencias/{ocorrencia_id}",
        headers=_headers(client, admin.email),
    ).status_code == 204


def test_operador_sem_funcao_chefe_nao_acessa_ocorrencias(client, db):
    operador = _user(db, "Operador comum", "operador.comum@teste.pt", "operador")
    response = client.get("/ocorrencias/", headers=_headers(client, operador.email))
    assert response.status_code == 403


def test_admin_nao_pode_indicar_operador_comum_como_chefe(client, db):
    admin = _user(db, "Admin valida chefe", "admin.valida.chefe@teste.pt", "admin")
    operador_comum = _user(db, "Operador comum", "operador.nao.chefe@teste.pt", "operador")
    funcionario = _user(db, "Funcionário", "func.nao.chefe@teste.pt", "operador")
    payload = {
        "data": "2026-09-23",
        "chefe_equipe_id": operador_comum.id,
        "funcionario_id": funcionario.id,
        "descricao": "Chefe sem função operacional.",
        "testemunha_ids": [],
    }
    response = client.post("/ocorrencias/", json=payload, headers=_headers(client, admin.email))
    assert response.status_code == 400
