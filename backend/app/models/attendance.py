# from sqlalchemy import Column, Integer, DateTime, ForeignKey, Float, String, Text
# from sqlalchemy.orm import relationship
# from datetime import datetime, timezone
# from app.database import Base

# class AttendanceSession(Base):
#     __tablename__ = "attendance_sessions"

#     id = Column(Integer, primary_key=True, index=True)
#     roster_id = Column(Integer, ForeignKey("rosters.id", ondelete="RESTRICT"), nullable=False, index=True)
#     leader_user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

#     started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
#     ended_at = Column(DateTime(timezone=True), nullable=True)

#     start_lat = Column(Float, nullable=True)
#     start_lng = Column(Float, nullable=True)
#     start_accuracy = Column(Float, nullable=True)

#     end_lat = Column(Float, nullable=True)
#     end_lng = Column(Float, nullable=True)
#     end_accuracy = Column(Float, nullable=True)

#     status = Column(String(20), nullable=False, default="OPEN")  # OPEN/CLOSED/VALIDATED/REVIEW/REJECTED
#     leader_photo_url = Column(Text, nullable=True)

#     roster = relationship("Roster", lazy="joined")
#     leader = relationship("User", foreign_keys=[leader_user_id], lazy="joined")
#     checks = relationship("AttendanceCheck", back_populates="session", cascade="all, delete-orphan")

# class AttendanceCheck(Base):
#     __tablename__ = "attendance_checks"

#     id = Column(Integer, primary_key=True, index=True)
#     session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
#     user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

#     captured_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

#     lat = Column(Float, nullable=True)
#     lng = Column(Float, nullable=True)
#     accuracy = Column(Float, nullable=True)

#     photo_url = Column(Text, nullable=False)
#     result = Column(String(20), nullable=False, default="OK")  # OK/REVIEW/FAIL

#     session = relationship("AttendanceSession", back_populates="checks")
#     user = relationship("User", lazy="joined")
