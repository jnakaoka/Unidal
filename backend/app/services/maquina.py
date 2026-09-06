from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.maquina import Maquina
from app.schemas.maquina import MaquinaCreate, MaquinaUpdate


def get_all(db: Session, ativo: Optional[bool] = None):
    query = db.query(Maquina)
    if ativo is not None:
        query = query.filter(Maquina.ativo.is_(ativo))
    return query.order_by(Maquina.nome.asc(), Maquina.referencia.asc()).all()


def create(db: Session, data: MaquinaCreate):
    existente = db.query(Maquina).filter(
        func.lower(Maquina.nome) == data.nome.lower(),
        func.lower(func.coalesce(Maquina.referencia, "")) == (data.referencia or "").lower(),
    ).first()
    if existente:
        raise HTTPException(status_code=409, detail="Esta máquina já está cadastrada.")
    maquina = Maquina(nome=data.nome, referencia=data.referencia, ativo=True)
    db.add(maquina)
    db.commit()
    db.refresh(maquina)
    return maquina


def update(db: Session, maquina_id: int, data: MaquinaUpdate):
    maquina = db.get(Maquina, maquina_id)
    if not maquina:
        raise HTTPException(status_code=404, detail="Máquina não encontrada.")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(maquina, campo, valor)
    db.commit()
    db.refresh(maquina)
    return maquina
