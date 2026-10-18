from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship

from app.database import Base


usuario_funcoes = Table(
    "usuario_funcoes",
    Base.metadata,
    Column("usuario_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("funcao_id", Integer, ForeignKey("funcoes.id", ondelete="CASCADE"), primary_key=True),
)


class Funcao(Base):
    __tablename__ = "funcoes"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(64), unique=True, nullable=False, index=True)
    nome = Column(String(120), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    usuarios = relationship(
        "User",
        secondary=usuario_funcoes,
        back_populates="funcoes",
    )
