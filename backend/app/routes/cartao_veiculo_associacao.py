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
from app.dependencies.auth import (
    get_current_user,
    require_role,
)
from app.models.user import User
from app.schemas.cartao_veiculo_associacao import (
    CartaoVeiculoAssociacaoCreate,
    CartaoVeiculoAssociacaoOut,
    CartaoVeiculoTransferencia,
)
from app.services import (
    cartao_veiculo_associacao as service,
)


router = APIRouter(
    dependencies=[
        Depends(require_role("admin")),
    ],
)


@router.get(
    "/",
    response_model=list[CartaoVeiculoAssociacaoOut],
)
def listar(
    cartao_id: Optional[int] = Query(
        default=None,
        gt=0,
    ),
    veiculo_id: Optional[int] = Query(
        default=None,
        gt=0,
    ),
    ativa: Optional[bool] = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
):
    return service.get_all(
        db,
        cartao_id=cartao_id,
        veiculo_id=veiculo_id,
        ativa=ativa,
    )


@router.post(
    "/",
    response_model=CartaoVeiculoAssociacaoOut,
    status_code=status.HTTP_201_CREATED,
)
def criar(
    payload: CartaoVeiculoAssociacaoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.associar(
        db,
        payload,
        current_user.id,
    )


@router.get(
    "/cartoes/{cartao_id}/ativa",
    response_model=CartaoVeiculoAssociacaoOut,
)
def obter_ativa(
    cartao_id: int,
    db: Session = Depends(get_db),
):
    associacao = service.get_ativa_por_cartao(
        db,
        cartao_id,
    )

    if not associacao:
        raise HTTPException(
            status_code=404,
            detail=(
                "O cartão não possui uma "
                "associação ativa."
            ),
        )

    return associacao


@router.get(
    "/cartoes/{cartao_id}/historico",
    response_model=list[CartaoVeiculoAssociacaoOut],
)
def obter_historico(
    cartao_id: int,
    db: Session = Depends(get_db),
):
    return service.get_all(
        db,
        cartao_id=cartao_id,
    )


@router.post(
    "/cartoes/{cartao_id}/transferir",
    response_model=CartaoVeiculoAssociacaoOut,
    status_code=status.HTTP_201_CREATED,
)
def transferir(
    cartao_id: int,
    payload: CartaoVeiculoTransferencia,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.transferir(
        db,
        cartao_id,
        payload,
        current_user.id,
    )


@router.post(
    "/cartoes/{cartao_id}/desassociar",
    response_model=CartaoVeiculoAssociacaoOut,
)
def desassociar(
    cartao_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.desassociar(
        db,
        cartao_id,
        current_user.id,
    )


@router.get(
    "/{associacao_id}",
    response_model=CartaoVeiculoAssociacaoOut,
)
def obter(
    associacao_id: int,
    db: Session = Depends(get_db),
):
    associacao = service.get_by_id(
        db,
        associacao_id,
    )

    if not associacao:
        raise HTTPException(
            status_code=404,
            detail="Associação não encontrada.",
        )

    return associacao