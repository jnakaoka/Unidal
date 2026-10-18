from datetime import date, datetime
from typing import List

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class UsuarioOcorrenciaOut(BaseModel):
    id: int
    name: str
    email: str
    empresa: str
    model_config = ConfigDict(from_attributes=True)


class OcorrenciaBase(BaseModel):
    data: date
    chefe_equipe_id: int
    funcionario_id: int
    descricao: str = Field(min_length=3, max_length=5000)
    testemunha_ids: List[int] = Field(default_factory=list)

    @field_validator("descricao")
    @classmethod
    def descricao_valida(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("A descrição deve ter pelo menos 3 caracteres.")
        return value

    @field_validator("testemunha_ids")
    @classmethod
    def testemunhas_sem_duplicados(cls, value: List[int]) -> List[int]:
        if len(value) != len(set(value)):
            raise ValueError("A mesma testemunha não pode ser selecionada mais de uma vez.")
        return value

    @model_validator(mode="after")
    def funcionario_nao_e_testemunha(self):
        if self.funcionario_id in self.testemunha_ids:
            raise ValueError("O funcionário da ocorrência não pode ser testemunha da mesma ocorrência.")
        return self


class OcorrenciaCreate(OcorrenciaBase):
    pass


class OcorrenciaUpdate(OcorrenciaBase):
    pass


class OcorrenciaOut(BaseModel):
    id: int
    data: date
    chefe_equipe_id: int
    funcionario_id: int
    descricao: str
    criado_por_id: int
    criado_em: datetime
    atualizado_em: datetime | None = None
    chefe_equipe: UsuarioOcorrenciaOut
    funcionario: UsuarioOcorrenciaOut
    criado_por: UsuarioOcorrenciaOut
    testemunhas: List[UsuarioOcorrenciaOut] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)
