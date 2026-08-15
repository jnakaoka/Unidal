# services/obra.py
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.obra import Obra
from app.models.cliente import Cliente
from app.models.registro_hora import RegistroHora
from app.schemas.obra import ObraCreate, ObraUpdate
import re

def get_all(db: Session, cliente_id: int | None = None):
    q = db.query(Obra).options(joinedload(Obra.cliente))
    if cliente_id is not None:
        q = q.filter(Obra.cliente_id == cliente_id)
    return q.order_by(Obra.nome.asc()).all()

def get_by_id(db: Session, obra_id: int) -> Obra | None:
    return db.query(Obra).options(joinedload(Obra.cliente)).filter(Obra.id == obra_id).first()

def create(db: Session, data: ObraCreate) -> Obra:
    # valida cliente
    if not db.query(Cliente).filter(Cliente.id == data.cliente_id).first():
        raise HTTPException(
            status_code=400,
            detail="Cliente inválido"
        )

    nome_normalizado = normalizar_nome(data.nome)

    obras_mesmo_cliente = (
        db.query(Obra)
        .filter(Obra.cliente_id == data.cliente_id)
        .all()
    )

    duplicada = next(
        (
            obra for obra in obras_mesmo_cliente
            if normalizar_nome(obra.nome) == nome_normalizado
        ),
        None,
    )

    if duplicada:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Já existe uma obra com este nome para este cliente "
                f"(obra ID {duplicada.id})."
            )
        )

    obj = Obra(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update(db: Session, obra_id: int, data: ObraUpdate) -> Obra:
    obj = get_by_id(db, obra_id)

    if not obj:
        raise HTTPException(
            status_code=404,
            detail="Obra não encontrada"
        )

    payload = data.model_dump(exclude_unset=True)

    if "cliente_id" in payload:
        cid = payload["cliente_id"]

        if cid is not None and not db.query(Cliente).filter(
            Cliente.id == cid
        ).first():
            raise HTTPException(
                status_code=400,
                detail="Cliente inválido"
            )

    # valores que a obra terá depois do update
    cliente_final_id = payload.get("cliente_id", obj.cliente_id)
    nome_final = payload.get("nome", obj.nome)

    if nome_final is not None and cliente_final_id is not None:
        nome_normalizado = normalizar_nome(nome_final)

        obras_mesmo_cliente = (
            db.query(Obra)
            .filter(
                Obra.cliente_id == cliente_final_id,
                Obra.id != obra_id,
            )
            .all()
        )

        duplicada = next(
            (
                obra for obra in obras_mesmo_cliente
                if normalizar_nome(obra.nome) == nome_normalizado
            ),
            None,
        )

        if duplicada:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Já existe uma obra com este nome para este cliente "
                    f"(obra ID {duplicada.id})."
                )
            )

    for k, v in payload.items():
        setattr(obj, k, v)

    db.commit()
    db.refresh(obj)
    return obj

def delete(db: Session, obra_id: int) -> Obra:
    obj = get_by_id(db, obra_id)

    if not obj:
        raise HTTPException(
            status_code=404,
            detail="Obra não encontrada"
        )

    qtd_registros = (
        db.query(RegistroHora)
        .filter(RegistroHora.obra_id == obra_id)
        .count()
    )

    if qtd_registros > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Esta obra possui {qtd_registros} apontamento(s) "
                "e não pode ser excluída. Mescle-a com outra obra primeiro."
            )
        )

    db.delete(obj)
    db.commit()

    return obj

def normalizar_nome(nome: str) -> str:
    return re.sub(r"\s+", " ", nome.strip().lower())

def merge_obras(
    db: Session,
    obra_destino_id: int,
    obras_origem_ids: list[int],
):
    origem_ids = list(set(obras_origem_ids))
    origem_ids = [
        id for id in origem_ids
        if id != obra_destino_id
    ]

    if not origem_ids:
        raise HTTPException(
            status_code=400,
            detail="Nenhuma obra de origem válida foi informada"
        )

    obra_destino = (
        db.query(Obra)
        .filter(Obra.id == obra_destino_id)
        .first()
    )

    if not obra_destino:
        raise HTTPException(
            status_code=404,
            detail="Obra de destino não encontrada"
        )

    obras_origem = (
        db.query(Obra)
        .filter(Obra.id.in_(origem_ids))
        .all()
    )

    ids_encontrados = {o.id for o in obras_origem}
    ids_faltando = set(origem_ids) - ids_encontrados

    if ids_faltando:
        raise HTTPException(
            status_code=404,
            detail=f"Obras não encontradas: {sorted(ids_faltando)}"
        )

    nome_destino = normalizar_nome(obra_destino.nome)

    for obra in obras_origem:

        if obra.cliente_id != obra_destino.cliente_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"A obra {obra.id} pertence a outro cliente "
                    "e não pode ser mesclada."
                )
            )

        if normalizar_nome(obra.nome) != nome_destino:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"A obra {obra.id} possui nome diferente "
                    "da obra de destino."
                )
            )

    try:
        registros_movidos = (
            db.query(RegistroHora)
            .filter(
                RegistroHora.obra_id.in_(origem_ids)
            )
            .count()
        )

        (
            db.query(RegistroHora)
            .filter(
                RegistroHora.obra_id.in_(origem_ids)
            )
            .update(
                {
                    RegistroHora.obra_id: obra_destino_id,
                    RegistroHora.cliente_id:
                        obra_destino.cliente_id,
                },
                synchronize_session=False,
            )
        )

        (
            db.query(Obra)
            .filter(Obra.id.in_(origem_ids))
            .delete(synchronize_session=False)
        )

        db.commit()

        return {
            "obra_destino_id": obra_destino_id,
            "obras_removidas": sorted(origem_ids),
            "registros_movidos": registros_movidos,
            "cliente_id": obra_destino.cliente_id,
            "nome": obra_destino.nome,
        }

    except Exception:
        db.rollback()
        raise
