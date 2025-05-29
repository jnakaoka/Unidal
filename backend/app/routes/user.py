from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services import user as user_service
from app.dependencies.auth import verificar_permissao
from app.dependencies.auth import require_role

router = APIRouter()

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user)

@router.get("/", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    return user_service.get_users(db)

@router.put("/users/{user_id}")
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
#def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if user_update.nome is not None:
        user.nome = user_update.nome
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.perfil_id is not None:
        user.perfil_id = user_update.perfil_id

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "nome": user.nome,
        "email": user.email,
        "perfil": user.perfil.nome
    }

@router.delete("/{user_id}", dependencies=[Depends(verificar_permissao(["admin"]))])
#@router.delete("/{user_id}")
def deletar_usuario(user_id: int, db: Session = Depends(get_db)):
    user = user_service.delete(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return user
