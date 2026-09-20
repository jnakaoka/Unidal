from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_role
from app.schemas.maquina import MaquinaCreate, MaquinaOut, MaquinaUpdate
from app.services import maquina as service


router = APIRouter()


@router.get("/", response_model=list[MaquinaOut])
def listar(ativo: Optional[bool] = Query(default=None), db: Session = Depends(get_db), _current_user=Depends(require_role("admin", "operador", "motorista"))):
    return service.get_all(db, ativo)


@router.post("/", response_model=MaquinaOut, status_code=status.HTTP_201_CREATED)
def criar(payload: MaquinaCreate, db: Session = Depends(get_db), _current_user=Depends(require_role("admin"))):
    return service.create(db, payload)


@router.put("/{maquina_id}", response_model=MaquinaOut)
def atualizar(maquina_id: int, payload: MaquinaUpdate, db: Session = Depends(get_db), _current_user=Depends(require_role("admin"))):
    return service.update(db, maquina_id, payload)
