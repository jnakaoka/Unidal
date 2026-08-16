from sqlalchemy import (
    CheckConstraint,
    Column,
    Computed,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship
from app.database import Base


class CartaoVeiculoAssociacao(Base):
    __tablename__ = "cartao_veiculo_associacoes"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    cartao_id = Column(
        Integer,
        ForeignKey(
            "cartoes.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    veiculo_id = Column(
        Integer,
        ForeignKey(
            "veiculos.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    associado_em = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    desassociado_em = Column(
        DateTime,
        nullable=True,
    )

    associado_por_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    desassociado_por_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=True,
        index=True,
    )

    observacoes = Column(
        Text,
        nullable=True,
    )

    cartao_ativo_id = Column(
        Integer,
        Computed(
            (
                "CASE WHEN desassociado_em IS NULL "
                "THEN cartao_id ELSE NULL END"
            ),
            persisted=True,
        ),
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

    __table_args__ = (
        UniqueConstraint(
            "cartao_ativo_id",
            name=(
                "uq_cartao_veiculo_associacoes_"
                "cartao_ativo"
            ),
        ),
        CheckConstraint(
            (
                "desassociado_em IS NULL "
                "OR desassociado_em >= associado_em"
            ),
            name=(
                "ck_cartao_veiculo_associacoes_"
                "periodo"
            ),
        ),
        CheckConstraint(
            (
                "("
                "desassociado_em IS NULL "
                "AND desassociado_por_id IS NULL"
                ") OR ("
                "desassociado_em IS NOT NULL "
                "AND desassociado_por_id IS NOT NULL"
                ")"
            ),
            name=(
                "ck_cartao_veiculo_associacoes_"
                "encerramento"
            ),
        ),
    )

    cartao = relationship(
        "Cartao",
    )

    veiculo = relationship(
        "Veiculo",
    )

    associado_por = relationship(
        "User",
        foreign_keys=[associado_por_id],
    )

    desassociado_por = relationship(
        "User",
        foreign_keys=[desassociado_por_id],
    )

    @property
    def ativa(self) -> bool:
        return self.desassociado_em is None