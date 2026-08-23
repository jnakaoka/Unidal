from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Path,
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
from app.schemas.veiculo_condutor_associacao import (
    VeiculoCondutorAssociacaoCreate,
    VeiculoCondutorAssociacaoOut,
    VeiculoCondutorTransferencia,
)
from app.services import (
    veiculo_condutor_associacao as service,
)


router = APIRouter(
    dependencies=[
        Depends(require_role("admin")),
    ],
)


@router.get(
    "/",
    response_model=list[VeiculoCondutorAssociacaoOut],
)
def listar(
    veiculo_id: Optional[int] = Query(
        default=None,
        gt=0,
    ),
    condutor_id: Optional[int] = Query(
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
        veiculo_id=veiculo_id,
        condutor_id=condutor_id,
        ativa=ativa,
    )


@router.post(
    "/",
    response_model=VeiculoCondutorAssociacaoOut,
    status_code=status.HTTP_201_CREATED,
)
def criar(
    payload: VeiculoCondutorAssociacaoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.associar(
        db,
        payload,
        current_user.id,
    )


@router.get(
    "/veiculos/{veiculo_id}/ativa",
    response_model=VeiculoCondutorAssociacaoOut,
)
def obter_ativa_por_veiculo(
    veiculo_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    associacao = service.get_ativa_por_veiculo(
        db,
        veiculo_id,
    )

    if not associacao:
        raise HTTPException(
            status_code=404,
            detail=(
                "O veículo não possui um "
                "condutor associado."
            ),
        )

    return associacao


@router.get(
    "/veiculos/{veiculo_id}/historico",
    response_model=list[VeiculoCondutorAssociacaoOut],
)
def obter_historico_veiculo(
    veiculo_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    return service.get_all(
        db,
        veiculo_id=veiculo_id,
    )


@router.post(
    "/veiculos/{veiculo_id}/desassociar",
    response_model=VeiculoCondutorAssociacaoOut,
)
def desassociar(
    veiculo_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.desassociar(
        db,
        veiculo_id,
        current_user.id,
    )


@router.get(
    "/condutores/{condutor_id}/ativa",
    response_model=VeiculoCondutorAssociacaoOut,
)
def obter_ativa_por_condutor(
    condutor_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    associacao = service.get_ativa_por_condutor(
        db,
        condutor_id,
    )

    if not associacao:
        raise HTTPException(
            status_code=404,
            detail=(
                "O condutor não possui uma "
                "associação ativa."
            ),
        )

    return associacao


@router.get(
    "/condutores/{condutor_id}/historico",
    response_model=list[VeiculoCondutorAssociacaoOut],
)
def obter_historico_condutor(
    condutor_id: int = Path(gt=0),
    db: Session = Depends(get_db),
):
    return service.get_all(
        db,
        condutor_id=condutor_id,
    )


@router.post(
    "/condutores/{condutor_id}/transferir",
    response_model=VeiculoCondutorAssociacaoOut,
    status_code=status.HTTP_201_CREATED,
)
def transferir(
    payload: VeiculoCondutorTransferencia,
    condutor_id: int = Path(gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.transferir(
        db,
        condutor_id,
        payload,
        current_user.id,
    )


@router.get(
    "/{associacao_id}",
    response_model=VeiculoCondutorAssociacaoOut,
)
def obter(
    associacao_id: int = Path(gt=0),
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