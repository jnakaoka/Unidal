from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import RegistroHora, User, Projeto
from app.schemas.relatorio import RegistroHoraOut
from typing import List, Optional
from datetime import date

router = APIRouter()

@router.get("/", response_model=List[RegistroHoraOut])
def relatorio_por_projeto_operador(
    projeto_id: Optional[int] = Query(None),
    operador_id: Optional[int] = Query(None),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RegistroHora)

    if projeto_id:
        query = query.filter(RegistroHora.projeto_id == projeto_id)
    if operador_id:
        query = query.filter(RegistroHora.usuario_id == operador_id)
    if data_inicio:
        query = query.filter(RegistroHora.data >= data_inicio)
    if data_fim:
        query = query.filter(RegistroHora.data <= data_fim)

    return query.all()
