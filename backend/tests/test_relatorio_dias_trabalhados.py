from datetime import date

from app.models import RegistroHora, RegistroHoraEquipa
from app.models.perfil import Perfil
from app.models.user import User
from app.utils.security import hash_password
from app.models.cliente import Cliente
from app.models.obra import Obra
from app.models.projeto import Projeto
from tests.conftest import SENHA_TESTE


def _criar_utilizador_relatorio(db, perfil, nome, email):
    utilizador = User(
        name=nome,
        email=email,
        empresa="UNIDAL TESTE",
        hashed_password=hash_password(SENHA_TESTE),
        must_change_password=False,
        is_active=True,
        e_condutor=False,
        perfil_id=perfil.id,
    )
    db.add(utilizador)
    db.flush()
    return utilizador


def _criar_contexto(db):
    perfil = Perfil(nome="operador", is_active=True)
    db.add(perfil)
    db.flush()

    chefe = _criar_utilizador_relatorio(
        db, perfil, "Chefe Relatório", "chefe.relatorio@example.com"
    )
    jose = _criar_utilizador_relatorio(
        db, perfil, "José Relatório", "jose.relatorio@example.com"
    )
    outro = _criar_utilizador_relatorio(
        db, perfil, "Outro Relatório", "outro.relatorio@example.com"
    )

    projeto = Projeto(nome="Projeto Relatório", descricao="Teste", is_active=True)
    cliente = Cliente(nome="Cliente Relatório", is_active=True)
    db.add_all([projeto, cliente])
    db.flush()

    obra_a = Obra(nome="Obra A", descricao="A", cliente_id=cliente.id)
    obra_b = Obra(nome="Obra B", descricao="B", cliente_id=cliente.id)
    db.add_all([obra_a, obra_b])
    db.commit()
    for item in (projeto, cliente, obra_a, obra_b):
        db.refresh(item)

    return chefe, jose, outro, projeto, cliente, obra_a, obra_b


def _criar_registro(
    db,
    *,
    chefe,
    projeto,
    cliente,
    obra,
    data_registro,
    membro=None,
    intemperie=False,
    double_journey=False,
):
    registro = RegistroHora(
        usuario_id=chefe.id,
        projeto_id=projeto.id,
        cliente_id=cliente.id,
        obra_id=obra.id,
        data=data_registro,
        horas=8,
        double_journey_lider=False,
    )
    db.add(registro)
    db.flush()

    if membro is not None:
        db.add(
            RegistroHoraEquipa(
                registro_id=registro.id,
                user_id=membro.id,
                intemperie=intemperie,
                double_journey=double_journey,
            )
        )

    db.commit()
    db.refresh(registro)
    return registro


def test_criador_nao_conta_como_dia_trabalhado_sem_participacao(
    client, db, headers_admin
):
    chefe, jose, _, projeto, cliente, obra_a, _ = _criar_contexto(db)
    _criar_registro(
        db,
        chefe=chefe,
        projeto=projeto,
        cliente=cliente,
        obra=obra_a,
        data_registro=date(2026, 9, 1),
        membro=jose,
    )

    resposta = client.get(
        "/relatorio/dias-trabalhados",
        headers=headers_admin,
        params={
            "funcionario_id": chefe.id,
            "data_inicio": "2026-09-01",
            "data_fim": "2026-09-30",
        },
    )

    assert resposta.status_code == 200, resposta.text
    payload = resposta.json()
    assert payload["total_dias"] == 0
    assert payload["datas_trabalhadas"] == []


def test_membro_da_equipa_conta_e_intemperie_eh_reportada(
    client, db, headers_admin
):
    chefe, jose, _, projeto, cliente, obra_a, _ = _criar_contexto(db)
    _criar_registro(
        db,
        chefe=chefe,
        projeto=projeto,
        cliente=cliente,
        obra=obra_a,
        data_registro=date(2026, 9, 2),
        membro=jose,
        intemperie=True,
    )

    resposta = client.get(
        "/relatorio/dias-trabalhados",
        headers=headers_admin,
        params={
            "funcionario_id": jose.id,
            "data_inicio": "2026-09-01",
            "data_fim": "2026-09-30",
        },
    )

    assert resposta.status_code == 200, resposta.text
    payload = resposta.json()
    assert payload["total_dias"] == 1
    assert payload["datas_trabalhadas"] == ["2026-09-02"]
    assert payload["total_intemperies"] == 1
    assert payload["intemperies"] == [
        {"data": "2026-09-02", "obras": ["Obra A"]}
    ]


def test_intemperie_de_outro_membro_nao_contamina_funcionario(
    client, db, headers_admin
):
    chefe, jose, outro, projeto, cliente, obra_a, _ = _criar_contexto(db)
    registro = _criar_registro(
        db,
        chefe=chefe,
        projeto=projeto,
        cliente=cliente,
        obra=obra_a,
        data_registro=date(2026, 9, 3),
        membro=jose,
        intemperie=False,
    )
    db.add(
        RegistroHoraEquipa(
            registro_id=registro.id,
            user_id=outro.id,
            intemperie=True,
            double_journey=False,
        )
    )
    db.commit()

    resposta = client.get(
        "/relatorio/dias-trabalhados",
        headers=headers_admin,
        params={
            "funcionario_id": jose.id,
            "data_inicio": "2026-09-01",
            "data_fim": "2026-09-30",
        },
    )

    assert resposta.status_code == 200, resposta.text
    payload = resposta.json()
    assert payload["total_dias"] == 1
    assert payload["total_intemperies"] == 0
    assert payload["intemperies"] == []


def test_mesmo_dia_conta_uma_vez_e_double_journey_eh_reportado(
    client, db, headers_admin
):
    chefe, jose, _, projeto, cliente, obra_a, obra_b = _criar_contexto(db)
    for obra in (obra_a, obra_b):
        _criar_registro(
            db,
            chefe=chefe,
            projeto=projeto,
            cliente=cliente,
            obra=obra,
            data_registro=date(2026, 9, 4),
            membro=jose,
            double_journey=True,
        )

    resposta = client.get(
        "/relatorio/dias-trabalhados",
        headers=headers_admin,
        params={
            "funcionario_id": jose.id,
            "data_inicio": "2026-09-01",
            "data_fim": "2026-09-30",
        },
    )

    assert resposta.status_code == 200, resposta.text
    payload = resposta.json()
    assert payload["total_dias"] == 1
    assert payload["datas_trabalhadas"] == ["2026-09-04"]
    assert payload["total_double_journeys"] == 1
    assert payload["double_journeys"] == [
        {"data": "2026-09-04", "obras": ["Obra A", "Obra B"]}
    ]
