from sqlalchemy.orm import Session
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
    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

def autenticar_usuario(email: str, senha: str):
    db = SessionLocal()
    usuario = db.query(User).filter(User.email == email).first()
    db.close()

    if not usuario or not verify_password(senha, usuario.senha):
        return None
    return usuario

def criar_tokens(email: str, perfil: str) -> Token:
    access_token = create_access_token(data={"sub": email, "perfil": perfil})
    refresh_token = create_refresh_token(data={"sub": email, "perfil": perfil})
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

def login(db: Session, email: str, password: str):
    user = authenticate_user(db, email, password)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

def criar_token_acesso(user: User):
    token_data = {
        "sub": user.email,
        "perfil": user.perfil.nome  # Adiciona o nome do perfil no token
    }
    return create_access_token(data=token_data)
