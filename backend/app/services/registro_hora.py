# app/services/registro_hora.py
from sqlalchemy.orm import Session
from app.models.registro_hora import RegistroHora
from app.schemas.registro_hora import RegistroHoraCreate

def get_all(db: Session):
    return db.query(RegistroHora).all()

def get_by_id(db: Session, registro_id: int):
    return db.query(RegistroHora).filter(RegistroHora.id == registro_id).first()

def create(db: Session, registro_data: RegistroHoraCreate):
    novo_registro = RegistroHora(**registro_data.dict())
    db.add(novo_registro)
    db.commit()
    db.refresh(novo_registro)
    return novo_registro

def delete(db: Session, registro_id: int):
    registro = get_by_id(db, registro_id)
    if registro:
        db.delete(registro)
        db.commit()
    return registro

def update(db: Session, registro_id: int, registro_data: RegistroHoraCreate):
    db_registro = get_by_id(db, registro_id)
    if db_registro:
        for key, value in registro_data.dict().items():
            setattr(db_registro, key, value)
        db.commit()
        db.refresh(db_registro)
    return db_registro
