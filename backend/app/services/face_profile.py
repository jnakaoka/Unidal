from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.face_profile import FaceProfile
from app.models.user import User


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_status(db: Session, user_id: int) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    profile = (
        db.query(FaceProfile)
        .filter(FaceProfile.user_id == user_id)
        .first()
    )

    if not profile:
        return {
            "user_id": user.id,
            "user_name": user.name,
            "has_profile": False,
            "is_enrolled": False,
            "is_active": False,
            "model_version": None,
            "enrolled_at": None,
            "updated_at": None,
            "revoked_at": None,
        }

    return {
        "user_id": user.id,
        "user_name": user.name,
        "has_profile": True,
        "is_enrolled": profile.is_enrolled,
        "is_active": profile.is_active,
        "model_version": profile.model_version,
        "enrolled_at": profile.enrolled_at,
        "updated_at": profile.updated_at,
        "revoked_at": profile.revoked_at,
    }


def revoke(db: Session, user_id: int) -> dict:
    profile = (
        db.query(FaceProfile)
        .filter(FaceProfile.user_id == user_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Biometria facial não cadastrada.")

    now = _utcnow_naive()
    profile.embedding = None
    profile.is_active = False
    profile.revoked_at = now
    profile.updated_at = now
    db.commit()

    return {"user_id": user_id, "revoked": True}
