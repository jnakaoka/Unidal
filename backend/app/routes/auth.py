from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError
from app.services.auth import autenticar_usuario, criar_tokens
from app.dependencies.auth import get_db, get_current_user, require_role
from app.models import User
from app.schemas.token import Token
from app.utils.jwt import decode_access_token, create_access_token

router = APIRouter()

@router.post("/login", response_model=Token)
def login(
    username: str = Form(...),
    password: str = Form(...),
    # db: Session = Depends(get_db)
):
    # usuario = autenticar_usuario(db, username, password)
    usuario = autenticar_usuario(username, password)
    if not usuario:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    tokens = criar_tokens(usuario, usuario.perfil)
    return tokens

@router.post("/logout")
def logout():
    # Em sistemas baseados em JWT, o logout é geralmente tratado no frontend
    # ou implementado com blacklist de tokens no backend.
    return {"message": "Logout efetuado com sucesso"}

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str = Form(...)):
    try:
        payload = decode_access_token(refresh_token)
        email = payload.get("sub")
        perfil = payload.get("perfil")
        if email is None or perfil is None:
            raise HTTPException(status_code=401, detail="Token inválido")

        new_token = create_access_token({"sub": email, "perfil": perfil})
        return {
            "access_token": new_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "perfil": current_user.perfil
    }

@router.get("/admin-area")
def admin_route(current_user: User = Depends(require_role("admin"))):
    return {"msg": f"Acesso autorizado para {current_user.perfil}"}
