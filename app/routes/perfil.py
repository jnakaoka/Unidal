from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.perfil import Perfil, PerfilCreate
from app.services import perfil
from app.services.perfil import create

router = APIRouter(prefix="/perfis", tags=["Perfis"])

@router.get("/", response_model=List[Perfil])
def listar_perfis(db: Session = Depends(get_db)):
    return perfil.get_all(db)

@router.get("/{id}", response_model=Perfil)
def obter_perfil(perfil_id: int, db: Session = Depends(get_db)):
    returned_perfil = perfil.get_by_id(db, perfil_id)
    if not returned_perfil:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return returned_perfil

@router.post("/", response_model=Perfil)
def criar_perfil(perfil: PerfilCreate, db: Session = Depends(get_db)):
    return create(db, perfil)

@router.delete("/{id}", response_model=Perfil)
def deletar_perfil(perfil_id: int, db: Session = Depends(get_db)):
    returned_perfil = perfil.delete(db, perfil_id)
    if not returned_perfil:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return returned_perfil
