# services/obra.py
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException
from app.models.obra import Obra
from app.models.cliente import Cliente
from app.models.registro_hora import RegistroHora
from app.schemas.obra import ObraCreate, ObraUpdate
from app.utils.text import normalizar_texto_busca

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

    nome_normalizado = normalizar_texto_busca(data.nome)

    obras_mesmo_cliente = (
        db.query(Obra)
        .filter(Obra.cliente_id == data.cliente_id)
        .all()
    )

    duplicada = next(
        (
            obra for obra in obras_mesmo_cliente
            if normalizar_texto_busca(obra.nome) == nome_normalizado
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

    identidade_alterada = (
        cliente_final_id != obj.cliente_id
        or (
            nome_final is not None
            and normalizar_texto_busca(nome_final)
            != normalizar_texto_busca(obj.nome)
        )
    )

    if (
        identidade_alterada
        and nome_final is not None
        and cliente_final_id is not None
    ):
        nome_normalizado = normalizar_texto_busca(nome_final)

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
                if normalizar_texto_busca(obra.nome) == nome_normalizado
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
                "e não pode ser excluída."
            )
        )

    db.delete(obj)
    db.commit()

    return obj
