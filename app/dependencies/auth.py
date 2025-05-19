from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.utils.jwt import decode_access_token
from app.schemas.user import UserTokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> UserTokenData:
    try:
        payload = decode_access_token(token)
        return UserTokenData(email=payload["sub"], perfil=payload["perfil"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

def require_role(*allowed_roles: list[str]):
    def role_dependency(current_user: UserTokenData = Depends(get_current_user)):
        if current_user.perfil not in allowed_roles:
            raise HTTPException(status_code=403, detail="Permissão negada")
        return current_user
    return role_dependency
