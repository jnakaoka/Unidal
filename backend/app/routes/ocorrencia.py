from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.ocorrencia import Ocorrencia
from app.models.user import User
from app.schemas.ocorrencia import OcorrenciaCreate, OcorrenciaOut, OcorrenciaUpdate

router = APIRouter()


def _perfil(user: User) -> str:
    return (user.perfil.nome or "").strip().lower() if user.perfil else ""


def _is_admin(user: User) -> bool:
    return _perfil(user) in {"admin", "administrador"}


def _pode_usar_ocorrencias(user: User) -> bool:
    return _is_admin(user) or _perfil(user) == "operador"


def _carregar_usuarios_ativos(db: Session, ids: set[int]) -> dict[int, User]:
    if not ids:
        return {}
    usuarios = db.query(User).filter(User.id.in_(ids), User.is_active.is_(True)).all()
    encontrados = {u.id: u for u in usuarios}
    faltantes = ids - set(encontrados)
    if faltantes:
        raise HTTPException(status_code=400, detail="Há utilizadores inválidos ou inativos na ocorrência.")
    return encontrados


def _query(db: Session):
    return db.query(Ocorrencia).options(
        joinedload(Ocorrencia.chefe_equipe),
        joinedload(Ocorrencia.funcionario),
        joinedload(Ocorrencia.criado_por),
        joinedload(Ocorrencia.testemunhas),
    )


def _obter_visivel(db: Session, ocorrencia_id: int, current_user: User) -> Ocorrencia:
    query = _query(db).filter(Ocorrencia.id == ocorrencia_id)
    if not _is_admin(current_user):
        query = query.filter(Ocorrencia.criado_por_id == current_user.id)
    ocorrencia = query.first()
    if not ocorrencia:
        raise HTTPException(status_code=404, detail="Ocorrência não encontrada.")
    return ocorrencia


@router.get("/", response_model=List[OcorrenciaOut])
def listar_ocorrencias(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _pode_usar_ocorrencias(current_user):
        raise HTTPException(status_code=403, detail="Permissão negada")
    query = _query(db)
    if not _is_admin(current_user):
        query = query.filter(Ocorrencia.criado_por_id == current_user.id)
    return query.order_by(Ocorrencia.data.desc(), Ocorrencia.id.desc()).all()


@router.get("/{ocorrencia_id}", response_model=OcorrenciaOut)
def obter_ocorrencia(ocorrencia_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _pode_usar_ocorrencias(current_user):
        raise HTTPException(status_code=403, detail="Permissão negada")
    return _obter_visivel(db, ocorrencia_id, current_user)


@router.post("/", response_model=OcorrenciaOut, status_code=status.HTTP_201_CREATED)
def criar_ocorrencia(payload: OcorrenciaCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _pode_usar_ocorrencias(current_user):
        raise HTTPException(status_code=403, detail="Permissão negada")

    if not _is_admin(current_user) and payload.chefe_equipe_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="O operador só pode registar ocorrências como chefe da própria equipa.",
        )

    ids = {payload.chefe_equipe_id, payload.funcionario_id, *payload.testemunha_ids}
    usuarios = _carregar_usuarios_ativos(db, ids)

    ocorrencia = Ocorrencia(
        data=payload.data,
        chefe_equipe_id=payload.chefe_equipe_id,
        funcionario_id=payload.funcionario_id,
        descricao=payload.descricao.strip(),
        criado_por_id=current_user.id,
        testemunhas=[usuarios[i] for i in payload.testemunha_ids],
    )
    db.add(ocorrencia)
    db.commit()
    return _query(db).filter(Ocorrencia.id == ocorrencia.id).first()


@router.put("/{ocorrencia_id}", response_model=OcorrenciaOut)
def atualizar_ocorrencia(ocorrencia_id: int, payload: OcorrenciaUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Apenas administradores podem editar ocorrências.")

    ocorrencia = _obter_visivel(db, ocorrencia_id, current_user)
    ids = {payload.chefe_equipe_id, payload.funcionario_id, *payload.testemunha_ids}
    usuarios = _carregar_usuarios_ativos(db, ids)

    ocorrencia.data = payload.data
    ocorrencia.chefe_equipe_id = payload.chefe_equipe_id
    ocorrencia.funcionario_id = payload.funcionario_id
    ocorrencia.descricao = payload.descricao.strip()
    ocorrencia.testemunhas = [usuarios[i] for i in payload.testemunha_ids]
    db.commit()
    return _query(db).filter(Ocorrencia.id == ocorrencia.id).first()


@router.delete("/{ocorrencia_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_ocorrencia(ocorrencia_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Apenas administradores podem eliminar ocorrências.")
    ocorrencia = _obter_visivel(db, ocorrencia_id, current_user)
    db.delete(ocorrencia)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
