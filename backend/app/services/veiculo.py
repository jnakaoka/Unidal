from typing import Optional

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.veiculo import Veiculo
from app.schemas.veiculo import VeiculoCreate, VeiculoUpdate
from app.utils.matricula import normalizar_matricula


def get_all(
    db: Session,
    ativo: Optional[bool] = None,
) -> list[Veiculo]:
    query = db.query(Veiculo)

    if ativo is not None:
        query = query.filter(Veiculo.ativo.is_(ativo))

    return query.order_by(Veiculo.matricula.asc()).all()


def get_by_id(
    db: Session,
    veiculo_id: int,
) -> Veiculo | None:
    return db.get(Veiculo, veiculo_id)


def create(
    db: Session,
    data: VeiculoCreate,
) -> Veiculo:
    matricula_normalizada = normalizar_matricula(data.matricula)

    existente = (
        db.query(Veiculo)
        .filter(
            Veiculo.matricula_normalizada
            == matricula_normalizada
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=409,
            detail=(
                "Já existe um veículo com esta matrícula "
                f"(veículo ID {existente.id})."
            ),
        )

    veiculo = Veiculo(
        matricula=data.matricula,
        matricula_normalizada=matricula_normalizada,
        tipo=data.tipo,
        descricao=data.descricao,
        ativo=True,
    )

    db.add(veiculo)

    try:
        db.commit()
        db.refresh(veiculo)
        return veiculo

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Já existe um veículo com esta matrícula.",
        )


def update(
    db: Session,
    veiculo_id: int,
    data: VeiculoUpdate,
) -> Veiculo:
    veiculo = get_by_id(db, veiculo_id)

    if not veiculo:
        raise HTTPException(
            status_code=404,
            detail="Veículo não encontrado.",
        )

    payload = data.model_dump(exclude_unset=True)

    if "matricula" in payload:
        matricula = payload.pop("matricula")
        veiculo.matricula = matricula
        veiculo.matricula_normalizada = normalizar_matricula(
            matricula
        )

    for campo, valor in payload.items():
        setattr(veiculo, campo, valor)

    try:
        db.commit()
        db.refresh(veiculo)
        return veiculo

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Já existe um veículo com esta matrícula.",
        )