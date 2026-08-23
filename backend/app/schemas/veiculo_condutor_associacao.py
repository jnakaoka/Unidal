from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


def limpar_observacoes(
    valor: Optional[str],
) -> Optional[str]:
    if valor is None:
        return None

    valor_limpo = valor.strip()

    return valor_limpo or None


class VeiculoCondutorAssociacaoCreate(BaseModel):
    veiculo_id: int = Field(gt=0)
    condutor_id: int = Field(gt=0)
    observacoes: Optional[str] = Field(
        default=None,
        max_length=2000,
    )

    @field_validator("observacoes")
    @classmethod
    def validar_observacoes(
        cls,
        valor: Optional[str],
    ) -> Optional[str]:
        return limpar_observacoes(valor)


class VeiculoCondutorTransferencia(BaseModel):
    veiculo_destino_id: int = Field(gt=0)
    observacoes: Optional[str] = Field(
        default=None,
        max_length=2000,
    )

    @field_validator("observacoes")
    @classmethod
    def validar_observacoes(
        cls,
        valor: Optional[str],
    ) -> Optional[str]:
        return limpar_observacoes(valor)


class VeiculoCondutorVeiculoResumo(BaseModel):
    id: int
    matricula: str
    tipo: str
    ativo: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


class CondutorAssociacaoResumo(BaseModel):
    id: int
    name: str
    email: EmailStr
    empresa: str
    is_active: bool
    e_condutor: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


class UsuarioResponsavelResumo(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(
        from_attributes=True,
    )


class VeiculoCondutorAssociacaoOut(BaseModel):
    id: int
    veiculo_id: int
    condutor_id: int
    associado_em: datetime
    desassociado_em: Optional[datetime]
    associado_por_id: int
    desassociado_por_id: Optional[int]
    observacoes: Optional[str]
    ativa: bool
    criado_em: datetime
    atualizado_em: datetime

    veiculo: VeiculoCondutorVeiculoResumo
    condutor: CondutorAssociacaoResumo
    associado_por: UsuarioResponsavelResumo
    desassociado_por: Optional[
        UsuarioResponsavelResumo
    ]

    model_config = ConfigDict(
        from_attributes=True,
    )