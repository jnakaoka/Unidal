import os
import logging
from time import perf_counter
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

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
logger = logging.getLogger("uvicorn.error.face")

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MIN_ENROLLMENT_IMAGES = 1
MAX_ENROLLMENT_IMAGES = 5


def require_face_feature_enabled():
    """Desativada por defeito, incluindo em produção."""
    if os.getenv("FACE_BIOMETRICS_ENABLED", "").lower() not in {"1", "true", "yes"}:
        raise HTTPException(status_code=503, detail="Biometria facial experimental desativada.")


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


async def _run_face_engine(operation, callback, *args):
    request_id = uuid4().hex[:12]
    started = perf_counter()
    try:
        result = await run_in_threadpool(callback, *args)
    except FaceEngineError as exc:
        code = 503 if isinstance(exc, FaceEngineNotConfiguredError) else 422
        logger.warning(
            "face_request operation=%s request_id=%s status=%s duration_ms=%.1f reason=%s",
            operation, request_id, code, (perf_counter() - started) * 1000, str(exc),
        )
        raise HTTPException(status_code=code, detail=str(exc), headers={"X-Face-Request-ID": request_id}) from exc
    except Exception as exc:
        logger.exception("face_request operation=%s request_id=%s status=500 duration_ms=%.1f",
                         operation, request_id, (perf_counter() - started) * 1000)
        raise HTTPException(status_code=500, detail="Erro interno ao validar o rosto. Tente novamente.",
                            headers={"X-Face-Request-ID": request_id}) from exc
    duration_ms = round((perf_counter() - started) * 1000, 1)
    logger.info("face_request operation=%s request_id=%s status=200 duration_ms=%.1f",
                operation, request_id, duration_ms)
    return result, request_id, duration_ms


@router.get("/users/{user_id}/status", response_model=FaceProfileStatusOut)
def face_profile_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    require_face_feature_enabled()
    return face_profile_service.get_status(db, user_id)


@router.post("/capture/check")
async def check_face_capture(
    image: UploadFile = File(...),
    current_user: User = Depends(require_role("admin")),
    face_engine: FaceEngine = Depends(get_face_engine),
):
    """Validação prévia de uma fotografia; não grava biometria nem imagem."""
    require_face_feature_enabled()
    image_bytes = await _read_face_image(image)
    _, request_id, duration_ms = await _run_face_engine("capture_check", face_engine.extract_embedding, image_bytes)
    return {"valid": True, "message": "Rosto detetado e captura aceite.",
            "request_id": request_id, "processing_ms": duration_ms}


@router.post("/users/{user_id}/enroll", response_model=FaceProfileEnrollOut)
async def enroll_face_profile(
    user_id: int,
    images: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
    face_engine: FaceEngine = Depends(get_face_engine),
):
    require_face_feature_enabled()
    if not MIN_ENROLLMENT_IMAGES <= len(images) <= MAX_ENROLLMENT_IMAGES:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Envie entre {MIN_ENROLLMENT_IMAGES} e "
                f"{MAX_ENROLLMENT_IMAGES} capturas faciais."
            ),
        )

    image_bytes = [await _read_face_image(image) for image in images]

    face_embedding, _, _ = await _run_face_engine("enroll", face_engine.build_enrollment, image_bytes)

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
    require_face_feature_enabled()
    return face_profile_service.revoke(db, user_id)
