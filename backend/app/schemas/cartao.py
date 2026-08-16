from datetime import datetime
from typing import Literal, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.utils.cartao import validar_identificador


TipoCartao = Literal[
    "bancario",
    "combustivel",
    "via_verde",
    "outro",
]

EstadoCartao = Literal[
    "ativo",
    "bloqueado",
    "perdido",
    "cancelado",
    "expirado",
]


def limpar_texto(
    valor: Optional[str],
) -> Optional[str]:
    if valor is None:
        return None

    valor_limpo = " ".join(valor.split())
    return valor_limpo or None


class CartaoBase(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    identificador: str = Field(min_length=1, max_length=50)
    tipo: TipoCartao
    emissor: Optional[str] = Field(default=None, max_length=100)
    ultimos_quatro: Optional[str] = Field(
        default=None,
        max_length=4,
    )
    validade_mes: Optional[int] = Field(
        default=None,
        ge=1,
        le=12,
    )
    validade_ano: Optional[int] = Field(
        default=None,
        ge=2000,
        le=2100,
    )
    estado: EstadoCartao = "ativo"
    observacoes: Optional[str] = None

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, valor: str) -> str:
        valor_limpo = " ".join(valor.split())

        if not valor_limpo:
            raise ValueError(
                "O nome do cartão não pode estar vazio"
            )

        return valor_limpo

    @field_validator("identificador")
    @classmethod
    def validar_codigo(cls, valor: str) -> str:
        return validar_identificador(valor)

    @field_validator("tipo", "estado", mode="before")
    @classmethod
    def normalizar_opcao(cls, valor: str) -> str:
        if not isinstance(valor, str):
            return valor

        return valor.strip().lower()

    @field_validator("emissor")
    @classmethod
    def validar_emissor(
        cls,
        valor: Optional[str],
    ) -> Optional[str]:
        return limpar_texto(valor)

    @field_validator("ultimos_quatro")
    @classmethod
    def validar_ultimos_quatro(
        cls,
        valor: Optional[str],
    ) -> Optional[str]:
        if valor is None:
            return None

        valor_limpo = valor.strip()

        if not valor_limpo:
            return None

        if (
            len(valor_limpo) != 4
            or not valor_limpo.isdigit()
        ):
            raise ValueError(
                "Os últimos quatro dígitos devem conter "
                "exatamente quatro números"
            )

        return valor_limpo

    @field_validator("observacoes")
    @classmethod
    def validar_observacoes(
        cls,
        valor: Optional[str],
    ) -> Optional[str]:
        if valor is None:
            return None

        return valor.strip() or None

    @model_validator(mode="after")
    def validar_validade_completa(self):
        somente_um_preenchido = (
            (self.validade_mes is None)
            != (self.validade_ano is None)
        )

        if somente_um_preenchido:
            raise ValueError(
                "Mês e ano de validade devem ser "
                "informados em conjunto"
            )

        return self


class CartaoCreate(CartaoBase):
    pass


class CartaoUpdate(BaseModel):
    nome: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    identificador: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    tipo: Optional[TipoCartao] = None
    emissor: Optional[str] = Field(default=None, max_length=100)
    ultimos_quatro: Optional[str] = Field(
        default=None,
        max_length=4,
    )
    validade_mes: Optional[int] = Field(
        default=None,
        ge=1,
        le=12,
    )
    validade_ano: Optional[int] = Field(
        default=None,
        ge=2000,
        le=2100,
    )
    estado: Optional[EstadoCartao] = None
    observacoes: Optional[str] = None

    @field_validator("nome")
    @classmethod
    def validar_nome(
        cls,
        valor: Optional[str],
    ) -> str:
        if valor is None:
            raise ValueError(
                "O nome do cartão não pode ser nulo"
            )

        valor_limpo = " ".join(valor.split())

        if not valor_limpo:
            raise ValueError(
                "O nome do cartão não pode estar vazio"
            )

        return valor_limpo

    @field_validator("identificador")
    @classmethod
    def validar_codigo(
        cls,
        valor: Optional[str],
    ) -> str:
        if valor is None:
            raise ValueError(
                "O identificador não pode ser nulo"
            )

        return validar_identificador(valor)

    @field_validator("tipo", "estado", mode="before")
    @classmethod
    def normalizar_opcao(
        cls,
        valor: Optional[str],
    ) -> str:
        if valor is None:
            raise ValueError(
                "Tipo e estado não podem ser nulos"
            )

        if not isinstance(valor, str):
            return valor

        return valor.strip().lower()

    @field_validator("emissor")
    @classmethod
    def validar_emissor(
        cls,
        valor: Optional[str],
    ) -> Optional[str]:
        return limpar_texto(valor)

    @field_validator("ultimos_quatro")
    @classmethod
    def validar_ultimos_quatro(
        cls,
        valor: Optional[str],
    ) -> Optional[str]:
        if valor is None:
            return None

        valor_limpo = valor.strip()

        if not valor_limpo:
            return None

        if (
            len(valor_limpo) != 4
            or not valor_limpo.isdigit()
        ):
            raise ValueError(
                "Os últimos quatro dígitos devem conter "
                "exatamente quatro números"
            )

        return valor_limpo

    @field_validator("observacoes")
    @classmethod
    def validar_observacoes(
        cls,
        valor: Optional[str],
    ) -> Optional[str]:
        if valor is None:
            return None

        return valor.strip() or None


class CartaoOut(BaseModel):
    id: int
    nome: str
    identificador: str
    tipo: str
    emissor: Optional[str]
    ultimos_quatro: Optional[str]
    validade_mes: Optional[int]
    validade_ano: Optional[int]
    estado: str
    observacoes: Optional[str]
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)