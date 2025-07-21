from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from schemas.registro_hora import RegistroHoraCreate, RegistroHoraResponse, RegistroHoraUpdate
from services.registro_hora import (
    criar_registro_hora,
    listar_registros_horas,
    atualizar_registro_hora,
)
from database import get_db

router = APIRouter(prefix="/registro_horas", tags=["Registro de Horas"])


@router.post("/", response_model=RegistroHoraResponse)
def criar(registro: RegistroHoraCreate, db: Session = Depends(get_db)):
    return criar_registro_hora(db, registro)


@router.get("/", response_model=List[RegistroHoraResponse])
def listar(db: Session = Depends(get_db)):
    return listar_registros_horas(db)


@router.put("/{registro_id}", response_model=RegistroHoraResponse)
def atualizar(registro_id: int, registro: RegistroHoraUpdate, db: Session = Depends(get_db)):
    return atualizar_registro_hora(db, registro_id, registro)


# # app/routes/projeto.py
# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from typing import List
# from app.database import get_db
# from app.schemas.projeto import ProjetoOut, ProjetoCreate, ProjetoUpdate
# from app.services import projeto

# router = APIRouter(prefix="/projetos", tags=["Projetos"])

# @router.get("/", response_model=List[ProjetoOut])
# def listar_projetos(db: Session = Depends(get_db)):
#     return projeto.get_all(db)

# @router.get("/{projeto_id}", response_model=ProjetoOut)
# def obter_projeto(projeto_id: int, db: Session = Depends(get_db)):
#     result = projeto.get_by_id(db, projeto_id)
#     if not result:
#         raise HTTPException(status_code=404, detail="Projeto não encontrado")
#     return result

# @router.post("/", response_model=ProjetoOut)
# def criar_projeto(projeto_data: ProjetoCreate, db: Session = Depends(get_db)):
#     return projeto.create(db, projeto_data)

# @router.put("/{projeto_id}")
# def update_projeto(projeto_id: int, projeto_update: ProjetoUpdate, db: Session = Depends(get_db)):
# #def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
#     print(projeto_update)
#     #precisa se projeto.Projeto pq o service esta definido com projeto
#     projeto_db = db.query(projeto.Projeto).filter(projeto.Projeto.id == projeto_id).first()
#     if not projeto_db:
#         raise HTTPException(status_code=404, detail="Usuário não encontrado")

#     if projeto_update.nome is not None:
#         projeto_db.nome = projeto_update.nome
#     if projeto_update.descricao is not None:
#         projeto_db.descricao = projeto_update.descricao
#     if projeto_update.is_active is not None:
#         projeto_db.is_active = projeto_update.is_active

#     db.commit()
#     db.refresh(projeto_db)

#     return {
#         "id": projeto_db.id,
#         "nome": projeto_db.nome,
#         "descricao": projeto_db.descricao,
#         "is_active": projeto_db.is_active
#     }

# @router.delete("/{projeto_id}", response_model=ProjetoOut)
# def deletar_projeto(projeto_id: int, db: Session = Depends(get_db)):
#     result = projeto.delete(db, projeto_id)
#     if not result:
#         raise HTTPException(status_code=404, detail="Projeto não encontrado")
#     return result
