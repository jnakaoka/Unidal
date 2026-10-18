from decimal import Decimal
from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime

class MaterialTamanhoCreate(BaseModel):
    tamanho: str = Field(min_length=1, max_length=30)
    estoque_inicial: Decimal = Field(default=0, ge=0)
    estoque_minimo: Decimal = Field(default=0, ge=0)

class MaterialTamanhoOut(BaseModel):
    id: int
    tamanho: str
    estoque_fisico: Decimal
    estoque_minimo: Decimal
    estoque_reservado: Decimal = Decimal("0")
    estoque_disponivel: Decimal = Decimal("0")
    model_config = {"from_attributes": True}

class MaterialCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=255)
    unidade: str = Field(default="un", min_length=1, max_length=30)
    estoque_inicial: Decimal = Field(default=0, ge=0)
    estoque_minimo: Decimal = Field(default=0, ge=0)
    controla_tamanho: bool = False
    tamanhos: list[MaterialTamanhoCreate] = []

    @model_validator(mode="after")
    def validar_tamanhos(self):
        if self.controla_tamanho and not self.tamanhos:
            raise ValueError("Informe pelo menos um tamanho para este material.")
        return self

class MaterialUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=1, max_length=255)
    unidade: Optional[str] = Field(default=None, min_length=1, max_length=30)
    estoque_minimo: Optional[Decimal] = Field(default=None, ge=0)
    is_active: Optional[bool] = None

class MovimentoEstoqueCreate(BaseModel):
    quantidade: Decimal = Field(gt=0)
    observacao: Optional[str] = None
    tamanho: Optional[str] = Field(default=None, max_length=30)

class AjusteEstoqueCreate(BaseModel):
    estoque_fisico: Decimal = Field(ge=0)
    motivo: str = Field(min_length=3, max_length=500)
    tamanho: Optional[str] = Field(default=None, max_length=30)

class MaterialOut(BaseModel):
    id: int
    nome: str
    unidade: str
    estoque_fisico: Decimal
    estoque_minimo: Decimal
    controla_tamanho: bool = False
    tamanhos: list[MaterialTamanhoOut] = []
    is_active: bool
    estoque_reservado: Decimal = Decimal("0")
    estoque_disponivel: Decimal = Decimal("0")
    model_config = {"from_attributes": True}

class PedidoItemCreate(BaseModel):
    material_id: int
    quantidade: Decimal = Field(gt=0)
    tamanho: Optional[str] = Field(default=None, max_length=30)

class PedidoCreate(BaseModel):
    itens: list[PedidoItemCreate] = Field(min_length=1)
    observacao: Optional[str] = None

class PedidoItemOut(BaseModel):
    id: int
    material_solicitado_id: int
    material_enviado_id: Optional[int]
    tamanho_solicitado: Optional[str]
    tamanho_enviado: Optional[str]
    quantidade_solicitada: Decimal
    quantidade_enviada: Decimal
    motivo_substituicao: Optional[str]
    model_config = {"from_attributes": True}

class PedidoOut(BaseModel):
    id: int
    solicitante_id: int
    status: str
    resultado: Optional[str]
    observacao: Optional[str]
    motivo_conclusao_parcial: Optional[str]
    criado_em: datetime
    itens: list[PedidoItemOut]
    model_config = {"from_attributes": True}

class AtenderItem(BaseModel):
    material_enviado_id: Optional[int] = None
    quantidade_enviada: Decimal = Field(ge=0)
    tamanho_enviado: Optional[str] = Field(default=None, max_length=30)
    motivo_substituicao: Optional[str] = None

    @model_validator(mode="after")
    def validar_substituicao(self):
        if self.material_enviado_id is not None and not (self.motivo_substituicao or "").strip():
            raise ValueError("Informe o motivo da substituição.")
        return self

class ConcluirPedido(BaseModel):
    motivo_parcial: Optional[str] = None

class MovimentoEstoqueOut(BaseModel):
    id: int
    material_id: int
    pedido_id: Optional[int]
    usuario_id: int
    usuario_nome: Optional[str] = None
    tipo: str
    quantidade: Decimal
    tamanho: Optional[str]
    observacao: Optional[str]
    criado_em: datetime
    model_config = {"from_attributes": True}
