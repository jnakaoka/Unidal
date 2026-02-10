#util/security.py

# app/utils/security.py
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

# Ideal: puxar de settings
SECRET_KEY = "secret_unidal"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def _create_token(data: Dict[str, Any], expires_delta: timedelta, token_type: str) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire, "type": token_type})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_access_token(data: Dict[str, Any]) -> str:
    return _create_token(data, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES), "access")

def create_refresh_token(data: Dict[str, Any]) -> str:
    return _create_token(data, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS), "refresh")

def decode_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def decode_access_token(token: str) -> Dict[str, Any]:
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise JWTError("Token inválido (esperado access).")
    return payload

def decode_refresh_token(token: str) -> Dict[str, Any]:
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise JWTError("Token inválido (esperado refresh).")
    return payload





# from passlib.context import CryptContext
# from jose import JWTError, jwt
# from datetime import datetime, timedelta
# from app.config import settings
# from app.schemas.token import TokenData
# from typing import Optional

# SECRET_KEY = "secret_unidal"  # Idealmente use settings.SECRET_KEY
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60

# # Criando o contexto para hashing de senha
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # Função para hashear uma senha
# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)

# # Função para verificar senha (para o login)
# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     print(plain_password, hashed_password)
#     return pwd_context.verify(plain_password, hashed_password)

# def create_access_token(data: dict):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# def decode_access_token(token: str) -> Optional[TokenData]:
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         user_id: int = payload.get("sub")
#         role: str = payload.get("role")
#         if user_id is None or role is None:
#             return None
#         return TokenData(user_id=user_id, role=role)
#     except JWTError:
#         return None