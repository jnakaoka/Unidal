# services/obra.py
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.obra import Obra
from app.models.cliente import Cliente
from app.schemas.obra import ObraCreate, ObraUpdate

def get_all(db: Session, cliente_id: int | None = None):
    q = db.query(Obra).options(joinedload(Obra.cliente))
    if cliente_id is not None:
        q = q.filter(Obra.cliente_id == cliente_id)
    return q.order_by(Obra.nome.asc()).all()

def get_by_id(db: Session, obra_id: int) -> Obra | None:
    return db.query(Obra).options(joinedload(Obra.cliente)).filter(Obra.id == obra_id).first()

def create(db: Session, data: ObraCreate) -> Obra:
    # valida cliente
    if not db.query(Cliente).filter(Cliente.id == data.cliente_id).first():
        raise HTTPException(status_code=400, detail="Cliente inválido")

    obj = Obra(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update(db: Session, obra_id: int, data: ObraUpdate) -> Obra:
    obj = get_by_id(db, obra_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Obra não encontrada")

    payload = data.model_dump(exclude_unset=True)
    if "cliente_id" in payload:
        cid = payload["cliente_id"]
        if cid is not None and not db.query(Cliente).filter(Cliente.id == cid).first():
            raise HTTPException(status_code=400, detail="Cliente inválido")

    for k, v in payload.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete(db: Session, obra_id: int) -> Obra:
    obj = get_by_id(db, obra_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Obra não encontrada")
    db.delete(obj)
    db.commit()
    return obj
