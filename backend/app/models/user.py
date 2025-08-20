#models/user.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.registro_hora import RegistroHoraEquipa

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    empresa = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    
    perfil_id = Column(Integer, ForeignKey("perfis.id"), nullable=False)
    perfil = relationship("Perfil", back_populates="usuarios")
 
    registros = relationship("RegistroHora", back_populates="user")
    registros_hora_equipa = relationship("RegistroHoraEquipa", back_populates="user")
    # equipa_registros = relationship("RegistroHoraEquipa", back_populates="user", cascade="all, delete-orphan")
    #registros = relationship("RegistroHora", back_populates="user")
    #registros = relationship("RegistroHora", back_populates="usuario")