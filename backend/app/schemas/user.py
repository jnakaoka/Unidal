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
     

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    perfil_id: Optional[int] = None
    empresa: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class PerfilOut(BaseModel):
    id: int
    nome: str

    class Config:
        orm_mode = True
        
class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    empresa: str
    is_active: bool
    perfil_id: Optional[int]
    perfil: Optional[PerfilOut] = None

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

# class AdminSetTempPasswordIn(BaseModel):
#     temp_password: str | None = Field(
#         default=None,
#         description="Se None, o backend gera automaticamente."
#     )

# class AdminSetTempPasswordOut(BaseModel):
#     user_id: int
#     temp_password: str

# class ForceChangePasswordIn(BaseModel):
#     new_password: str = Field(min_length=8)

class ChangePasswordIn(BaseModel):     # <-- NOVO: para /auth/change-password
    current_password: str
    new_password: str = Field(min_length=8)