# app/schemas/registro_hora.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

class RegistroHoraBase(BaseModel):
    usuario_id: int
    projeto_id: int
    data: date
    horas: float

class RegistroHoraCreate(BaseModel):
    usuario_id: int
    projeto_id: int
    data: date
    horas: float
    
class RegistroHoraUpdate(BaseModel):
    usuario_id: Optional[int] = None
    projeto_id: Optional[int] = None
    data: Optional[date] = None
    horas: Optional[float] = None

class RegistroHoraOut(BaseModel):
    id: int
    projeto_id: int
    usuario_id: int
    data: date
    horas: float
    projeto_nome: Optional[str] = None
    usuario_nome: Optional[str] = None

    class Config:
        from_attributes = True
