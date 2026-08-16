from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
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


class CartaoVeiculoAssociacaoCreate(BaseModel):
    cartao_id: int = Field(gt=0)
    veiculo_id: int = Field(gt=0)
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


class CartaoVeiculoTransferencia(BaseModel):
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


class CartaoAssociacaoResumo(BaseModel):
    id: int
    nome: str
    identificador: str
    tipo: str
    estado: str

    model_config = ConfigDict(
        from_attributes=True,
    )


class VeiculoAssociacaoResumo(BaseModel):
    id: int
    matricula: str
    tipo: str
    ativo: bool

    model_config = ConfigDict(
        from_attributes=True,
    )


class UsuarioAssociacaoResumo(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(
        from_attributes=True,
    )


class CartaoVeiculoAssociacaoOut(BaseModel):
    id: int
    cartao_id: int
    veiculo_id: int
    associado_em: datetime
    desassociado_em: Optional[datetime]
    associado_por_id: int
    desassociado_por_id: Optional[int]
    observacoes: Optional[str]
    ativa: bool
    criado_em: datetime
    atualizado_em: datetime

    cartao: CartaoAssociacaoResumo
    veiculo: VeiculoAssociacaoResumo
    associado_por: UsuarioAssociacaoResumo
    desassociado_por: Optional[
        UsuarioAssociacaoResumo
    ]

    model_config = ConfigDict(
        from_attributes=True,
    )