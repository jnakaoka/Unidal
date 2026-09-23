#schemas/user.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserBase(BaseModel):
    email: EmailStr
    perfil: int


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    perfil_id: int
    empresa: str
    e_condutor: bool = False
    funcao_codigos: list[str] = []


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    perfil_id: Optional[int] = None
    empresa: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    e_condutor: Optional[bool] = None
    funcao_codigos: Optional[list[str]] = None


class PerfilOut(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True


class FuncaoOut(BaseModel):
    id: int
    codigo: str
    nome: str
    is_active: bool

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    empresa: str
    is_active: bool
    perfil_id: Optional[int]
    perfil: Optional[PerfilOut] = None
    e_condutor: bool
    funcoes: list[FuncaoOut] = []

    class Config:
        from_attributes = True


class UserTokenData(BaseModel):
    email: Optional[str] = None
    perfil: Optional[str] = None


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
