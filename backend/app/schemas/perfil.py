from pydantic import BaseModel
from typing import Optional

class PerfilBase(BaseModel):
    nome: str
    is_active: bool = True

class PerfilCreate(PerfilBase):
    pass

class PerfilUpdate(BaseModel):
    nome: Optional[str] = None
    
class PerfilOut(BaseModel):
    id: int
    nome: str

class Perfil(PerfilBase):
    id: int

    class Config:
        from_attributes = True
