from pydantic import BaseModel

class PerfilBase(BaseModel):
    nome: str
    is_active: bool = True

class PerfilCreate(PerfilBase):
    pass

class Perfil(PerfilBase):
    id: int

    class Config:
        orm_mode = True
