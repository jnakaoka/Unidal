from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from app.database import Base
from app.models.documento import agora


class EdicaoApontamento(Base):
    __tablename__ = "apontamento_edicoes"
    id = Column(Integer, primary_key=True)
    # Sem FK para preservar o histórico mesmo após eliminar o apontamento.
    registro_id = Column(Integer, nullable=False, index=True)
    autor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    autor_nome = Column(String(255), nullable=False)
    resumo = Column(String(500), nullable=False)
    alteracoes = Column(JSON, nullable=False)
    criado_em = Column(DateTime(timezone=True), nullable=False, default=agora)


class Notificacao(Base):
    __tablename__ = "notificacoes"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    edicao_id = Column(Integer, ForeignKey("apontamento_edicoes.id"), nullable=False)
    lida_em = Column(DateTime(timezone=True), nullable=True)
