# from sqlalchemy import Column, Integer, Date, ForeignKey, DateTime, String, UniqueConstraint
# from sqlalchemy.orm import relationship
# from datetime import datetime, timezone
# from app.database import Base

# class Roster(Base):
#     __tablename__ = "rosters"
#     __table_args__ = (
#         UniqueConstraint("cliente_id", "obra_id", "data", name="uq_roster_cliente_obra_data"),
#     )

#     id = Column(Integer, primary_key=True, index=True)
#     cliente_id = Column(Integer, ForeignKey("clientes.id", ondelete="RESTRICT"), nullable=False, index=True)
#     obra_id = Column(Integer, ForeignKey("obras.id", ondelete="RESTRICT"), nullable=False, index=True)
#     data = Column(Date, nullable=False, index=True)

#     leader_user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

#     source_roster_id = Column(Integer, ForeignKey("rosters.id"), nullable=True)

#     status = Column(String(20), nullable=False, default="DRAFT")  # DRAFT/LOCKED

#     created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
#     updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

#     members = relationship("RosterMember", back_populates="roster", cascade="all, delete-orphan")
#     cliente = relationship("Cliente", lazy="joined")
#     obra = relationship("Obra", lazy="joined")
#     leader = relationship("User", foreign_keys=[leader_user_id], lazy="joined")

# class RosterMember(Base):
#     __tablename__ = "roster_members"

#     id = Column(Integer, primary_key=True, index=True)
#     roster_id = Column(Integer, ForeignKey("rosters.id", ondelete="CASCADE"), nullable=False, index=True)
#     user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

#     roster = relationship("Roster", back_populates="members")
#     user = relationship("User", lazy="joined")
