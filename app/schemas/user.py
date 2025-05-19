from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_active: bool
    is_admin: bool

    # class Config:
    #     orm_mode = True
    class Config:
        from_attributes = True

class UserTokenData(BaseModel):
    email: Optional[str] = None
    perfil: Optional[str] = None