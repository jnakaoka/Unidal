from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserOut
from app.services import user as user_service

auth_router = APIRouter()

@auth_router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user)

@auth_router.get("/", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    return user_service.get_users(db)
