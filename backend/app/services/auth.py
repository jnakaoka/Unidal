from sqlalchemy.orm import Session, joinedload
from app.models.user import User
from app.utils.security import verify_password, create_access_token
from fastapi import HTTPException, status
from datetime import timedelta

from app.database import SessionLocal
from app.schemas.token import Token
from app.utils.tokens import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    access_token = create_access_token(data={"sub": str(user.id), "role": user.perfil_id})
    return {"access_token": access_token, "token_type": "bearer"}

def autenticar_usuario(email: str, senha: str):
    db = SessionLocal()
    usuario = (
        db.query(User)
        .options(joinedload(User.perfil))  # <- carrega o relacionamento imediatamente
        .filter(User.email == email)
        .first()
    )
    if not usuario or not verify_password(senha, usuario.hashed_password):
        return None
    return usuario

    # db = SessionLocal()
    # usuario = db.query(User).filter(User.email == email).first()
    # db.close()

    # if not usuario or not verify_password(senha, usuario.hashed_password):
    #     return None
    # return usuario

def criar_tokens(usuario: User, perfil: str):
    access_token = create_access_token(data={
        "sub": usuario.email,   # não passe o objeto inteiro!
        "perfil": perfil,
        "name": usuario.name,
        "id": usuario.id
    })
    refresh_token = create_refresh_token(data={
        "sub": usuario.email,
        "name": usuario.name,
        "perfil": perfil,
        "id": usuario.id
    })
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

def login(db: Session, email: str, password: str):
    user = db.query(User).options(joinedload(User.perfil)).filter(User.email == email).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )

    access_token = create_access_token(data={
        "sub": user.email,
        "name": user.name,
        "perfil": user.perfil.nome   # Aqui agora vai funcionar!
    })

    refresh_token = create_refresh_token(data={
        "sub": user.email,
        "name": user.name,
        "perfil": user.perfil
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

# def login(db: Session, email: str, password: str):
#     user = authenticate_user(email, password)
#     token = create_access_token({"sub": str(user.id)})
#     return {"access_token": token, "token_type": "bearer"}

def criar_token_acesso(user: User):
    token_data = {
        "sub": user.email,
        "perfil": user.perfil.nome  # Adiciona o nome do perfil no token
    }
    return create_access_token(data=token_data)
