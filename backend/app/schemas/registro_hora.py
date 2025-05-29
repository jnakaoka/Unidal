# app/schemas/registro_hora.py
from pydantic import BaseModel
from datetime import date

class RegistroHoraBase(BaseModel):
    usuario_id: int
    projeto_id: int
    data: date
    horas: float

class RegistroHoraCreate(RegistroHoraBase):
    pass

class RegistroHoraOut(RegistroHoraBase):
    id: int

    class Config:
        from_attributes = True
