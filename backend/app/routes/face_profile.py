from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.user import User
from app.schemas.face_profile import (
    FaceProfileEnrollOut,
    FaceProfileRevokeOut,
    FaceProfileStatusOut,
)
from app.services import face_profile as face_profile_service
from app.services.face_engine import (
    FaceEngine,
    FaceEngineError,
    FaceEngineNotConfiguredError,
    get_face_engine,
)


router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


async def _read_face_image(image: UploadFile) -> bytes:
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Formato inválido. Use JPEG, PNG ou WebP.",
        )

    data = await image.read(MAX_IMAGE_BYTES + 1)
    if not data:
        raise HTTPException(status_code=422, detail="Imagem facial vazia.")
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Imagem facial excede o limite de 5 MB.",
        )
    return data


@router.get("/users/{user_id}/status", response_model=FaceProfileStatusOut)
def face_profile_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return face_profile_service.get_status(db, user_id)


@router.post("/users/{user_id}/enroll", response_model=FaceProfileEnrollOut)
async def enroll_face_profile(
    user_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
    face_engine: FaceEngine = Depends(get_face_engine),
):
    image_bytes = await _read_face_image(image)

    try:
        face_embedding = face_engine.extract_embedding(image_bytes)
    except FaceEngineNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except FaceEngineError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return face_profile_service.enroll(
        db=db,
        user_id=user_id,
        enrolled_by=current_user.id,
        face_embedding=face_embedding,
    )


@router.delete("/users/{user_id}", response_model=FaceProfileRevokeOut)
def revoke_face_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return face_profile_service.revoke(db, user_id)
