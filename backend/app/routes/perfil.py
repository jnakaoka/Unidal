# routes/perfil.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.perfil import PerfilOut, PerfilCreate, PerfilUpdate
from app.models.perfil import Perfil as PerfilModel
from app.services import perfil as svc_perfil  # evite sombra de nome

router = APIRouter(prefix="/perfis", tags=["Perfis"])

@router.get("/", response_model=List[PerfilOut])
def listar_perfis(db: Session = Depends(get_db)):
    return svc_perfil.get_all(db)

@router.get("/{perfil_id}", response_model=PerfilOut)
def obter_perfil(perfil_id: int, db: Session = Depends(get_db)):
    returned = svc_perfil.get_by_id(db, perfil_id)
    if not returned:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return returned

@router.post("/", response_model=PerfilOut, status_code=201)
def criar_perfil(payload: PerfilCreate, db: Session = Depends(get_db)):
    return svc_perfil.create(db, payload)

@router.put("/{perfil_id}", response_model=PerfilOut)
def update_perfil(perfil_id: int, payload: PerfilUpdate, db: Session = Depends(get_db)):
    obj = db.query(PerfilModel).filter(PerfilModel.id == perfil_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    if payload.nome is not None:
        obj.nome = payload.nome
    if payload.is_active is not None:
        obj.is_active = payload.is_active
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/{perfil_id}", response_model=PerfilOut)
def deletar_perfil(perfil_id: int, db: Session = Depends(get_db)):
    returned = svc_perfil.delete(db, perfil_id)
    if not returned:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return returned


# # routes/perfil.py
# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from typing import List
# from app.database import get_db
# from app.schemas.perfil import PerfilOut, PerfilCreate, PerfilUpdate, Perfil  # ← Esse Perfil é o Pydantic
# from app.models.perfil import Perfil as PerfilModel  # ← Alias para evitar conflito de nomes
# from app.services import perfil
# from app.services.perfil import create

# # router = APIRouter(prefix="/perfis", tags=["Perfis"])

# router = APIRouter()

# @router.get("/", response_model=List[PerfilOut])
# def listar_perfis(db: Session = Depends(get_db)):
#     return perfil.get_all(db)

# @router.get("/{id}", response_model=PerfilOut)
# def obter_perfil(id: int, db: Session = Depends(get_db)):
#     returned_perfil = perfil.get_by_id(db, id)
#     if not returned_perfil:
#         raise HTTPException(status_code=404, detail="Perfil não encontrado")
#     return returned_perfil

# @router.post("/", response_model=PerfilOut)
# def criar_perfil(perfil: PerfilCreate, db: Session = Depends(get_db)):
#     return create(db, perfil)

# @router.put("/perfis/{perfil_id}", response_model=PerfilOut)
# def update_perfil(perfil_id: int, perfil_update: PerfilUpdate, db: Session = Depends(get_db)):
# #def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):

#     perfil = db.query(PerfilModel).filter(PerfilModel.id == perfil_id).first()
#     if not perfil:
#         raise HTTPException(status_code=404, detail="Perfil não encontrado")

#     if perfil_update.nome is not None:
#         perfil.nome = perfil_update.nome
    
#     db.commit()
#     db.refresh(perfil)

#     return perfil

# @router.delete("/{id}", response_model=PerfilOut)
# def deletar_perfil(perfil_id: int, db: Session = Depends(get_db)):
#     returned_perfil = perfil.delete(db, perfil_id)
#     if not returned_perfil:
#         raise HTTPException(status_code=404, detail="Perfil não encontrado")
#     return returned_perfil
