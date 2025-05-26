from sqlalchemy.orm import Session
from app import models
from app.schemas.user import UserCreate
from app.utils.security import hash_password
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import User  # ou o caminho correto do modelo

def get_users(db: Session):
    return db.query(models.User).all()

def get_user_by_email(db: Session, email: str) -> User | None:
    print("get user",email)
    return db.query(User).filter(User.name == email).first()

def get_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user: UserCreate):
    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password = hash_password(user.password),
        perfil_id=user.perfil_id,
        is_active=True
    )
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="E-mail já está em uso.")

def delete(db: Session, user_id: int):
    db_user = get_by_id(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user

def update(db: Session, user_id: int, user: UserCreate):
    db_user = get_by_id(db, user_id)
    if db_user:
        for key, value in user.dict().items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user

