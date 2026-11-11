import os
import struct
from cryptography.fernet import Fernet, InvalidToken
from datetime import datetime, timezone
from typing import Iterable
from math import hypot, isfinite

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
    return _embedding_cipher().encrypt(struct.pack(f"<{len(vector)}f", *vector))


def _embedding_cipher() -> Fernet:
    key = os.getenv("FACE_EMBEDDING_KEY")
    if not key:
        raise HTTPException(status_code=503, detail="Chave de proteção biométrica não configurada.")
    try:
        return Fernet(key.encode("ascii"))
    except (ValueError, TypeError, UnicodeError) as exc:
        raise HTTPException(status_code=503, detail="Chave de proteção biométrica inválida.") from exc


def _deserialize_embedding(data: bytes) -> list[float]:
    cipher = _embedding_cipher()
    try:
        decoded = cipher.decrypt(data)
        if not decoded or len(decoded) % 4:
            raise ValueError("Invalid template length")
        vector = list(struct.unpack(f"<{len(decoded) // 4}f", decoded))
        if not all(isfinite(value) for value in vector) or hypot(*vector) <= 0:
            raise ValueError("Invalid template vector")
        return vector
    except (InvalidToken, ValueError, TypeError, struct.error) as exc:
        raise HTTPException(status_code=503, detail="Não foi possível ler o perfil facial. Verifique a configuração biométrica.") from exc


def _verification_threshold() -> float:
    # Ponto inicial experimental; calibrar com pares positivos e negativos reais.
    try:
        value = float(os.getenv("FACE_VERIFICATION_THRESHOLD", "0.5"))
    except ValueError as exc:
        raise HTTPException(status_code=503, detail="Limiar de verificação facial inválido.") from exc
    if not isfinite(value) or not 0 < value <= 1:
        raise HTTPException(status_code=503, detail="Limiar de verificação facial inválido.")
    return value


def verify(db: Session, user_id: int, face_embedding: FaceEmbedding) -> dict:
    """Compara apenas o perfil escolhido. Não grava imagem, template nem presença."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if not user.is_active:
        raise HTTPException(status_code=409, detail="Não é possível verificar um usuário inativo.")
    profile = db.query(FaceProfile).filter(FaceProfile.user_id == user_id).first()
    if not profile or not profile.is_enrolled:
        raise HTTPException(status_code=409, detail="O funcionário não tem um perfil facial ativo. Faça o cadastro primeiro.")
    if profile.model_version != face_embedding.model_version:
        raise HTTPException(status_code=409, detail="O modelo facial mudou. É necessário refazer o cadastro.")
    reference = _deserialize_embedding(profile.embedding)
    candidate = [float(value) for value in face_embedding.vector]
    if len(reference) != len(candidate):
        raise HTTPException(status_code=409, detail="Perfil facial incompatível. É necessário refazer o cadastro.")
    if not candidate or not all(isfinite(value) for value in candidate):
        raise HTTPException(status_code=422, detail="Vetor da captura facial inválido.")
    reference_norm, candidate_norm = hypot(*reference), hypot(*candidate)
    if not isfinite(candidate_norm) or candidate_norm <= 0:
        raise HTTPException(status_code=422, detail="Vetor da captura facial inválido.")
    similarity = max(-1.0, min(1.0, sum(
        (a / reference_norm) * (b / candidate_norm) for a, b in zip(reference, candidate)
    )))
    threshold = _verification_threshold()
    return {
        "user_id": user.id,
        "user_name": user.name,
        "matched": similarity >= threshold,
        "similarity": similarity,
        "threshold": threshold,
        "model_version": profile.model_version,
        "verified_at": _utcnow_naive(),
    }


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
