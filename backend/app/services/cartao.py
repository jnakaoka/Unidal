from typing import Optional

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.cartao import Cartao
from app.schemas.cartao import CartaoCreate, CartaoUpdate
from app.utils.cartao import normalizar_identificador


def get_all(
    db: Session,
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
) -> list[Cartao]:
    query = db.query(Cartao)

    if tipo is not None:
        query = query.filter(Cartao.tipo == tipo)

    if estado is not None:
        query = query.filter(Cartao.estado == estado)

    return query.order_by(Cartao.nome.asc()).all()


def get_by_id(
    db: Session,
    cartao_id: int,
) -> Cartao | None:
    return db.get(Cartao, cartao_id)


def _validar_validade(
    mes: Optional[int],
    ano: Optional[int],
) -> None:
    if (mes is None) != (ano is None):
        raise HTTPException(
            status_code=422,
            detail=(
                "Mês e ano de validade devem ser "
                "informados em conjunto."
            ),
        )


def create(
    db: Session,
    data: CartaoCreate,
) -> Cartao:
    identificador_normalizado = normalizar_identificador(
        data.identificador
    )

    existente = (
        db.query(Cartao)
        .filter(
            Cartao.identificador_normalizado
            == identificador_normalizado
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=409,
            detail=(
                "Já existe um cartão com este identificador "
                f"(cartão ID {existente.id})."
            ),
        )

    cartao = Cartao(
        nome=data.nome,
        identificador=data.identificador,
        identificador_normalizado=identificador_normalizado,
        tipo=data.tipo,
        emissor=data.emissor,
        ultimos_quatro=data.ultimos_quatro,
        validade_mes=data.validade_mes,
        validade_ano=data.validade_ano,
        estado=data.estado,
        observacoes=data.observacoes,
    )

    db.add(cartao)

    try:
        db.commit()
        db.refresh(cartao)
        return cartao

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Já existe um cartão com este identificador "
                "ou algum dado informado é inválido."
            ),
        )


def update(
    db: Session,
    cartao_id: int,
    data: CartaoUpdate,
) -> Cartao:
    cartao = get_by_id(db, cartao_id)

    if not cartao:
        raise HTTPException(
            status_code=404,
            detail="Cartão não encontrado.",
        )

    payload = data.model_dump(exclude_unset=True)

    mes_final = payload.get(
        "validade_mes",
        cartao.validade_mes,
    )
    ano_final = payload.get(
        "validade_ano",
        cartao.validade_ano,
    )

    _validar_validade(
        mes_final,
        ano_final,
    )

    if "identificador" in payload:
        identificador = payload.pop("identificador")
        cartao.identificador = identificador
        cartao.identificador_normalizado = (
            normalizar_identificador(identificador)
        )

    for campo, valor in payload.items():
        setattr(cartao, campo, valor)

    try:
        db.commit()
        db.refresh(cartao)
        return cartao

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Já existe um cartão com este identificador "
                "ou algum dado informado é inválido."
            ),
        )