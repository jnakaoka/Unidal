from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Obra(Base):
    __tablename__ = "obras"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=True)

    cliente_id = Column(
        Integer,
        ForeignKey("clientes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    cliente = relationship("Cliente", back_populates="obras")
    registros = relationship("RegistroHora", back_populates="obra")
