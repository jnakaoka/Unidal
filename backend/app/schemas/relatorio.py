from pydantic import BaseModel
from datetime import date
from typing import List

class RegistroHoraOut(BaseModel):
    id: int
    projeto_id: int
    usuario_id: int
    data: date
    horas: float
    descricao: str

    class Config:
        orm_mode = True


class DoubleJourneyOut(BaseModel):
    data: date
    obras: List[str]


class DiasTrabalhadosOut(BaseModel):
    funcionario_id: int
    funcionario_nome: str
    empresa: str
    data_inicio: date
    data_fim: date
    total_dias: int
    datas_trabalhadas: List[date]
    total_double_journeys: int
    double_journeys: List[DoubleJourneyOut]
