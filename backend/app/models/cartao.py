from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    SmallInteger,
    String,
    Text,
    func,
)

from app.database import Base


class Cartao(Base):
    __tablename__ = "cartoes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    nome = Column(
        String(100),
        nullable=False,
    )

    # Código apresentado ao utilizador: CARTAO-001
    identificador = Column(
        String(50),
        nullable=False,
    )

    # Código usado contra duplicidade: CARTAO001
    identificador_normalizado = Column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
    )

    tipo = Column(
        String(30),
        nullable=False,
    )

    emissor = Column(
        String(100),
        nullable=True,
    )

    ultimos_quatro = Column(
        String(4),
        nullable=True,
    )

    validade_mes = Column(
        SmallInteger,
        nullable=True,
    )

    validade_ano = Column(
        SmallInteger,
        nullable=True,
    )

    estado = Column(
        String(20),
        nullable=False,
        default="ativo",
        server_default="ativo",
    )

    observacoes = Column(
        Text,
        nullable=True,
    )

    criado_em = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    atualizado_em = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )