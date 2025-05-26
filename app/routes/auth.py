from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.database import get_db
from app.services.user import get_user_by_email
from app.utils.security import verify_password
from app.utils.jwt import create_access_token, create_refresh_token, decode_access_token
from app.schemas.token import Token
from app.utils.deps import get_current_user
from app.models.user import User
from jose import JWTError
from app.dependencies.auth import require_role
from sqlalchemy.orm import selectinload

router = APIRouter()

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # user = get_user_by_email(db, form_data.username)
    # print("usuario:",user)
    # print("senha:",form_data.password)
    # print("email:",form_data.username)
    # print("senha:",user.hashed_password)
    print("form_data:", form_data)
    user = db.query(User)\
        .options(selectinload(User.perfil))\
        .filter(User.email == form_data.username)\
        .first()
    
    #print("perfil do usuário:", user.perfil)
    # print("perfil.nome:", user.perfil.nome)
    # print("tipo:", type(user.perfil.nome))

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciais inválidas")

    token_data = {
        "sub": user.email,
        "perfil": user.perfil.nome  # Aqui agora funciona corretamente
    }
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout():
    return {"message": "Logout efetuado com sucesso"}


@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str):
    try:
        payload = decode_access_token(refresh_token)
        email = payload.get("sub")
        perfil = payload.get("perfil")
        if email is None or perfil is None:
            raise HTTPException(status_code=401, detail="Token inválido")

        new_token = create_access_token({"sub": email, "perfil": perfil})
        return {"access_token": new_token, "refresh_token": refresh_token, "token_type": "bearer"}
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
def admin_route(current_user = Depends(require_role("admin"))):
    return {"msg": f"Acesso autorizado para {current_user.perfil}"}