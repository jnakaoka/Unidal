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


class OcorrenciaOut(BaseModel):
    data: date
    obras: List[str]


class DoubleJourneyOut(OcorrenciaOut):
    pass


class IntemperieOut(OcorrenciaOut):
    pass


class ObraDiaTrabalhadoOut(BaseModel):
    registro_id: int
    data: date
    obra: str
    chefe_equipa: str


class DiasTrabalhadosOut(BaseModel):
    funcionario_id: int
    funcionario_nome: str
    empresa: str
    data_inicio: date
    data_fim: date
    total_dias: int
    datas_trabalhadas: List[date]
    obras_por_dia: List[ObraDiaTrabalhadoOut]
    total_double_journeys: int
    double_journeys: List[DoubleJourneyOut]
    total_intemperies: int
    intemperies: List[IntemperieOut]
