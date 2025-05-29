# app/services/projeto.py
from sqlalchemy.orm import Session
from app.models.projeto import Projeto
from app.schemas.projeto import ProjetoCreate

def get_all(db: Session):
    return db.query(Projeto).all()

def get_by_id(db: Session, projeto_id: int):
    return db.query(Projeto).filter(Projeto.id == projeto_id).first()

def create(db: Session, projeto_data: ProjetoCreate):
    novo_projeto = Projeto(**projeto_data.dict())
    db.add(novo_projeto)
    db.commit()
    db.refresh(novo_projeto)
    return novo_projeto

def delete(db: Session, projeto_id: int):
    projeto = get_by_id(db, projeto_id)
    if projeto:
        db.delete(projeto)
        db.commit()
    return projeto
