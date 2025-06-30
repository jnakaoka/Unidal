from pydantic import BaseModel
from typing import Optional

class ProjetoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    is_active: bool = True

class ProjetoCreate(ProjetoBase):
    pass

class ProjetoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    is_active: Optional[bool] = None


class ProjetoOut(ProjetoBase):
    id: int

    class Config:
        from_attributes = True