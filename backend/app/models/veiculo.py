from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Integer,
    String,
    func,
)

from app.database import Base


class Veiculo(Base):
    __tablename__ = "veiculos"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Valor apresentado ao utilizador: AA-00-BB
    matricula = Column(
        String(20),
        nullable=False,
    )

    # Valor usado contra duplicidade: AA00BB
    matricula_normalizada = Column(
        String(20),
        nullable=False,
        unique=True,
        index=True,
    )

    tipo = Column(
        String(30),
        nullable=False,
        default="carrinha",
        server_default="carrinha",
    )

    descricao = Column(
        String(255),
        nullable=True,
    )

    seguradora = Column(String(120), nullable=True)
    numero_apolice = Column(String(100), nullable=True)
    seguro_inicio = Column(Date, nullable=True)
    seguro_vencimento = Column(Date, nullable=True)

    ativo = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default="1",
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