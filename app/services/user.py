from sqlalchemy.orm import Session
from app import models
from app.schemas.user import UserCreate
from app.utils.security import hash_password
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import User  # ou o caminho correto do modelo

def create_user(db: Session, user: UserCreate):
    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password = hash_password(user.password)
    )
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="E-mail já está em uso.")

def get_users(db: Session):
    return db.query(models.User).all()

def get_user_by_email(db: Session, email: str) -> User | None:
    print("get user",email)
    return db.query(User).filter(User.name == email).first()