#services/user.py
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app import models
from app.models.funcao import Funcao
from app.models.perfil import Perfil
from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.passwords import check_strength
from app.utils.security import hash_password


def get_users(db: Session, is_active: Optional[bool] = None):
    q = db.query(User).options(joinedload(User.perfil), joinedload(User.funcoes))
    if is_active is not None:
        q = q.filter(User.is_active.is_(is_active))
    return q.all()


def get_funcoes(db: Session, somente_ativas: bool = True):
    q = db.query(Funcao)
    if somente_ativas:
        q = q.filter(Funcao.is_active.is_(True))
    return q.order_by(Funcao.nome).all()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id: int):
    return (
        db.query(User)
        .options(joinedload(User.perfil), joinedload(User.funcoes))
        .filter(User.id == user_id)
        .first()
    )


def _perfil_e_motorista(db: Session, perfil_id: int) -> bool:
    perfil = db.query(Perfil).filter(Perfil.id == perfil_id).first()
    return bool(perfil and (perfil.nome or "").strip().lower() == "motorista")


def _resolver_funcoes(db: Session, codigos: list[str]) -> list[Funcao]:
    codigos_normalizados = sorted({(codigo or "").strip().upper() for codigo in codigos if codigo})
    if not codigos_normalizados:
        return []

    funcoes = (
        db.query(Funcao)
        .filter(Funcao.codigo.in_(codigos_normalizados), Funcao.is_active.is_(True))
        .all()
    )
    encontrados = {funcao.codigo for funcao in funcoes}
    invalidos = sorted(set(codigos_normalizados) - encontrados)
    if invalidos:
        raise HTTPException(
            status_code=400,
            detail=f"Funções operacionais inválidas: {', '.join(invalidos)}",
        )
    return funcoes


def _sincronizar_funcoes(
    db: Session,
    db_user: User,
    codigos: list[str],
    perfil_id: int,
    e_condutor: bool,
) -> None:
    codigos_finais = {(codigo or "").strip().upper() for codigo in codigos if codigo}
    if e_condutor or _perfil_e_motorista(db, perfil_id):
        codigos_finais.add("CONDUTOR")

    db_user.funcoes = _resolver_funcoes(db, list(codigos_finais))
    db_user.e_condutor = "CONDUTOR" in codigos_finais


def create_user(db: Session, user: UserCreate):
    db_user = models.User(
        name=user.name,
        email=user.email,
        empresa=user.empresa,
        hashed_password=hash_password(user.password),
        perfil_id=user.perfil_id,
        is_active=True,
        e_condutor=False,
    )
    db.add(db_user)
    try:
        _sincronizar_funcoes(
            db,
            db_user,
            user.funcao_codigos,
            user.perfil_id,
            user.e_condutor,
        )
        db.commit()
        db.refresh(db_user)
        return get_by_id(db, db_user.id)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="E-mail já está em uso.")
    except Exception:
        db.rollback()
        raise


def delete(db: Session, user_id: int):
    db_user = get_by_id(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user


def update(db: Session, user_id: int, user_in) -> Optional[User]:
    db_user = get_by_id(db, user_id)
    if not db_user:
        return None

    data = (
        user_in.model_dump(exclude_unset=True)
        if hasattr(user_in, "model_dump")
        else user_in.dict(exclude_unset=True)
    )

    pwd = data.pop("password", None)
    if pwd:
        ok, reason = check_strength(pwd)
        if not ok:
            raise HTTPException(status_code=400, detail=f"Senha fraca: {reason}")
        db_user.hashed_password = hash_password(pwd)
        db_user.must_change_password = False

    funcao_codigos = data.pop("funcao_codigos", None)
    perfil_final_id = data.get("perfil_id", db_user.perfil_id)
    e_condutor_informado = data.pop("e_condutor", None)

    for key, value in data.items():
        setattr(db_user, key, value)

    if funcao_codigos is not None:
        _sincronizar_funcoes(
            db,
            db_user,
            funcao_codigos,
            perfil_final_id,
            bool(e_condutor_informado),
        )
    elif e_condutor_informado is not None:
        codigos_atuais = [funcao.codigo for funcao in db_user.funcoes if funcao.codigo != "CONDUTOR"]
        _sincronizar_funcoes(
            db,
            db_user,
            codigos_atuais,
            perfil_final_id,
            e_condutor_informado,
        )
    elif _perfil_e_motorista(db, perfil_final_id):
        codigos_atuais = [funcao.codigo for funcao in db_user.funcoes]
        _sincronizar_funcoes(db, db_user, codigos_atuais, perfil_final_id, True)

    try:
        db.commit()
        db.refresh(db_user)
        return get_by_id(db, db_user.id)
    except Exception:
        db.rollback()
        raise
