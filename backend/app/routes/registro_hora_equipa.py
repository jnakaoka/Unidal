from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from typing import List

from app.database import get_db
from app.models.registro_hora_equipa import registro_hora_equipa
from app.models.user import User
from app.models.registro_hora import RegistroHora
from app.schemas.registro_hora_equipa import RegistroHoraEquipaCreate, RegistroHoraEquipaOut

router = APIRouter(prefix="/registros-hora-equipa", tags=["Registros de Horas da Equipa"])

@router.get("/", response_model=List[RegistroHoraEquipaOut])
def listar_associacoes(db: Session = Depends(get_db)):
    result = db.execute(select(registro_hora_equipa))
    return [dict(r._mapping) for r in result.fetchall()]

@router.get("/registro/{registro_id}", response_model=List[RegistroHoraEquipaOut])
def listar_equipa_do_registro(registro_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        select(registro_hora_equipa).where(registro_hora_equipa.c.registro_hora_id == registro_id)
    )
    return [dict(r._mapping) for r in result.fetchall()]

@router.post("/", response_model=RegistroHoraEquipaOut)
def adicionar_usuario_a_registro(associacao: RegistroHoraEquipaCreate, db: Session = Depends(get_db)):
    # Verifica se o registro existe
    if not db.query(RegistroHora).filter_by(id=associacao.registro_id).first():
        raise HTTPException(status_code=404, detail="Registro de hora não encontrado")

    # Verifica se o usuário existe
    if not db.query(User).filter_by(id=associacao.user_id).first():
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Verifica se já existe
    existing = db.execute(
        select(registro_hora_equipa).where(
            and_(
                registro_hora_equipa.c.user_id == associacao.user_id,
                registro_hora_equipa.c.registro_hora_id == associacao.registro_id
            )
        )
    ).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="Usuário já está associado a este registro")

    db.execute(
        registro_hora_equipa.insert().values(
            registro_hora_id=associacao.registro_id,
            user_id=associacao.user_id
        )
    )
    db.commit()
    return associacao  # Schema é compatível com os campos

@router.delete("/", response_model=RegistroHoraEquipaOut)
def remover_usuario_do_registro(user_id: int, registro_id: int, db: Session = Depends(get_db)):
    deleted = db.execute(
        registro_hora_equipa.delete().where(
            and_(
                registro_hora_equipa.c.user_id == user_id,
                registro_hora_equipa.c.registro_hora_id == registro_id
            )
        )
    )
    if deleted.rowcount == 0:
        raise HTTPException(status_code=404, detail="Associação não encontrada")
    db.commit()
    return {"user_id": user_id, "registro_id": registro_id}
