"""Testes isolados em SQLite; nunca utilizam a base de produção."""
import sys
from datetime import date
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from app.main import app
from app.database import Base, get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.perfil import Perfil
from app.models.projeto import Projeto
from app.models.registro_hora import RegistroHora
from app.models.notificacao import EdicaoApontamento, Notificacao
from app.models.documento import DocumentoVersao
from app.utils.security import create_access_token


@pytest.fixture
def ctx(tmp_path, monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    @event.listens_for(engine, "connect")
    def foreign_keys(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine)()
    perfis = [Perfil(nome="admin"), Perfil(nome="operador"), Perfil(nome="motorista")]
    db.add_all(perfis); db.flush()
    users = [User(name=nome, email=f"{nome}@teste.pt", empresa="UNIDAL", hashed_password="unused", perfil_id=p.id, is_active=True)
             for nome, p in [("admin", perfis[0]), ("admin2", perfis[0]), ("operador", perfis[1]), ("outro", perfis[1]), ("motorista", perfis[2])]]
    db.add_all(users); db.commit()
    def database():
        yield db
    app.dependency_overrides[get_db] = database
    atual = {"user": users[0]}
    app.dependency_overrides[get_current_user] = lambda: atual["user"]
    monkeypatch.setenv("DOCUMENTOS_DIR", str(tmp_path))
    with TestClient(app) as client:
        yield client, db, users, atual, tmp_path
    app.dependency_overrides.clear()
    db.close(); engine.dispose()


def categoria(client, **kw):
    r = client.post("/documentos/categorias", json={"nome": "Segurança", "visibilidade": "todos", **kw})
    assert r.status_code == 201, r.text
    return r.json()["id"]


def upload(client, cid, data=b"%PDF-1.4 teste", filename="manual.pdf"):
    return client.post("/documentos/", data={"titulo": "Manual", "categoria_id": cid}, files={"ficheiro": (filename, data, "application/pdf")})


def test_publicos_restritos_download_direto_e_revogacao(ctx):
    c, db, users, atual, _ = ctx
    cid = categoria(c, visibilidade="usuarios", usuario_ids=[users[2].id])
    doc = upload(c, cid).json()
    atual["user"] = users[3]
    assert c.get("/documentos/").json() == []
    assert c.get("/documentos/categorias").json() == []
    assert c.get(f"/documentos/{doc['id']}/download").status_code == 404
    assert c.get(f"/documentos/{doc['id']}/versoes").status_code == 404
    assert upload(c, cid).status_code == 403
    atual["user"] = users[2]
    assert c.get(f"/documentos/{doc['id']}/download").content == b"%PDF-1.4 teste"
    atual["user"] = users[0]
    assert c.put(f"/documentos/categorias/{cid}", json={"nome": "Segurança", "visibilidade": "admin"}).status_code == 200
    atual["user"] = users[2]
    assert c.get(f"/documentos/{doc['id']}/download").status_code == 404


def test_perfis_publicos_e_inativos(ctx):
    c, db, users, atual, _ = ctx
    cid = categoria(c, visibilidade="perfis", perfil_ids=[users[4].perfil_id])
    upload(c, cid)
    atual["user"] = users[2]
    assert c.get("/documentos/").json() == []
    atual["user"] = users[4]
    assert len(c.get("/documentos/").json()) == 1
    atual["user"] = users[0]
    assert c.put(f"/documentos/categorias/{cid}", json={"nome": "Segurança", "visibilidade": "todos"}).status_code == 200
    atual["user"] = users[2]
    assert len(c.get("/documentos/").json()) == 1
    users[2].is_active = False; db.commit()
    assert c.get("/documentos/").json() == []


def test_versoes_arquivo_limites_e_sem_ficheiros_orfaos(ctx, monkeypatch):
    c, db, users, atual, pasta = ctx
    cid = categoria(c)
    doc = upload(c, cid).json()
    r = c.post(f"/documentos/{doc['id']}/versoes", files={"ficheiro": ("novo.pdf", b"nova versao")})
    assert r.status_code == 201
    assert len(c.get(f"/documentos/{doc['id']}/versoes").json()) == 2
    assert c.get(f"/documentos/{doc['id']}/download").content == b"nova versao"
    assert c.get(f"/documentos/{doc['id']}/download?versao_id={doc['versao_id']}").content == b"%PDF-1.4 teste"
    assert upload(c, cid, filename="malware.exe").status_code == 422
    assert upload(c, cid, data=b"").status_code == 422
    monkeypatch.setenv("DOCUMENTOS_MAX_MB", "1")
    assert upload(c, cid, data=b"x" * (1024 * 1024 + 1)).status_code == 413
    assert len(list(pasta.iterdir())) == 2
    assert db.query(DocumentoVersao).count() == 2
    assert c.delete(f"/documentos/{doc['id']}").status_code == 200
    assert c.get(f"/documentos/{doc['id']}/download").status_code == 404


def test_categoria_invalida_duplicada_e_sem_destinatarios(ctx):
    c, *_ = ctx
    categoria(c)
    assert c.post("/documentos/categorias", json={"nome": "Segurança"}).status_code == 409
    assert c.post("/documentos/categorias", json={"nome": "Restrita", "visibilidade": "usuarios"}).status_code == 422
    assert c.post("/documentos/categorias", json={"nome": "Restrita", "visibilidade": "usuarios", "usuario_ids": [999]}).status_code == 422


def criar_registo(db, user):
    p = Projeto(nome="Teste")
    db.add(p); db.flush()
    reg = RegistroHora(usuario_id=user.id, projeto_id=p.id, data=date(2026, 10, 4), horas=8)
    db.add(reg); db.commit()
    return reg, {"projeto_id": p.id, "data": "2026-10-04", "horas": 8}


def test_edicao_autor_real_sem_alertas_falsos_e_leitura_individual(ctx):
    c, db, users, atual, _ = ctx
    reg, payload = criar_registo(db, users[2])
    atual["user"] = users[2]
    assert c.put(f"/registro-horas/{reg.id}", json=payload).status_code == 200
    assert db.query(EdicaoApontamento).count() == 0
    payload.update(horas=10, modificado_por=users[1].id)
    r = c.put(f"/registro-horas/{reg.id}", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["modificado_por"] == users[2].id
    e = db.query(EdicaoApontamento).one()
    assert e.autor_id == users[2].id
    assert e.alteracoes == {"horas": {"antes": 8.0, "depois": 10.0}}
    assert db.query(Notificacao).count() == 2
    assert c.get("/notificacoes/").status_code == 403
    atual["user"] = users[0]
    n = c.get("/notificacoes/").json()
    assert n["nao_lidas"] == 1
    nid = n["items"][0]["id"]
    assert c.patch(f"/notificacoes/{nid}/ler").status_code == 200
    assert c.get("/notificacoes/").json()["nao_lidas"] == 0
    atual["user"] = users[1]
    assert c.get("/notificacoes/").json()["nao_lidas"] == 1
    assert c.patch(f"/notificacoes/{nid}/ler").status_code == 404
    assert len(c.get(f"/notificacoes/apontamentos/{reg.id}/historico").json()) == 1
    atual["user"] = users[3]
    assert c.put(f"/registro-horas/{reg.id}", json=payload).status_code == 403


def test_sem_login(ctx):
    c, *_ = ctx
    app.dependency_overrides.pop(get_current_user)
    assert c.get("/documentos/").status_code == 401
    assert c.put("/registro-horas/1", json={"projeto_id": 1, "data": "2026-10-04"}).status_code == 401


def test_equipa_e_json_no_historico(ctx):
    c, db, users, atual, _ = ctx
    reg, payload = criar_registo(db, users[2])
    atual["user"] = users[2]
    payload["equipa"] = [{"user_id": users[3].id, "intemperie": True}]
    r = c.put(f"/registro-horas/{reg.id}", json=payload)
    assert r.status_code == 200, r.text
    e = db.query(EdicaoApontamento).one()
    assert e.alteracoes["equipa"]["depois"][0]["intemperie"] is True
    assert c.put(f"/registro-horas/{reg.id}", json=payload).status_code == 200
    assert db.query(EdicaoApontamento).count() == 1


def test_autor_obtido_do_jwt_e_admin_inativo(ctx):
    c, db, users, atual, _ = ctx
    from app.dependencies.auth import get_db as auth_db
    app.dependency_overrides[auth_db] = lambda: db
    app.dependency_overrides.pop(get_current_user)
    reg, payload = criar_registo(db, users[2])
    payload.update(horas=9, modificado_por=users[0].id)
    headers = {"Authorization": "Bearer " + create_access_token({"sub": users[2].email})}
    r = c.put(f"/registro-horas/{reg.id}", json=payload, headers=headers)
    assert r.status_code == 200, r.text
    assert db.query(EdicaoApontamento).one().autor_id == users[2].id
    users[0].is_active = False; db.commit()
    headers = {"Authorization": "Bearer " + create_access_token({"sub": users[0].email})}
    assert c.get("/notificacoes/", headers=headers).status_code == 403


def test_migracao_upgrade_downgrade_e_sql_mysql():
    import importlib.util
    from io import StringIO
    from alembic.migration import MigrationContext
    from alembic.operations import Operations
    spec = importlib.util.spec_from_file_location("feature_migration", Path(__file__).resolve().parents[1] / "backend/alembic/versions/f83a2d6c9100_documentos_notificacoes.py")
    migration = importlib.util.module_from_spec(spec); spec.loader.exec_module(migration)
    engine = create_engine("sqlite://")
    with engine.begin() as connection:
        connection.exec_driver_sql("CREATE TABLE users (id INTEGER PRIMARY KEY)")
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
            from sqlalchemy import inspect
            assert "notificacoes" in inspect(connection).get_table_names()
            migration.downgrade()
            assert inspect(connection).get_table_names() == ["users"]
    output = StringIO()
    with Operations.context(MigrationContext.configure(dialect_name="mysql", opts={"as_sql": True, "output_buffer": output})):
        migration.upgrade()
    assert "CREATE TABLE documento_categorias" in output.getvalue()


def test_observacao_criacao_edicao_preservacao_e_limpeza(ctx):
    c, db, users, atual, _ = ctx
    reg, payload = criar_registo(db, users[2])
    atual["user"] = users[2]
    payload["observacao"] = "Atraso na entrega.\nChuva durante a tarde."
    r = c.put(f"/registro-horas/{reg.id}", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["observacao"] == payload["observacao"]
    assert db.query(EdicaoApontamento).one().alteracoes["observacao"]["depois"] == payload["observacao"]
    payload.pop("observacao")
    assert c.put(f"/registro-horas/{reg.id}", json=payload).json()["observacao"] == "Atraso na entrega.\nChuva durante a tarde."
    assert db.query(EdicaoApontamento).count() == 1
    payload["observacao"] = None
    assert c.put(f"/registro-horas/{reg.id}", json=payload).json()["observacao"] is None
    assert db.query(EdicaoApontamento).count() == 2
    payload["observacao"] = "x" * 5001
    assert c.put(f"/registro-horas/{reg.id}", json=payload).status_code == 422
    payload.update(usuario_id=users[2].id, observacao="Visita técnica")
    r = c.post("/registro-horas/", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["observacao"] == "Visita técnica"
    assert any(item["observacao"] == "Visita técnica" for item in c.get("/registro-horas/").json())
