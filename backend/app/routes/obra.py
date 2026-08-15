# routes/obra.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.obra import ObraOut, ObraCreate, ObraUpdate, ObraMerge
from app.services import obra as service

router = APIRouter()

@router.get("/", response_model=List[ObraOut])
def listar(db: Session = Depends(get_db), cliente_id: Optional[int] = Query(default=None)):
    return service.get_all(db, cliente_id=cliente_id)

@router.post("/merge")
def mesclar(payload: ObraMerge, db: Session = Depends(get_db)):
    return service.merge_obras(
        db,
        obra_destino_id=payload.obra_destino_id,
        obras_origem_ids=payload.obras_origem_ids,
    )

@router.get("/{id}", response_model=ObraOut)
def obter(id: int, db: Session = Depends(get_db)):
    obj = service.get_by_id(db, id)
    if not obj:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Obra não encontrada")
    return obj

@router.post("/", response_model=ObraOut)
def criar(payload: ObraCreate, db: Session = Depends(get_db)):
    return service.create(db, payload)

@router.put("/{id}", response_model=ObraOut)
def atualizar(id: int, payload: ObraUpdate, db: Session = Depends(get_db)):
    return service.update(db, id, payload)

@router.delete("/{id}", response_model=ObraOut)
def remover(id: int, db: Session = Depends(get_db)):
    return service.delete(db, id)
