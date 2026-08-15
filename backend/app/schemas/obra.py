# schemas/obra.py
from pydantic import BaseModel
from typing import Optional

class ClienteMini(BaseModel):
    id: int
    nome: str
    class Config:
        from_attributes = True

class ObraBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    cliente_id: int

class ObraCreate(ObraBase):
    pass

class ObraUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    cliente_id: Optional[int] = None

class ObraOut(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    cliente_id: int
    cliente: Optional[ClienteMini] = None

    class Config:
        from_attributes = True

class ObraMerge(BaseModel):
    obra_destino_id: int
    obras_origem_ids: list[int]
