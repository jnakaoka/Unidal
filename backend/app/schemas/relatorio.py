from pydantic import BaseModel
from datetime import date

class RegistroHoraOut(BaseModel):
    id: int
    projeto_id: int
    usuario_id: int
    data: date
    horas: float
    descricao: str

    class Config:
        orm_mode = True
