from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class Perfil(Base):
    __tablename__ = "perfis"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
