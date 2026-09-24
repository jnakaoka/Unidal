from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.matricula import validar_matricula


TipoVeiculo = Literal[
    "carrinha",
    "camiao",
    "automovel",
    "outro",
]


class VeiculoBase(BaseModel):
    matricula: str = Field(min_length=1, max_length=20)
    tipo: TipoVeiculo = "carrinha"
    descricao: Optional[str] = Field(default=None, max_length=255)
    seguradora: Optional[str] = Field(default=None, max_length=120)
    numero_apolice: Optional[str] = Field(default=None, max_length=100)
    seguro_inicio: Optional[date] = None
    seguro_vencimento: Optional[date] = None

    @field_validator("matricula")
    @classmethod
    def validar_campo_matricula(cls, valor: str) -> str:
        return validar_matricula(valor)

    @field_validator("tipo", mode="before")
    @classmethod
    def normalizar_tipo(cls, valor: str) -> str:
        if not isinstance(valor, str):
            return valor

        return valor.strip().lower()

    @field_validator("descricao")
    @classmethod
    def limpar_descricao(
        cls,
        valor: Optional[str],
    ) -> Optional[str]:
        if valor is None:
            return None

        valor_limpo = " ".join(valor.split())
        return valor_limpo or None


class VeiculoCreate(VeiculoBase):
    pass


class VeiculoUpdate(BaseModel):
    matricula: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=20,
    )
    tipo: Optional[TipoVeiculo] = None
    descricao: Optional[str] = Field(default=None, max_length=255)
    seguradora: Optional[str] = Field(default=None, max_length=120)
    numero_apolice: Optional[str] = Field(default=None, max_length=100)
    seguro_inicio: Optional[date] = None
    seguro_vencimento: Optional[date] = None
    ativo: Optional[bool] = None

    @field_validator("matricula")
    @classmethod
    def validar_campo_matricula(
        cls,
        valor: Optional[str],
    ) -> str:
        if valor is None:
            raise ValueError("A matrícula não pode ser nula")

        return validar_matricula(valor)

    @field_validator("tipo", mode="before")
    @classmethod
    def normalizar_tipo(
        cls,
        valor: Optional[str],
    ) -> str:
        if valor is None:
            raise ValueError("O tipo do veículo não pode ser nulo")

        if not isinstance(valor, str):
            return valor

        return valor.strip().lower()

    @field_validator("descricao")
    @classmethod
    def limpar_descricao(
        cls,
        valor: Optional[str],
    ) -> Optional[str]:
        if valor is None:
            return None

        valor_limpo = " ".join(valor.split())
        return valor_limpo or None


class VeiculoOut(BaseModel):
    id: int
    matricula: str
    tipo: str
    descricao: Optional[str]
    seguradora: Optional[str]
    numero_apolice: Optional[str]
    seguro_inicio: Optional[date]
    seguro_vencimento: Optional[date]
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)