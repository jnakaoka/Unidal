# schemas/obra.py
from typing import Optional
from app.utils.text import limpar_espacos

from pydantic import BaseModel, Field, field_validator


def limpar_nome(nome: str) -> str:
    """Valida e limpa o nome que será guardado no banco."""
    nome_limpo = limpar_espacos(nome)

    if not nome_limpo:
        raise ValueError("O nome da obra não pode estar vazio")

    return nome_limpo


class ClienteMini(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True


class ObraBase(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    descricao: Optional[str] = None
    cliente_id: int = Field(gt=0)

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, valor: str) -> str:
        return limpar_nome(valor)


class ObraCreate(ObraBase):
    pass


class ObraUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=1, max_length=255)
    descricao: Optional[str] = None
    cliente_id: Optional[int] = Field(default=None, gt=0)

    @field_validator("nome")
    @classmethod
    def validar_nome(cls, valor: Optional[str]) -> str:
        if valor is None:
            raise ValueError("O nome da obra não pode ser nulo")

        return limpar_nome(valor)

    @field_validator("cliente_id")
    @classmethod
    def validar_cliente_id(cls, valor: Optional[int]) -> int:
        if valor is None:
            raise ValueError("O cliente da obra não pode ser nulo")

        return valor


class ObraOut(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    cliente_id: int
    cliente: Optional[ClienteMini] = None

    class Config:
        from_attributes = True


class ObraMerge(BaseModel):
    obra_destino_id: int = Field(gt=0)
    obras_origem_ids: list[int] = Field(min_length=1)

    @field_validator("obras_origem_ids")
    @classmethod
    def validar_obras_origem(cls, valores: list[int]) -> list[int]:
        if any(valor <= 0 for valor in valores):
            raise ValueError("Todos os IDs das obras devem ser positivos")

        return valores