from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base

class Material(Base):
    __tablename__ = "materiais"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False, unique=True, index=True)
    unidade = Column(String(30), nullable=False, default="un")
    estoque_fisico = Column(Numeric(12, 3), nullable=False, default=0)
    estoque_minimo = Column(Numeric(12, 3), nullable=False, default=0)
    controla_tamanho = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    criado_em = Column(DateTime, nullable=False, server_default=func.now())
    tamanhos = relationship("MaterialTamanho", back_populates="material", cascade="all, delete-orphan")

class MaterialTamanho(Base):
    __tablename__ = "material_tamanhos"
    __table_args__ = (UniqueConstraint("material_id", "tamanho", name="uq_material_tamanho"),)
    id = Column(Integer, primary_key=True)
    material_id = Column(Integer, ForeignKey("materiais.id", ondelete="CASCADE"), nullable=False, index=True)
    tamanho = Column(String(30), nullable=False)
    estoque_fisico = Column(Numeric(12, 3), nullable=False, default=0)
    estoque_minimo = Column(Numeric(12, 3), nullable=False, default=0)
    material = relationship("Material", back_populates="tamanhos")

class PedidoMaterial(Base):
    __tablename__ = "pedidos_materiais"
    id = Column(Integer, primary_key=True, index=True)
    solicitante_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="PENDENTE", index=True)
    resultado = Column(String(30), nullable=True)
    observacao = Column(Text, nullable=True)
    motivo_conclusao_parcial = Column(Text, nullable=True)
    criado_em = Column(DateTime, nullable=False, server_default=func.now())
    atualizado_em = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    solicitante = relationship("User")
    itens = relationship("PedidoMaterialItem", back_populates="pedido", cascade="all, delete-orphan")

class PedidoMaterialItem(Base):
    __tablename__ = "pedido_material_itens"
    id = Column(Integer, primary_key=True)
    pedido_id = Column(Integer, ForeignKey("pedidos_materiais.id", ondelete="CASCADE"), nullable=False, index=True)
    material_solicitado_id = Column(Integer, ForeignKey("materiais.id"), nullable=False)
    material_enviado_id = Column(Integer, ForeignKey("materiais.id"), nullable=True)
    tamanho_solicitado = Column(String(30), nullable=True)
    tamanho_enviado = Column(String(30), nullable=True)
    quantidade_solicitada = Column(Numeric(12, 3), nullable=False)
    quantidade_enviada = Column(Numeric(12, 3), nullable=False, default=0)
    motivo_substituicao = Column(Text, nullable=True)
    pedido = relationship("PedidoMaterial", back_populates="itens")
    material_solicitado = relationship("Material", foreign_keys=[material_solicitado_id])
    material_enviado = relationship("Material", foreign_keys=[material_enviado_id])

class MovimentoEstoque(Base):
    __tablename__ = "movimentos_estoque"
    id = Column(Integer, primary_key=True)
    material_id = Column(Integer, ForeignKey("materiais.id"), nullable=False, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos_materiais.id"), nullable=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    tipo = Column(String(20), nullable=False)
    quantidade = Column(Numeric(12, 3), nullable=False)
    tamanho = Column(String(30), nullable=True)
    observacao = Column(Text, nullable=True)
    criado_em = Column(DateTime, nullable=False, server_default=func.now())
    material = relationship("Material")
