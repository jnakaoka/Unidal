import struct
from datetime import datetime, timezone
from typing import Iterable

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.face_profile import FaceProfile
from app.models.user import User
from app.services.face_engine import FaceEmbedding


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _serialize_embedding(values: Iterable[float]) -> bytes:
    vector = [float(value) for value in values]
    if not vector:
        raise HTTPException(status_code=422, detail="Embedding facial vazio.")
    return struct.pack(f"<{len(vector)}f", *vector)


def get_status(db: Session, user_id: int) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    profile = db.query(FaceProfile).filter(FaceProfile.user_id == user_id).first()

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


def enroll(
    db: Session,
    user_id: int,
    enrolled_by: int,
    face_embedding: FaceEmbedding,
) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if not user.is_active:
        raise HTTPException(
            status_code=409,
            detail="Não é possível cadastrar biometria para usuário inativo.",
        )

    now = _utcnow_naive()
    embedding_bytes = _serialize_embedding(face_embedding.vector)

    profile = db.query(FaceProfile).filter(FaceProfile.user_id == user_id).first()
    if profile is None:
        profile = FaceProfile(user_id=user_id)
        db.add(profile)

    profile.embedding = embedding_bytes
    profile.model_version = face_embedding.model_version
    profile.is_active = True
    profile.enrolled_by = enrolled_by
    profile.enrolled_at = now
    profile.updated_at = now
    profile.revoked_at = None

    db.commit()
    db.refresh(profile)

    return {
        "user_id": user_id,
        "enrolled": True,
        "model_version": profile.model_version,
        "enrolled_at": profile.enrolled_at,
    }


def revoke(db: Session, user_id: int) -> dict:
    profile = db.query(FaceProfile).filter(FaceProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Biometria facial não cadastrada.")

    now = _utcnow_naive()
    profile.embedding = None
    profile.is_active = False
    profile.revoked_at = now
    profile.updated_at = now
    db.commit()

    return {"user_id": user_id, "revoked": True}
