from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.security import verify_password, create_access_token
from fastapi import HTTPException, status
from datetime import timedelta

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    return user

def login(db: Session, email: str, password: str):
    user = authenticate_user(db, email, password)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
