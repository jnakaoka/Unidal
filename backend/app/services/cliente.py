# services/cliente.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate

def get_clientes(db: Session):
    return db.query(Cliente).order_by(Cliente.nome.asc()).all()

def get_by_id(db: Session, cliente_id: int) -> Cliente | None:
    return db.query(Cliente).filter(Cliente.id == cliente_id).first()

def create_cliente(db: Session, payload: ClienteCreate) -> Cliente:
    obj = Cliente(**payload.model_dump())
    db.add(obj)
    try:
        db.commit()
        db.refresh(obj)
        return obj
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Nome de cliente já em uso.")

def update(db: Session, cliente_id: int, payload: ClienteUpdate) -> Cliente | None:
    obj = get_by_id(db, cliente_id)
    if not obj:
        return None
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete(db: Session, cliente_id: int) -> Cliente | None:
    obj = get_by_id(db, cliente_id)
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj
