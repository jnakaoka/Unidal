"""Verificação HTTP 1:1 com SQLite em memória, sem imagens reais ou base externa.

PYTHONPATH=backend python -m pytest --noconftest backend/tests/test_face_verification.py -q
"""
from datetime import datetime
from math import sqrt
from types import SimpleNamespace

import pytest
from cryptography.fernet import Fernet
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.dependencies.auth import get_current_user
from app.models.face_profile import FaceProfile
from app.models.funcao import Funcao, usuario_funcoes
from app.models.perfil import Perfil
from app.models.user import User
from app.routes import face_profile as route
from app.services import face_profile as service
from app.services.face_engine import FaceEmbedding, FaceEngine, FaceEngineError, get_face_engine


class VerificationEngine(FaceEngine):
    vector = [1., 0.]
    model = 'test-v1'

    def extract_embedding(self, image_bytes):
        if image_bytes == b'none':
            raise FaceEngineError('Nenhum rosto detetado.')
        if image_bytes == b'multiple':
            raise FaceEngineError('Foram detetados 2 rostos.')
        return FaceEmbedding(self.vector, self.model)


@pytest.fixture
def verification(monkeypatch):
    monkeypatch.setenv('FACE_BIOMETRICS_ENABLED', 'true')
    monkeypatch.setenv('FACE_EMBEDDING_KEY', Fernet.generate_key().decode())
    monkeypatch.delenv('FACE_VERIFICATION_THRESHOLD', raising=False)
    engine = create_engine('sqlite://', poolclass=StaticPool, connect_args={'check_same_thread': False})
    Base.metadata.create_all(engine, tables=[Perfil.__table__, User.__table__, Funcao.__table__, usuario_funcoes, FaceProfile.__table__])
    db = Session(engine)
    role = Perfil(nome='operador', is_active=True)
    target = User(name='Pessoa de teste', email='test@example.com', empresa='TESTE', hashed_password='unused', is_active=True, perfil=role)
    db.add(target)
    db.flush()
    profile = FaceProfile(user_id=target.id, embedding=service._serialize_embedding([1., 0.]),
                          model_version='test-v1', is_active=True, enrolled_at=datetime(2026, 1, 1))
    db.add(profile)
    db.commit()
    target_id = target.id
    actor = SimpleNamespace(id=99, perfil=SimpleNamespace(nome='admin'))
    face_engine = VerificationEngine()
    app = FastAPI()
    app.include_router(route.router, prefix='/biometrics')
    app.dependency_overrides[get_current_user] = lambda: actor
    app.dependency_overrides[route.get_db] = lambda: db
    app.dependency_overrides[get_face_engine] = lambda: face_engine
    statements = []
    event.listen(engine, 'before_cursor_execute', lambda conn, cursor, statement, parameters, context, many: statements.append(statement))
    with TestClient(app) as client:
        def verify(data=b'photo', mime='image/jpeg', user_id=None):
            return client.post(f'/biometrics/users/{target_id if user_id is None else user_id}/verify',
                               files={'image': ('selfie.jpg', data, mime)})
        yield SimpleNamespace(client=client, app=app, actor=actor, db=db, target=target,
                              profile=profile, engine=face_engine, verify=verify, statements=statements)
    db.close()
    engine.dispose()


def test_rosto_corresponde_sem_alterar_perfil_ou_gravar_presenca(verification):
    v = verification
    before = (v.profile.embedding, v.profile.enrolled_at, v.profile.updated_at)
    v.statements.clear()
    response = v.verify()
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['matched'] is True
    assert result['similarity'] == pytest.approx(1.)
    assert result['threshold'] == .5
    assert result['user_id'] == v.target.id
    assert result['user_name'] == 'Pessoa de teste'
    assert result['processing_ms'] >= 0 and len(result['request_id']) == 12
    assert set(result) == {'user_id', 'user_name', 'matched', 'similarity', 'threshold', 'model_version', 'verified_at', 'request_id', 'processing_ms'}
    assert not any(sql.lstrip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')) for sql in v.statements)
    v.db.refresh(v.profile)
    assert (v.profile.embedding, v.profile.enrolled_at, v.profile.updated_at) == before


@pytest.mark.parametrize('candidate,expected_score,matched', [
    ([0., 1.], 0., False), ([-1., 0.], -1., False), ([3., 0.], 1., True),
    ([.5, sqrt(.75)], .5, True), ([.499, sqrt(1 - .499 ** 2)], .499, False),
])
def test_comparacao_normalizada_e_limiar(verification, candidate, expected_score, matched):
    verification.engine.vector = candidate
    response = verification.verify()
    assert response.status_code == 200
    assert response.json()['matched'] is matched
    assert response.json()['similarity'] == pytest.approx(expected_score)


def test_limiar_configuravel(verification, monkeypatch):
    monkeypatch.setenv('FACE_VERIFICATION_THRESHOLD', '.9')
    verification.engine.vector = [.8, .6]
    response = verification.verify()
    assert response.json()['threshold'] == .9
    assert response.json()['matched'] is False


def test_compara_apenas_id_escolhido(verification):
    v = verification
    other = User(name='Outra pessoa', email='other@example.com', empresa='TESTE', hashed_password='unused', is_active=True, perfil=v.target.perfil)
    v.db.add(other)
    v.db.flush()
    v.db.add(FaceProfile(user_id=other.id, embedding=service._serialize_embedding([0., 1.]), model_version='test-v1', is_active=True))
    v.db.commit()
    v.engine.vector = [0., 1.]
    result = v.verify().json()
    assert result['user_id'] == v.target.id
    assert result['matched'] is False


def test_utilizador_inexistente(verification):
    assert verification.verify(user_id=99999).status_code == 404


@pytest.mark.parametrize('state', ['missing', 'revoked', 'inactive_profile', 'empty', 'inactive_user'])
def test_perfil_indisponivel(verification, state):
    v = verification
    if state == 'missing':
        v.db.delete(v.profile)
    elif state == 'revoked':
        v.profile.revoked_at = datetime(2026, 1, 2)
    elif state == 'inactive_profile':
        v.profile.is_active = False
    elif state == 'empty':
        v.profile.embedding = None
    else:
        v.target.is_active = False
    v.db.commit()
    response = v.verify()
    assert response.status_code == 409
    assert len(response.headers['x-face-request-id']) == 12
    assert 'matched' not in response.json()


@pytest.mark.parametrize('fault', ['corrupt', 'wrong_key', 'missing_key', 'invalid_key', 'invalid_length', 'nan', 'zero'])
def test_template_ou_chave_invalida_falha_fechado(verification, monkeypatch, fault):
    v = verification
    if fault == 'corrupt':
        v.profile.embedding = b'not-a-template'
    elif fault == 'wrong_key':
        monkeypatch.setenv('FACE_EMBEDDING_KEY', Fernet.generate_key().decode())
    elif fault == 'missing_key':
        monkeypatch.delenv('FACE_EMBEDDING_KEY')
    elif fault == 'invalid_key':
        monkeypatch.setenv('FACE_EMBEDDING_KEY', 'invalid')
    elif fault == 'invalid_length':
        v.profile.embedding = service._embedding_cipher().encrypt(b'bad')
    elif fault == 'nan':
        v.profile.embedding = service._serialize_embedding([float('nan'), 0.])
    else:
        v.profile.embedding = service._serialize_embedding([0., 0.])
    v.db.commit()
    response = v.verify()
    assert response.status_code == 503
    assert 'matched' not in response.json()


@pytest.mark.parametrize('fault', ['model', 'dimensions'])
def test_modelo_ou_dimensoes_diferentes_exigem_recadastro(verification, fault):
    if fault == 'model':
        verification.engine.model = 'different-model'
    else:
        verification.engine.vector = [1., 0., 0.]
    assert verification.verify().status_code == 409


@pytest.mark.parametrize('vector', [[0., 0.], [float('nan'), 0.], [float('inf'), 0.]])
def test_vetor_da_selfie_invalido_nao_confirma(verification, vector):
    verification.engine.vector = vector
    assert verification.verify().status_code == 422


@pytest.mark.parametrize('threshold', ['nan', 'inf', '0', '-.1', '1.1', 'text'])
def test_limiar_invalido_nao_confirma(verification, monkeypatch, threshold):
    monkeypatch.setenv('FACE_VERIFICATION_THRESHOLD', threshold)
    assert verification.verify().status_code == 503


@pytest.mark.parametrize('data,mime,status', [
    (b'none', 'image/jpeg', 422), (b'multiple', 'image/jpeg', 422),
    (b'', 'image/jpeg', 422), (b'photo', 'text/plain', 415),
    (b'x' * (route.MAX_IMAGE_BYTES + 1), 'image/jpeg', 413),
], ids=['no-face', 'multiple-faces', 'empty', 'wrong-mime', 'too-large'])
def test_upload_invalido_nao_compara(verification, data, mime, status):
    assert verification.verify(data, mime).status_code == status


def test_sem_ficheiro(verification):
    response = verification.client.post(f'/biometrics/users/{verification.target.id}/verify')
    assert response.status_code == 422


def test_apenas_administrador(verification):
    verification.actor.perfil.nome = 'operador'
    assert verification.verify().status_code == 403


def test_exige_autenticacao(verification):
    verification.app.dependency_overrides.pop(get_current_user)
    assert verification.verify().status_code == 401


def test_funcionalidade_desativada(verification, monkeypatch):
    monkeypatch.setenv('FACE_BIOMETRICS_ENABLED', 'false')
    assert verification.verify().status_code == 503


def test_motor_nao_configurado_nao_confirma(verification):
    from app.services.face_engine import UnconfiguredFaceEngine
    verification.app.dependency_overrides[get_face_engine] = UnconfiguredFaceEngine
    assert verification.verify().status_code == 503


def test_falha_interna_nao_expoe_detalhes_nem_confirma(verification, monkeypatch):
    def broken(*args):
        raise RuntimeError('private database error')
    monkeypatch.setattr(service, 'verify', broken)
    response = verification.verify()
    assert response.status_code == 500
    assert len(response.headers['x-face-request-id']) == 12
    assert 'private database error' not in response.text
    assert 'matched' not in response.json()
