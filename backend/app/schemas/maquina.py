from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MaquinaBase(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    referencia: Optional[str] = Field(default=None, max_length=120)

    @field_validator("nome", "referencia")
    @classmethod
    def limpar(cls, valor):
        if valor is None:
            return None
        return " ".join(valor.split()) or None


class MaquinaCreate(MaquinaBase):
    pass


class MaquinaUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=1, max_length=120)
    referencia: Optional[str] = Field(default=None, max_length=120)
    ativo: Optional[bool] = None

    @field_validator("nome", "referencia")
    @classmethod
    def limpar(cls, valor):
        if valor is None:
            return None
        return " ".join(valor.split()) or None


class MaquinaOut(MaquinaBase):
    id: int
    ativo: bool
    criado_em: datetime
    atualizado_em: datetime
    model_config = ConfigDict(from_attributes=True)
