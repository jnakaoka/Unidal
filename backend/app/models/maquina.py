from sqlalchemy import Boolean, Column, DateTime, Integer, String, func

from app.database import Base


class Maquina(Base):
    __tablename__ = "maquinas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(120), nullable=False)
    referencia = Column(String(120), nullable=True)
    ativo = Column(Boolean, nullable=False, default=True, server_default="1")
    criado_em = Column(DateTime, nullable=False, server_default=func.now())
    atualizado_em = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
