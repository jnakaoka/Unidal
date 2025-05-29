# app/routes/projeto.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.projeto import ProjetoOut, ProjetoCreate
from app.services import projeto

router = APIRouter(prefix="/projetos", tags=["Projetos"])

@router.get("/", response_model=List[ProjetoOut])
def listar_projetos(db: Session = Depends(get_db)):
    return projeto.get_all(db)

@router.get("/{projeto_id}", response_model=ProjetoOut)
def obter_projeto(projeto_id: int, db: Session = Depends(get_db)):
    result = projeto.get_by_id(db, projeto_id)
    if not result:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return result

@router.post("/", response_model=ProjetoOut)
def criar_projeto(projeto_data: ProjetoCreate, db: Session = Depends(get_db)):
    return projeto.create(db, projeto_data)

@router.delete("/{projeto_id}", response_model=ProjetoOut)
def deletar_projeto(projeto_id: int, db: Session = Depends(get_db)):
    result = projeto.delete(db, projeto_id)
    if not result:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return result
