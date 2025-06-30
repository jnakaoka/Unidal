# app/models/registro_hora.py
from sqlalchemy import Column, Integer, ForeignKey, Date, Float
from sqlalchemy.orm import relationship
from app.database import Base

class RegistroHora(Base):
    __tablename__ = "registros_hora"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"))
    projeto_id = Column(Integer, ForeignKey("projetos.id"))
    data = Column(Date, nullable=False)
    horas = Column(Float, nullable=False)

    projeto = relationship("Projeto", back_populates="registros")
    usuario = relationship("User", back_populates="registros")  # ajuste se o nome for `User` no seu modelo
