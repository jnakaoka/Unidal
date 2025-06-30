from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    
    perfil_id = Column(Integer, ForeignKey("perfis.id"), nullable=False)
    perfil = relationship("Perfil", back_populates="usuarios")
    registros = relationship("RegistroHora", back_populates="usuario")