# app/routes/registro_hora.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.registro_hora import RegistroHoraOut, RegistroHoraCreate, RegistroHoraUpdate
from app.services import registro_hora
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.projeto import Projeto
from app.models.registro_hora import RegistroHora

router = APIRouter(prefix="/registros-horas", tags=["Registro de Horas"])

@router.get("/", response_model=List[RegistroHoraOut])
def listar_registros(db: Session = Depends(get_db)):
    #return registro_hora.get_all(db)
    registros = db.query(RegistroHora).all()
    resposta = []

    for reg in registros:
        resposta.append(RegistroHoraOut(
            id=reg.id,
            horas=reg.horas,
            data=reg.data,
            projeto_id=reg.projeto_id,
            usuario_id=reg.usuario_id,
            projeto_nome=reg.projeto.nome if reg.projeto else "",
            usuario_nome=reg.usuario.name if reg.usuario else ""
        ))

    return resposta

@router.get("/{registro_id}", response_model=RegistroHoraOut)
def obter_registro(registro_id: int, db: Session = Depends(get_db)):
    result = registro_hora.get_by_id(db, registro_id)
    if not result:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return result

# @router.post("/", response_model=RegistroHoraOut)
# # def criar_registro(registro_data: RegistroHoraCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
# def criar_registro(registro_data: RegistroHoraCreate, db: Session = Depends(get_db)):
#     #registro_data.usuario_id = current_user.id
#     print(registro_data)
#     return registro_hora.create(db, registro_data)

@router.post("/", response_model=RegistroHoraOut)
#def criar_registro(dados: RegistroHoraCreate, db: Session = Depends(get_db), usuario=Depends(get_current_user)):
def criar_registro(dados: RegistroHoraCreate, db: Session = Depends(get_db)):
    novo_registro = registro_hora.RegistroHora(
        usuario_id=dados.usuario_id,
        projeto_id=dados.projeto_id,
        data=dados.data,
        horas=dados.horas
    )
    db.add(novo_registro)
    db.commit()
    db.refresh(novo_registro)

    projeto = db.query(Projeto).filter(Projeto.id == novo_registro.projeto_id).first()
    usuario_obj = db.query(User).filter(User.id == novo_registro.usuario_id).first()

    return {
        "id": novo_registro.id,
        "usuario_id": novo_registro.usuario_id,
        "projeto_id": novo_registro.projeto_id,
        "data": novo_registro.data,
        "horas": novo_registro.horas,
        "projeto_nome": projeto.nome if projeto else "",
        "usuario_nome": usuario_obj.name if usuario_obj else "",
    }

@router.put("/{registro_hora_id}")
def update_registro(registro_hora_id: int, registro_hora_update: RegistroHoraUpdate, db: Session = Depends(get_db)):
#def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user = Depends(require_role("admin"))):
    print(registro_hora_update)
    registro_hora_db = db.query(registro_hora.RegistroHora).filter(registro_hora.RegistroHora.id == registro_hora_id).first()
    if not registro_hora_db:
        raise HTTPException(status_code=404, detail="registro não encontrado")

    if registro_hora_update.usuario_id is not None:
        registro_hora_db.usuario_id = registro_hora_update.usuario_id
    if registro_hora_update.projeto_id is not None:
        registro_hora_db.projeto_id = registro_hora_update.projeto_id
    if registro_hora_update.data is not None:
        registro_hora_db.data = registro_hora_update.data
    if registro_hora_update.horas is not None:
        registro_hora_db.horas = registro_hora_update.horas

    db.commit()
    db.refresh(registro_hora_db)

    projeto = db.query(Projeto).filter(Projeto.id == registro_hora_db.projeto_id).first()
    usuario = db.query(User).filter(User.id == registro_hora_db.usuario_id).first()

    return {
        "id": registro_hora_db.id,
        "usuario_id": registro_hora_db.usuario_id,
        "projeto_id": registro_hora_db.projeto_id,
        "data": registro_hora_db.data,
        # "data": registro_hora_db.projeto.nome,
        "horas": registro_hora_db.horas,
        "projeto_nome": projeto.nome if projeto else "",
        "usuario_nome": usuario.name if usuario else "",
    }

@router.delete("/{registro_id}", response_model=RegistroHoraOut)
def deletar_registro(registro_id: int, db: Session = Depends(get_db)):
    registro = db.query(RegistroHora).filter(RegistroHora.id == registro_id).first()
    if not registro:
        return None
    db.delete(registro)
    db.commit()
    return registro
    
    # result = registro_hora.delete(db, registro_id)
    # if not result:
    #     raise HTTPException(status_code=404, detail="Registro não encontrado")
    # return result
