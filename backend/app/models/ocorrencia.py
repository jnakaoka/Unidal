from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Table, Text, func
from sqlalchemy.orm import relationship

from app.database import Base


ocorrencia_testemunhas = Table(
    "ocorrencia_testemunhas",
    Base.metadata,
    Column("ocorrencia_id", ForeignKey("ocorrencias.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", ForeignKey("users.id", ondelete="RESTRICT"), primary_key=True),
)


class Ocorrencia(Base):
    __tablename__ = "ocorrencias"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(Date, nullable=False, index=True)
    chefe_equipe_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    funcionario_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    descricao = Column(Text, nullable=False)
    criado_por_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    criado_em = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    chefe_equipe = relationship("User", foreign_keys=[chefe_equipe_id])
    funcionario = relationship("User", foreign_keys=[funcionario_id])
    criado_por = relationship("User", foreign_keys=[criado_por_id])
    testemunhas = relationship("User", secondary=ocorrencia_testemunhas, lazy="joined")
