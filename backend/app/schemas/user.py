from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    perfil: int

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    perfil_id: int  # <-- adicionado

class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    perfil_id: Optional[int] = None


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    perfil_id: Optional[int]

    # class Config:
    #     orm_mode = True
    class Config:
        from_attributes = True

class UserTokenData(BaseModel):
    email: Optional[str] = None
    perfil: Optional[str] = None

class LoginSchema(BaseModel):
    email: EmailStr
    password: str