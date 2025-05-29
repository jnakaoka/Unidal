# app/routes/registro_hora.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.registro_hora import RegistroHoraOut, RegistroHoraCreate
from app.services import registro_hora

router = APIRouter(prefix="/registros-horas", tags=["Registros de Horas"])

@router.get("/", response_model=List[RegistroHoraOut])
def listar_registros(db: Session = Depends(get_db)):
    return registro_hora.get_all(db)

@router.get("/{registro_id}", response_model=RegistroHoraOut)
def obter_registro(registro_id: int, db: Session = Depends(get_db)):
    result = registro_hora.get_by_id(db, registro_id)
    if not result:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return result

@router.post("/", response_model=RegistroHoraOut)
def criar_registro(registro_data: RegistroHoraCreate, db: Session = Depends(get_db)):
    return registro_hora.create(db, registro_data)

@router.delete("/{registro_id}", response_model=RegistroHoraOut)
def deletar_registro(registro_id: int, db: Session = Depends(get_db)):
    result = registro_hora.delete(db, registro_id)
    if not result:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return result
