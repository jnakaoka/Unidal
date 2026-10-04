from copy import deepcopy
from sqlalchemy import func
from fastapi.encoders import jsonable_encoder
from app.models.notificacao import EdicaoApontamento, Notificacao
from app.models.user import User
from app.models.perfil import Perfil


def snapshot(reg):
    dados = {c.name: getattr(reg, c.name) for c in reg.__table__.columns
             if c.name not in {"id", "modificado_por", "modificado_em"}}
    dados["equipa"] = sorted([
        {"user_id": m.user_id, "intemperie": bool(m.intemperie), "double_journey": bool(m.double_journey)}
        for m in reg.equipa
    ], key=lambda m: m["user_id"])
    return deepcopy(jsonable_encoder(dados))


def registar_edicao(db, reg, autor, antes, depois):
    alteracoes = {k: {"antes": antes.get(k), "depois": depois.get(k)}
                  for k in antes.keys() | depois.keys() if antes.get(k) != depois.get(k)}
    if not alteracoes:
        return False
    evento = EdicaoApontamento(
        registro_id=reg.id, autor_id=autor.id, autor_nome=autor.name,
        resumo=f"{autor.name} editou o apontamento #{reg.id} de {reg.data:%d/%m/%Y}.",
        alteracoes=alteracoes,
    )
    db.add(evento)
    db.flush()
    admins = db.query(User).join(Perfil).filter(User.is_active.is_(True), func.lower(Perfil.nome) == "admin").all()
    db.add_all([Notificacao(usuario_id=u.id, edicao_id=evento.id) for u in admins])
    return True
