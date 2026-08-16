from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.cartao import Cartao
from app.models.cartao_veiculo_associacao import (
    CartaoVeiculoAssociacao,
)
from app.models.veiculo import Veiculo
from app.schemas.cartao_veiculo_associacao import (
    CartaoVeiculoAssociacaoCreate,
    CartaoVeiculoTransferencia,
)


def _query_com_relacionamentos(
    db: Session,
):
    return (
        db.query(CartaoVeiculoAssociacao)
        .options(
            joinedload(
                CartaoVeiculoAssociacao.cartao
            ),
            joinedload(
                CartaoVeiculoAssociacao.veiculo
            ),
            joinedload(
                CartaoVeiculoAssociacao.associado_por
            ),
            joinedload(
                CartaoVeiculoAssociacao.desassociado_por
            ),
        )
    )


def get_all(
    db: Session,
    cartao_id: Optional[int] = None,
    veiculo_id: Optional[int] = None,
    ativa: Optional[bool] = None,
) -> list[CartaoVeiculoAssociacao]:
    query = _query_com_relacionamentos(db)

    if cartao_id is not None:
        query = query.filter(
            CartaoVeiculoAssociacao.cartao_id
            == cartao_id
        )

    if veiculo_id is not None:
        query = query.filter(
            CartaoVeiculoAssociacao.veiculo_id
            == veiculo_id
        )

    if ativa is True:
        query = query.filter(
            CartaoVeiculoAssociacao.desassociado_em
            .is_(None)
        )

    if ativa is False:
        query = query.filter(
            CartaoVeiculoAssociacao.desassociado_em
            .is_not(None)
        )

    return (
        query
        .order_by(
            CartaoVeiculoAssociacao.associado_em
            .desc(),
            CartaoVeiculoAssociacao.id.desc(),
        )
        .all()
    )


def get_by_id(
    db: Session,
    associacao_id: int,
) -> CartaoVeiculoAssociacao | None:
    return (
        _query_com_relacionamentos(db)
        .filter(
            CartaoVeiculoAssociacao.id
            == associacao_id
        )
        .first()
    )


def get_ativa_por_cartao(
    db: Session,
    cartao_id: int,
) -> CartaoVeiculoAssociacao | None:
    return (
        _query_com_relacionamentos(db)
        .filter(
            CartaoVeiculoAssociacao.cartao_id
            == cartao_id,
            CartaoVeiculoAssociacao.desassociado_em
            .is_(None),
        )
        .first()
    )


def _get_ativa_para_alteracao(
    db: Session,
    cartao_id: int,
) -> CartaoVeiculoAssociacao | None:
    return (
        db.query(CartaoVeiculoAssociacao)
        .filter(
            CartaoVeiculoAssociacao.cartao_id
            == cartao_id,
            CartaoVeiculoAssociacao.desassociado_em
            .is_(None),
        )
        .with_for_update()
        .first()
    )


def _validar_cartao_ativo(
    db: Session,
    cartao_id: int,
) -> Cartao:
    cartao = db.get(
        Cartao,
        cartao_id,
    )

    if not cartao:
        raise HTTPException(
            status_code=404,
            detail="Cartão não encontrado.",
        )

    if cartao.estado != "ativo":
        raise HTTPException(
            status_code=409,
            detail=(
                "Apenas cartões ativos podem ser "
                "associados ou transferidos."
            ),
        )

    return cartao


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
                "Não é possível associar um cartão "
                "a um veículo inativo."
            ),
        )

    return veiculo


def associar(
    db: Session,
    data: CartaoVeiculoAssociacaoCreate,
    usuario_id: int,
) -> CartaoVeiculoAssociacao:
    _validar_cartao_ativo(
        db,
        data.cartao_id,
    )

    _validar_veiculo_ativo(
        db,
        data.veiculo_id,
    )

    existente = _get_ativa_para_alteracao(
        db,
        data.cartao_id,
    )

    if existente:
        raise HTTPException(
            status_code=409,
            detail=(
                "Este cartão já está associado ao "
                f"veículo ID {existente.veiculo_id}."
            ),
        )

    associacao = CartaoVeiculoAssociacao(
        cartao_id=data.cartao_id,
        veiculo_id=data.veiculo_id,
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
                "Verifique se o cartão já está associado."
            ),
        )


def desassociar(
    db: Session,
    cartao_id: int,
    usuario_id: int,
) -> CartaoVeiculoAssociacao:
    cartao = db.get(
        Cartao,
        cartao_id,
    )

    if not cartao:
        raise HTTPException(
            status_code=404,
            detail="Cartão não encontrado.",
        )

    associacao = _get_ativa_para_alteracao(
        db,
        cartao_id,
    )

    if not associacao:
        raise HTTPException(
            status_code=409,
            detail=(
                "Este cartão não possui uma "
                "associação ativa."
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
                "a associação."
            ),
        )


def transferir(
    db: Session,
    cartao_id: int,
    data: CartaoVeiculoTransferencia,
    usuario_id: int,
) -> CartaoVeiculoAssociacao:
    _validar_cartao_ativo(
        db,
        cartao_id,
    )

    _validar_veiculo_ativo(
        db,
        data.veiculo_destino_id,
    )

    atual = _get_ativa_para_alteracao(
        db,
        cartao_id,
    )

    if not atual:
        raise HTTPException(
            status_code=409,
            detail=(
                "Este cartão não possui uma "
                "associação ativa para transferir."
            ),
        )

    if atual.veiculo_id == data.veiculo_destino_id:
        raise HTTPException(
            status_code=409,
            detail=(
                "O cartão já está associado "
                "ao veículo de destino."
            ),
        )

    atual.desassociado_em = datetime.now()
    atual.desassociado_por_id = usuario_id

    nova = CartaoVeiculoAssociacao(
        cartao_id=cartao_id,
        veiculo_id=data.veiculo_destino_id,
        associado_por_id=usuario_id,
        observacoes=data.observacoes,
    )

    try:
        # Libera a chave calculada da associação anterior.
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
                "Não foi possível transferir o cartão. "
                "A associação foi preservada."
            ),
        )