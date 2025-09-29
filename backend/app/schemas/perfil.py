# schemas/perfil.py
from pydantic import BaseModel
from typing import Optional

class PerfilCreate(BaseModel):
    nome: str
    is_active: bool = True

class PerfilUpdate(BaseModel):
    nome: Optional[str] = None
    is_active: Optional[bool] = None

class PerfilOut(BaseModel):
    id: int
    nome: str
    is_active: bool = True

    class Config:
        from_attributes = True

# #schemas/perfil.py
# from pydantic import BaseModel
# from typing import Optional

# class PerfilBase(BaseModel):
#     id: int
#     nome: str
#     is_active: bool = True

# class PerfilCreate(PerfilBase):
#     pass

# class PerfilUpdate(BaseModel):
#     nome: Optional[str] = None
    
# class PerfilOut(BaseModel):
#     id: int
#     nome: str

# class Perfil(PerfilBase):
#     id: int

#     class Config:
#         from_attributes = True
