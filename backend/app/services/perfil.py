from sqlalchemy.orm import Session
from app.models.perfil import Perfil
from app.schemas.perfil import PerfilCreate

def get_all(db: Session):
    return db.query(Perfil).all()

def get_by_id(db: Session, perfil_id: int):
    return db.query(Perfil).filter(Perfil.id == perfil_id).first()

def create(db: Session, perfil: PerfilCreate):
    db_perfil = Perfil(**perfil.dict())
    db.add(db_perfil)
    db.commit()
    db.refresh(db_perfil)
    return db_perfil

def delete(db: Session, perfil_id: int):
    db_perfil = get_by_id(db, perfil_id)
    if db_perfil:
        db.delete(db_perfil)
        db.commit()
    return db_perfil

def update(db: Session, perfil_id: int, perfil: PerfilCreate):
    db_perfil = get_by_id(db, perfil_id)
    if db_perfil:
        for key, value in perfil.dict().items():
            setattr(db_perfil, key, value)
        db.commit()
        db.refresh(db_perfil)
    return db_perfil