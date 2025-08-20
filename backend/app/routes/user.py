from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services import user as user_service
from app.dependencies.auth import verificar_permissao
from app.dependencies.auth import require_role
from sqlalchemy.orm import joinedload

router = APIRouter()

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user)

@router.get("/", response_model=list[UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).options(joinedload(User.perfil)).all()
    # return user_service.get_users(db)

@router.put("/{user_id}")
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
#def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
    print('update user',user_update)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if user_update.name is not None:
        user.name = user_update.name
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.perfil_id is not None:
        user.perfil_id = user_update.perfil_id
    if user_update.empresa is not None:
        user.empresa = user_update.empresa

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "empresa": user.empresa,
        "perfil": user.perfil.nome
    }

#@router.delete("/{user_id}", dependencies=[Depends(verificar_permissao(["admin"]))])
@router.delete("/{user_id}")
def deletar_usuario(user_id: int, db: Session = Depends(get_db)):
    user = user_service.delete(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return user
