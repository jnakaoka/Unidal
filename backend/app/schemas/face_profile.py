from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FaceProfileStatusOut(BaseModel):
    user_id: int
    user_name: str
    has_profile: bool
    is_enrolled: bool
    is_active: bool
    model_version: Optional[str] = None
    enrolled_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None


class FaceProfileEnrollOut(BaseModel):
    user_id: int
    enrolled: bool
    model_version: str
    enrolled_at: datetime


class FaceProfileRevokeOut(BaseModel):
    user_id: int
    revoked: bool
