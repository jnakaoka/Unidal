from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User
from app.schemas.face_profile import FaceProfileRevokeOut, FaceProfileStatusOut
from app.services import face_profile as face_profile_service


router = APIRouter()


@router.get(
    "/users/{user_id}/status",
    response_model=FaceProfileStatusOut,
)
def face_profile_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return face_profile_service.get_status(db, user_id)


@router.delete(
    "/users/{user_id}",
    response_model=FaceProfileRevokeOut,
)
def revoke_face_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return face_profile_service.revoke(db, user_id)
