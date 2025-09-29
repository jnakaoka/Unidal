#services/user.py
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app import models
from app.schemas.user import UserCreate
from app.utils.security import hash_password
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import User  # ou o caminho correto do modelo

def get_users(db: Session, is_active: Optional[bool] = None):
    print("flag active",is_active)
    q = db.query(User).options(joinedload(User.perfil))
    if is_active is not None:                # só filtra se o cliente pediu
        q = q.filter(User.is_active.is_(is_active))  # .is_ para booleano no SQLAlchemy
    return q.all()

def get_user_by_email(db: Session, email: str) -> User | None:
    print("get user",email)
    return db.query(User).filter(User.email == email).first()

def get_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, user: UserCreate):
    db_user = models.User(
        name=user.name,
        email=user.email,
        empresa=user.empresa,
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
    print("usuario update", user)
    db_user = get_by_id(db, user_id)
    if not db_user:
        return None

    data = user.dict(exclude_unset=True)
    if "password" in data and data["password"]:
        db_user.hashed_password = hash_password(data["password"])
        data.pop("password")

    for k, v in data.items():
        setattr(db_user, k, v)

    db.commit()
    db.refresh(db_user)
    return db_user
    
    # db_user = get_by_id(db, user_id)
    # if db_user:
    #     for key, value in user.dict().items():
    #         setattr(db_user, key, value)
    #     db.commit()
    #     db.refresh(db_user)
    # return db_user

