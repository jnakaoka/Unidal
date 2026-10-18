from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.routes.documento import admin_ativo
from app.models.documento import agora
from app.models.notificacao import EdicaoApontamento, Notificacao

router = APIRouter(prefix="/notificacoes", tags=["Notificações"])


@router.get("/")
def listar(db: Session = Depends(get_db), user=Depends(admin_ativo),
           limite: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    q = db.query(Notificacao).filter(Notificacao.usuario_id == user.id)
    rows = (db.query(Notificacao, EdicaoApontamento)
            .join(EdicaoApontamento, Notificacao.edicao_id == EdicaoApontamento.id)
            .filter(Notificacao.usuario_id == user.id)
            .order_by(Notificacao.id.desc()).offset(offset).limit(limite).all())
    return {"nao_lidas": q.filter(Notificacao.lida_em.is_(None)).count(), "total": q.count(), "items": [
        {"id": n.id, "lida_em": n.lida_em, "registro_id": e.registro_id, "autor_nome": e.autor_nome,
         "resumo": e.resumo, "criado_em": e.criado_em, "alteracoes": e.alteracoes} for n, e in rows]}


@router.patch("/{notificacao_id}/ler")
def ler(notificacao_id: int, db: Session = Depends(get_db), user=Depends(admin_ativo)):
    n = db.query(Notificacao).filter_by(id=notificacao_id, usuario_id=user.id).first()
    if not n:
        raise HTTPException(404, "Notificação não encontrada.")
    if n.lida_em is None:
        n.lida_em = agora()
        db.commit()
    return {"ok": True}


@router.get("/apontamentos/{registro_id}/historico")
def historico(registro_id: int, db: Session = Depends(get_db), user=Depends(admin_ativo)):
    return db.query(EdicaoApontamento).filter_by(registro_id=registro_id).order_by(EdicaoApontamento.id.desc()).all()
