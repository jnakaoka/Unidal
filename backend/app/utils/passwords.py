#utils/passwords
import secrets
import string
from fastapi import HTTPException

def generate_temp_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def check_strength(pwd: str):
    if len(pwd) < 8 or pwd.isalpha() or pwd.isdigit():
        raise HTTPException(status_code=400, detail="Senha fraca: 8+ caracteres com letras e números.")