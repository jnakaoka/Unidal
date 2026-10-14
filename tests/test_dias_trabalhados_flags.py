"""Regressões do relatório com base isolada em SQLite."""
from datetime import date

from test_documentos_notificacoes import ctx
from app.models.registro_hora import RegistroHora, RegistroHoraEquipa
from app.models.obra import Obra
from app.models.cliente import Cliente
from app.models.projeto import Projeto


def test_double_journey_uma_obra_e_intemperie_independentes(ctx):
    client, db, users, _, _ = ctx
    cliente = Cliente(nome="Cliente teste")
    projeto = Projeto(nome="Projeto teste")
    db.add_all([cliente, projeto]); db.flush()
    obra = Obra(nome="Obra teste", cliente_id=cliente.id)
    db.add(obra); db.flush()
    for dia, dj, chuva in [(29, True, False), (30, False, True)]:
        reg = RegistroHora(usuario_id=users[0].id, projeto_id=projeto.id,
                           cliente_id=cliente.id, obra_id=obra.id,
                           data=date(2026, 9, dia), horas=8)
        db.add(reg); db.flush()
        db.add(RegistroHoraEquipa(registro_id=reg.id, user_id=users[2].id,
                                 double_journey=dj, intemperie=chuva))
        # A marcação de outro trabalhador não deve contaminar o selecionado.
        db.add(RegistroHoraEquipa(registro_id=reg.id, user_id=users[3].id,
                                 double_journey=not dj, intemperie=not chuva))
    db.commit()
    response = client.get('/relatorio/dias-trabalhados', params={
        'funcionario_id': users[2].id, 'data_inicio': '2026-09-01', 'data_fim': '2026-09-30'})
    assert response.status_code == 200, response.text
    data = response.json()
    assert data['total_dias'] == 2
    assert data['total_double_journeys'] == 1
    assert data['double_journeys'] == [{'data': '2026-09-29', 'obras': ['Obra teste']}]
    assert data['total_intemperies'] == 1
    assert data['intemperies'] == [{'data': '2026-09-30', 'obras': ['Obra teste']}]


def test_manobrador_double_journey_sem_intemperie(ctx):
    client, db, users, _, _ = ctx
    cliente = Cliente(nome="Cliente máquina")
    projeto = Projeto(nome="Projeto máquina")
    db.add_all([cliente, projeto]); db.flush()
    obra = Obra(nome="Obra máquina", cliente_id=cliente.id)
    db.add(obra); db.flush()
    db.add(RegistroHora(usuario_id=users[0].id, projeto_id=projeto.id,
                        cliente_id=cliente.id, obra_id=obra.id,
                        data=date(2026, 9, 29), horas=8,
                        intervencao_maquinas_opcoes={'manobradorApenas': {
                            'checked': True, 'manobrador_user_id': users[2].id,
                            'double_journey': True}}))
    db.commit()
    response = client.get('/relatorio/dias-trabalhados', params={
        'funcionario_id': users[2].id, 'data_inicio': '2026-09-01', 'data_fim': '2026-09-30'})
    assert response.status_code == 200, response.text
    data = response.json()
    assert data['total_dias'] == 1
    assert data['total_double_journeys'] == 1
    assert data['total_intemperies'] == 0
