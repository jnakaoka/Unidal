"""Contrato HTTP do cadastro, sem ligar a uma base de dados.

Executar com --noconftest para dispensar as fixtures globais de MySQL.
"""
from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.dependencies.auth import get_current_user
from app.routes import face_profile
from app.services.face_engine import (
    FaceEmbedding,
    FaceEngine,
    FaceEngineError,
    UnconfiguredFaceEngine,
    get_face_engine,
)


class CaptureEngine(FaceEngine):
    def __init__(self):
        self.images = []

    def extract_embedding(self, image_bytes):
        self.images.append(image_bytes)
        if image_bytes == b"invalid":
            raise FaceEngineError("Nenhum rosto detetado.")
        return FaceEmbedding([3.0, 4.0], "test-v1")


@pytest.fixture
def enrollment_api(monkeypatch):
    monkeypatch.setenv("FACE_BIOMETRICS_ENABLED", "true")
    app = FastAPI()
    app.include_router(face_profile.router, prefix="/biometrics")
    actor = SimpleNamespace(id=7, perfil=SimpleNamespace(nome="admin"))
    engine = CaptureEngine()
    saved = []

    def persist(**kwargs):
        saved.append(kwargs)
        return {"user_id": kwargs["user_id"], "enrolled": True,
                "model_version": kwargs["face_embedding"].model_version,
                "enrolled_at": datetime(2026, 1, 1)}

    monkeypatch.setattr(face_profile.face_profile_service, "enroll", persist)
    app.dependency_overrides[get_current_user] = lambda: actor
    app.dependency_overrides[face_profile.get_db] = lambda: None
    app.dependency_overrides[get_face_engine] = lambda: engine
    with TestClient(app) as client:
        yield SimpleNamespace(client=client, app=app, actor=actor, engine=engine, saved=saved)


def upload(client, images):
    return client.post("/biometrics/users/12/enroll", files=images)


def photos(count=1, data=b"photo", mime="image/jpeg"):
    return [("images", (f"face-{i}.jpg", data, mime)) for i in range(count)]


@pytest.mark.parametrize("count", [1, 3, 5])
def test_cadastro_uma_foto_e_clientes_anteriores(enrollment_api, count):
    api = enrollment_api
    response = upload(api.client, photos(count))
    assert response.status_code == 200, response.text
    assert response.json()["enrolled"] is True
    assert len(api.engine.images) == count
    assert len(api.saved) == 1
    assert api.saved[0]["user_id"] == 12
    assert api.saved[0]["enrolled_by"] == 7
    assert api.saved[0]["face_embedding"].vector == pytest.approx([0.6, 0.8])


@pytest.mark.parametrize("files,expected", [
    ([], 422),
    (photos(6), 422),
    (photos(data=b""), 422),
    (photos(mime="text/plain"), 415),
    (photos(data=b"x" * (face_profile.MAX_IMAGE_BYTES + 1)), 413),
    (photos(data=b"invalid"), 422),
])
def test_cadastro_rejeitado_nao_grava(enrollment_api, files, expected):
    response = upload(enrollment_api.client, files)
    assert response.status_code == expected, response.text
    assert not enrollment_api.saved


def test_motor_nao_configurado_devolve_503(enrollment_api):
    enrollment_api.app.dependency_overrides[get_face_engine] = UnconfiguredFaceEngine
    response = upload(enrollment_api.client, photos())
    assert response.status_code == 503
    assert not enrollment_api.saved


def test_funcionalidade_desativada_nao_grava(enrollment_api, monkeypatch):
    monkeypatch.setenv("FACE_BIOMETRICS_ENABLED", "false")
    assert upload(enrollment_api.client, photos()).status_code == 503
    assert not enrollment_api.saved


def test_operador_nao_pode_cadastrar(enrollment_api):
    enrollment_api.actor.perfil.nome = "operador"
    assert upload(enrollment_api.client, photos()).status_code == 403
    assert not enrollment_api.saved


def test_sem_autenticacao_nao_pode_cadastrar(enrollment_api):
    enrollment_api.app.dependency_overrides.pop(get_current_user)
    assert upload(enrollment_api.client, photos()).status_code == 401
    assert not enrollment_api.saved


def test_validacao_previa_nao_grava(enrollment_api):
    response = enrollment_api.client.post(
        "/biometrics/capture/check", files={"image": ("face.jpg", b"photo", "image/jpeg")}
    )
    assert response.status_code == 200
    assert response.json()["valid"] is True
    assert not enrollment_api.saved
