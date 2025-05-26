from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserOut
from app.services import user as user_service
from app.dependencies.auth import verificar_permissao

router = APIRouter()

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user)

@router.get("/", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    return user_service.get_users(db)

@router.delete("/{user_id}", dependencies=[Depends(verificar_permissao(["admin"]))])
def deletar_usuario(user_id: int, db: Session = Depends(get_db)):
    user = user_service.delete(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return user
