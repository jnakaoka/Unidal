from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_role
from app.schemas.veiculo import (
    VeiculoCreate,
    VeiculoOut,
    VeiculoUpdate,
)
from app.services import veiculo as service


router = APIRouter(
    dependencies=[
        Depends(require_role("admin")),
    ],
)


@router.get(
    "/",
    response_model=list[VeiculoOut],
)
def listar(
    ativo: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
):
    return service.get_all(
        db,
        ativo=ativo,
    )


@router.get(
    "/{veiculo_id}",
    response_model=VeiculoOut,
)
def obter(
    veiculo_id: int,
    db: Session = Depends(get_db),
):
    veiculo = service.get_by_id(
        db,
        veiculo_id,
    )

    if not veiculo:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=404,
            detail="Veículo não encontrado.",
        )

    return veiculo


@router.post(
    "/",
    response_model=VeiculoOut,
    status_code=status.HTTP_201_CREATED,
)
def criar(
    payload: VeiculoCreate,
    db: Session = Depends(get_db),
):
    return service.create(
        db,
        payload,
    )


@router.put(
    "/{veiculo_id}",
    response_model=VeiculoOut,
)
def atualizar(
    veiculo_id: int,
    payload: VeiculoUpdate,
    db: Session = Depends(get_db),
):
    return service.update(
        db,
        veiculo_id,
        payload,
    )