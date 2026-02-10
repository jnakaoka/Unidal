# dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.utils.security import decode_access_token
from app.schemas.user import UserTokenData
from app.database import SessionLocal
from sqlalchemy.orm import Session, joinedload
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login/")

# def get_current_user(token: str = Depends(oauth2_scheme)) -> UserTokenData:
#     try:
#         payload = decode_access_token(token)
#         email = payload.get("sub")
#         perfil = payload.get("perfil")
#         if not email or not perfil:
#             raise HTTPException(status_code=401, detail="Token inválido")
#         return UserTokenData(email=email, perfil=perfil)
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Token inválido")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Token inválido")

        user = (
            db.query(User)
            .options(joinedload(User.perfil))
            .filter(User.email == email)
            .first()
        )
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")

        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

def require_role(*allowed_roles: str):
    def role_dependency(current_user: User = Depends(get_current_user)):
        perfil_nome = (current_user.perfil.nome or "").lower()
        if perfil_nome not in [r.lower() for r in allowed_roles]:
            raise HTTPException(status_code=403, detail="Permissão negada")
        return current_user
    return role_dependency

def verificar_permissao(perfis_permitidos: list[str]):
    """
    Compat: mantém rotas antigas funcionando.
    Ex: Depends(verificar_permissao(["admin"]))
    """
    # reusa require_role internamente
    return require_role(*perfis_permitidos)

# def require_role(*allowed_roles: str):
#     def role_dependency(current_user: UserTokenData = Depends(get_current_user)):
#         if current_user.perfil not in allowed_roles:
#             raise HTTPException(status_code=403, detail="Permissão negada")
#         return current_user
#     return role_dependency

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# def get_current_user(token: str = Depends(oauth2_scheme)) -> UserTokenData:
#     try:
#         payload = decode_access_token(token)
#         return UserTokenData(email=payload["sub"], perfil=payload["perfil"])
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Token inválido")

# def verificar_permissao(perfis_permitidos: list[str]):
#     def wrapper(user: UserTokenData = Depends(get_current_user)):
#         if user.perfil not in perfis_permitidos:
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Permissão negada"
#             )
#         return user  # Pode retornar user se quiser usar nas rotas
#     return wrapper

# def require_role(*allowed_roles: list[str]):
#     def role_dependency(current_user: UserTokenData = Depends(get_current_user)):
#         if current_user.perfil not in allowed_roles:
#             raise HTTPException(status_code=403, detail="Permissão negada")
#         return current_user
#     return role_dependency

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()