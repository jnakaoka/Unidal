from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import relationship

from app.database import Base


class FaceProfile(Base):
    __tablename__ = "face_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    embedding = Column(LargeBinary, nullable=True)
    model_version = Column(String(100), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    enrolled_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    enrolled_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id], lazy="joined")
    enrolled_by_user = relationship("User", foreign_keys=[enrolled_by], lazy="joined")

    @property
    def is_enrolled(self) -> bool:
        return bool(self.embedding and self.is_active and self.revoked_at is None)
