from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from app.database import Base


def agora():
    return datetime.now(timezone.utc)


class CategoriaDocumento(Base):
    __tablename__ = "documento_categorias"
    id = Column(Integer, primary_key=True)
    nome = Column(String(120), unique=True, nullable=False)
    visibilidade = Column(String(20), nullable=False, default="admin")
    perfil_ids = Column(JSON, nullable=False, default=list)
    usuario_ids = Column(JSON, nullable=False, default=list)


class Documento(Base):
    __tablename__ = "documentos"
    id = Column(Integer, primary_key=True)
    categoria_id = Column(Integer, ForeignKey("documento_categorias.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    descricao = Column(Text, nullable=False, default="")
    arquivado = Column(Boolean, nullable=False, default=False)


class DocumentoVersao(Base):
    __tablename__ = "documento_versoes"
    id = Column(Integer, primary_key=True)
    documento_id = Column(Integer, ForeignKey("documentos.id"), nullable=False, index=True)
    nome_original = Column(String(255), nullable=False)
    chave = Column(String(80), unique=True, nullable=False)
    tamanho = Column(Integer, nullable=False)
    criado_por = Column(Integer, ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime(timezone=True), nullable=False, default=agora)
