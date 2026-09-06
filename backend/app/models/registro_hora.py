#models/registro_hora.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime, Float
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy import JSON as SAJSON
#from app.models.registro_hora_equipa import registro_hora_equipa

class RegistroHora(Base):
    __tablename__ = "registros_hora"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), nullable=False)
    data = Column(Date, nullable=False)
    horas = Column(Float, nullable=False)

    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    obra_id    = Column(Integer, ForeignKey("obras.id"), nullable=True)
    
    # cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="RESTRICT"), nullable=False)
    # obra_id    = Column(Integer, ForeignKey("obras.id", ondelete="RESTRICT"),    nullable=False)

    cliente = relationship("Cliente", lazy="joined")
    obra = relationship("Obra", lazy="joined")
    metros_quadrados = Column(String(255), nullable=True)

    preparacao = Column(Boolean, default=False)
    bruto = Column(Boolean, default=False)
    colagem = Column(Boolean, default=False)
    acabamento = Column(Boolean, default=False)
    serragem = Column(Boolean, default=False)
    coli = Column(Boolean, default=False)
    optipav = Column(Boolean, default=False, nullable=False)
    double_journey_lider = Column(Boolean, default=False, nullable=False)
    intervencao_maquinas = Column(Boolean, default=False)
    intervencao_maquinas_opcoes = Column(SAJSON, nullable=True)

    # --- MOTORISTA ---
    origem = Column(String(255), nullable=True)
    destino = Column(String(255), nullable=True)
    matricula = Column(String(50), nullable=True)
    km_rodados = Column(Float, nullable=True)
    maquinas_transportadas = Column(SAJSON, nullable=True)

    modificado_por = Column(Integer, ForeignKey("users.id"), nullable=True)
    modificado_em  = Column(DateTime(timezone=True), nullable=True)

    # cliente = relationship("Cliente")
    # obra = relationship("Obra")

    #user = relationship("User", back_populates="registros")
    
    # usuário "dono / criador" do registo
    user = relationship(
        "User",
        back_populates="registros",
        foreign_keys=[usuario_id],
    )

    # usuário que modificou por último
    usuario_modificador = relationship(
        "User",
        foreign_keys=[modificado_por],
        viewonly=True,
    )

    equipa = relationship("RegistroHoraEquipa", back_populates="registro", cascade="all, delete-orphan")
    
    # equipa = relationship(
    #     "User",
    #     secondary=registro_hora_equipa,
    #     back_populates="registros_hora_equipa"
    # )
    
    # equipa = relationship("RegistroHoraEquipa", back_populates="registro", cascade="all, delete-orphan")
    projeto = relationship("Projeto", back_populates="registros")

class RegistroHoraEquipa(Base):
    __tablename__ = "registros_hora_equipa"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    registro_id = Column(Integer, ForeignKey("registros_hora.id"))
    intemperie = Column(Boolean, default=False)
    double_journey = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="registros_hora_equipa")
    registro = relationship("RegistroHora", back_populates="equipa")


# app/models/registro_hora.py
# from sqlalchemy import Column, Integer, ForeignKey, Date, Float
# from sqlalchemy.orm import relationship
# from app.database import Base

# class RegistroHora(Base):
#     __tablename__ = "registros_hora"

#     id = Column(Integer, primary_key=True, index=True)
#     usuario_id = Column(Integer, ForeignKey("users.id"))
#     projeto_id = Column(Integer, ForeignKey("projetos.id"))
#     data = Column(Date, nullable=False)
#     horas = Column(Float, nullable=False)

#     projeto = relationship("Projeto", back_populates="registros")
#     usuario = relationship("User", back_populates="registros")  # ajuste se o nome for `User` no seu modelo
