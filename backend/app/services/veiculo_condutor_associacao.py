from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.user import User
from app.models.veiculo import Veiculo
from app.models.veiculo_condutor_associacao import (
    VeiculoCondutorAssociacao,
)
from app.schemas.veiculo_condutor_associacao import (
    VeiculoCondutorAssociacaoCreate,
    VeiculoCondutorTransferencia,
)


def _query_com_relacionamentos(
    db: Session,
):
    return (
        db.query(VeiculoCondutorAssociacao)
        .options(
            joinedload(
                VeiculoCondutorAssociacao.veiculo
            ),
            joinedload(
                VeiculoCondutorAssociacao.condutor
            ),
            joinedload(
                VeiculoCondutorAssociacao.associado_por
            ),
            joinedload(
                VeiculoCondutorAssociacao.desassociado_por
            ),
        )
    )


def get_all(
    db: Session,
    veiculo_id: Optional[int] = None,
    condutor_id: Optional[int] = None,
    ativa: Optional[bool] = None,
) -> list[VeiculoCondutorAssociacao]:
    query = _query_com_relacionamentos(db)

    if veiculo_id is not None:
        query = query.filter(
            VeiculoCondutorAssociacao.veiculo_id
            == veiculo_id
        )

    if condutor_id is not None:
        query = query.filter(
            VeiculoCondutorAssociacao.condutor_id
            == condutor_id
        )

    if ativa is True:
        query = query.filter(
            VeiculoCondutorAssociacao.desassociado_em
            .is_(None)
        )

    if ativa is False:
        query = query.filter(
            VeiculoCondutorAssociacao.desassociado_em
            .is_not(None)
        )

    return (
        query
        .order_by(
            VeiculoCondutorAssociacao.associado_em
            .desc(),
            VeiculoCondutorAssociacao.id.desc(),
        )
        .all()
    )


def get_by_id(
    db: Session,
    associacao_id: int,
) -> VeiculoCondutorAssociacao | None:
    return (
        _query_com_relacionamentos(db)
        .filter(
            VeiculoCondutorAssociacao.id
            == associacao_id
        )
        .first()
    )


def get_ativa_por_veiculo(
    db: Session,
    veiculo_id: int,
) -> VeiculoCondutorAssociacao | None:
    return (
        _query_com_relacionamentos(db)
        .filter(
            VeiculoCondutorAssociacao.veiculo_id
            == veiculo_id,
            VeiculoCondutorAssociacao.desassociado_em
            .is_(None),
        )
        .first()
    )


def get_ativa_por_condutor(
    db: Session,
    condutor_id: int,
) -> VeiculoCondutorAssociacao | None:
    return (
        _query_com_relacionamentos(db)
        .filter(
            VeiculoCondutorAssociacao.condutor_id
            == condutor_id,
            VeiculoCondutorAssociacao.desassociado_em
            .is_(None),
        )
        .first()
    )


def _get_ativa_veiculo_para_alteracao(
    db: Session,
    veiculo_id: int,
) -> VeiculoCondutorAssociacao | None:
    return (
        db.query(VeiculoCondutorAssociacao)
        .filter(
            VeiculoCondutorAssociacao.veiculo_id
            == veiculo_id,
            VeiculoCondutorAssociacao.desassociado_em
            .is_(None),
        )
        .with_for_update()
        .first()
    )


def _get_ativa_condutor_para_alteracao(
    db: Session,
    condutor_id: int,
) -> VeiculoCondutorAssociacao | None:
    return (
        db.query(VeiculoCondutorAssociacao)
        .filter(
            VeiculoCondutorAssociacao.condutor_id
            == condutor_id,
            VeiculoCondutorAssociacao.desassociado_em
            .is_(None),
        )
        .with_for_update()
        .first()
    )


def _validar_veiculo_ativo(
    db: Session,
    veiculo_id: int,
) -> Veiculo:
    veiculo = db.get(
        Veiculo,
        veiculo_id,
    )

    if not veiculo:
        raise HTTPException(
            status_code=404,
            detail="Veículo não encontrado.",
        )

    if not veiculo.ativo:
        raise HTTPException(
            status_code=409,
            detail=(
                "Não é possível associar um condutor "
                "a um veículo inativo."
            ),
        )

    return veiculo


def _validar_condutor_ativo(
    db: Session,
    condutor_id: int,
) -> User:
    condutor = db.get(
        User,
        condutor_id,
    )

    if not condutor:
        raise HTTPException(
            status_code=404,
            detail="Condutor não encontrado.",
        )

    if not condutor.is_active:
        raise HTTPException(
            status_code=409,
            detail=(
                "Não é possível associar um "
                "utilizador inativo."
            ),
        )

    if not condutor.e_condutor:
        raise HTTPException(
            status_code=409,
            detail=(
                "O utilizador selecionado não está "
                "habilitado como condutor."
            ),
        )

    return condutor


def associar(
    db: Session,
    data: VeiculoCondutorAssociacaoCreate,
    usuario_id: int,
) -> VeiculoCondutorAssociacao:
    _validar_veiculo_ativo(
        db,
        data.veiculo_id,
    )

    _validar_condutor_ativo(
        db,
        data.condutor_id,
    )

    veiculo_ocupado = (
        _get_ativa_veiculo_para_alteracao(
            db,
            data.veiculo_id,
        )
    )

    if veiculo_ocupado:
        raise HTTPException(
            status_code=409,
            detail=(
                "Este veículo já possui o condutor "
                f"ID {veiculo_ocupado.condutor_id}."
            ),
        )

    condutor_ocupado = (
        _get_ativa_condutor_para_alteracao(
            db,
            data.condutor_id,
        )
    )

    if condutor_ocupado:
        raise HTTPException(
            status_code=409,
            detail=(
                "Este condutor já está associado ao "
                f"veículo ID {condutor_ocupado.veiculo_id}."
            ),
        )

    associacao = VeiculoCondutorAssociacao(
        veiculo_id=data.veiculo_id,
        condutor_id=data.condutor_id,
        associado_por_id=usuario_id,
        observacoes=data.observacoes,
    )

    db.add(associacao)

    try:
        db.commit()

        return get_by_id(
            db,
            associacao.id,
        )

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Não foi possível criar a associação. "
                "Verifique se a viatura ou o condutor "
                "já possui uma associação ativa."
            ),
        )


def desassociar(
    db: Session,
    veiculo_id: int,
    usuario_id: int,
) -> VeiculoCondutorAssociacao:
    veiculo = db.get(
        Veiculo,
        veiculo_id,
    )

    if not veiculo:
        raise HTTPException(
            status_code=404,
            detail="Veículo não encontrado.",
        )

    associacao = (
        _get_ativa_veiculo_para_alteracao(
            db,
            veiculo_id,
        )
    )

    if not associacao:
        raise HTTPException(
            status_code=409,
            detail=(
                "Este veículo não possui um "
                "condutor associado."
            ),
        )

    associacao.desassociado_em = datetime.now()
    associacao.desassociado_por_id = usuario_id

    try:
        db.commit()

        return get_by_id(
            db,
            associacao.id,
        )

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Não foi possível encerrar "
                "a associação do condutor."
            ),
        )


def transferir(
    db: Session,
    condutor_id: int,
    data: VeiculoCondutorTransferencia,
    usuario_id: int,
) -> VeiculoCondutorAssociacao:
    _validar_condutor_ativo(
        db,
        condutor_id,
    )

    _validar_veiculo_ativo(
        db,
        data.veiculo_destino_id,
    )

    atual = (
        _get_ativa_condutor_para_alteracao(
            db,
            condutor_id,
        )
    )

    if not atual:
        raise HTTPException(
            status_code=409,
            detail=(
                "Este condutor não possui uma "
                "associação ativa para transferir."
            ),
        )

    if atual.veiculo_id == data.veiculo_destino_id:
        raise HTTPException(
            status_code=409,
            detail=(
                "O condutor já está associado "
                "ao veículo de destino."
            ),
        )

    destino_ocupado = (
        _get_ativa_veiculo_para_alteracao(
            db,
            data.veiculo_destino_id,
        )
    )

    if destino_ocupado:
        raise HTTPException(
            status_code=409,
            detail=(
                "O veículo de destino já possui o "
                f"condutor ID {destino_ocupado.condutor_id}."
            ),
        )

    atual.desassociado_em = datetime.now()
    atual.desassociado_por_id = usuario_id

    nova = VeiculoCondutorAssociacao(
        veiculo_id=data.veiculo_destino_id,
        condutor_id=condutor_id,
        associado_por_id=usuario_id,
        observacoes=data.observacoes,
    )

    try:
        # Libera as duas chaves calculadas do período anterior.
        db.flush()

        db.add(nova)
        db.commit()

        return get_by_id(
            db,
            nova.id,
        )

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Não foi possível transferir o condutor. "
                "A associação anterior foi preservada."
            ),
        )