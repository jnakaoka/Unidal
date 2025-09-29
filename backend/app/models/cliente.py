from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, default=True)

    obras = relationship(
        "Obra",
        back_populates="cliente",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    registros = relationship("RegistroHora", back_populates="cliente")