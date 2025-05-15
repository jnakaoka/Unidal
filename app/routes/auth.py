from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import LoginInput, TokenResponse
from app.services import auth as auth_service

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(data: LoginInput, db: Session = Depends(get_db)):
    return auth_service.login(db, data.email, data.password)