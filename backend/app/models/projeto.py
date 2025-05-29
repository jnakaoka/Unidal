from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    descricao = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)