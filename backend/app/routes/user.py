#routes/user.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services import user as user_service
from app.dependencies.auth import verificar_permissao
from app.dependencies.auth import require_role
from sqlalchemy.orm import joinedload
from typing import Optional
from fastapi import Query

router = APIRouter()

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, user)

@router.get("/", response_model=list[UserOut])
def get_users(is_active: Optional[bool] = Query(None), db: Session = Depends(get_db)):
    return user_service.get_users(db, is_active=is_active)
    #return db.query(User).options(joinedload(User.perfil)).all()
    # return user_service.get_users(db)

# @router.put("/{user_id}")
# def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
# #def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
#     print('update user',user_update)
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="Usuário não encontrado")

#     if user_update.name is not None:
#         user.name = user_update.name
#     if user_update.email is not None:
#         user.email = user_update.email
#     if user_update.perfil_id is not None:
#         user.perfil_id = user_update.perfil_id
#     if user_update.empresa is not None:
#         user.empresa = user_update.empresa
#     if user_update.is_active is not None:
#         user.is_active = user_update.is_active

#     db.commit()
#     db.refresh(user)

#     return {
#         "id": user.id,
#         "name": user.name,
#         "email": user.email,
#         "empresa": user.empresa,
#         "perfil": user.perfil.nome,
#         "is_active": user.is_active
#     }

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    updated = user_service.update(db, user_id, user_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return updated

#@router.delete("/{user_id}", dependencies=[Depends(verificar_permissao(["admin"]))])
@router.delete("/{user_id}")
def deletar_usuario(user_id: int, db: Session = Depends(get_db)):
    user = user_service.delete(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return user
