# from sqlalchemy import Table, Column, Integer, ForeignKey
# from app.database import Base

# registros_hora_equipa = Table(
#     "registros_hora_equipa",
#     Base.metadata,
#     Column("registro_id", Integer, ForeignKey("registros_hora.id"), primary_key=True),
#     Column("user_id", Integer, ForeignKey("users.id"), primary_key=True)
# )


# Esse arquivo está perfeito e suficiente caso:

# você não queira armazenar informações adicionais (como horas específicas por membro da equipa, comentários, status, etc.).

# esteja apenas fazendo o relacionamento N:N entre RegistroHora e User.

# Quando você precisaria de uma classe modelo completa (class RegistroHoraEquipa(Base):)?
# Somente se a relação precisar ter campos extras. 

# from sqlalchemy import Column, ForeignKey, Integer
# from sqlalchemy.orm import relationship
# from app.database import Base

# class RegistroHoraEquipa(Base):
#     __tablename__ = "registros_hora_equipa"

#     id = Column(Integer, primary_key=True, index=True)
#     registro_id = Column(Integer, ForeignKey("registro_hora.id"))
#     usuario_id = Column(Integer, ForeignKey("users.id"))

#     registro = relationship("RegistroHora", back_populates="equipa")
#     user = relationship("User")