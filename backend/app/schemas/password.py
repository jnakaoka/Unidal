from pydantic import BaseModel, Field

class ChangeOwnPasswordInput(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

class AdminResetPasswordInput(BaseModel):
    user_id: int
    new_password: str = Field(..., min_length=8)