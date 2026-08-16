from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_role
from app.schemas.cartao import (
    CartaoCreate,
    CartaoOut,
    CartaoUpdate,
    EstadoCartao,
    TipoCartao,
)
from app.services import cartao as service


router = APIRouter(
    dependencies=[
        Depends(require_role("admin")),
    ],
)


@router.get(
    "/",
    response_model=list[CartaoOut],
)
def listar(
    tipo: Optional[TipoCartao] = Query(default=None),
    estado: Optional[EstadoCartao] = Query(default=None),
    db: Session = Depends(get_db),
):
    return service.get_all(
        db,
        tipo=tipo,
        estado=estado,
    )


@router.get(
    "/{cartao_id}",
    response_model=CartaoOut,
)
def obter(
    cartao_id: int,
    db: Session = Depends(get_db),
):
    cartao = service.get_by_id(
        db,
        cartao_id,
    )

    if not cartao:
        raise HTTPException(
            status_code=404,
            detail="Cartão não encontrado.",
        )

    return cartao


@router.post(
    "/",
    response_model=CartaoOut,
    status_code=status.HTTP_201_CREATED,
)
def criar(
    payload: CartaoCreate,
    db: Session = Depends(get_db),
):
    return service.create(
        db,
        payload,
    )


@router.put(
    "/{cartao_id}",
    response_model=CartaoOut,
)
def atualizar(
    cartao_id: int,
    payload: CartaoUpdate,
    db: Session = Depends(get_db),
):
    return service.update(
        db,
        cartao_id,
        payload,
    )
