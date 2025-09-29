# routes/cliente.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteOut, ClienteUpdate
from app.services import cliente as cliente_service

router = APIRouter()

@router.post("/", response_model=ClienteOut)
def create_cliente(payload: ClienteCreate, db: Session = Depends(get_db)):
    print('create cliente')
    return cliente_service.create_cliente(db, payload)

@router.get("/", response_model=list[ClienteOut])
def get_clientes(db: Session = Depends(get_db)):
    print('get clientes')
    cliente = db.query(Cliente).first()
    print('lista clientes',cliente)
    return cliente_service.get_clientes(db)

@router.put("/{cliente_id}")
def update_cliente(cliente_id: int, payload: ClienteUpdate, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    # Mesma pegada do update de usuários: ajusta só o que veio
    data = payload.model_dump(exclude_unset=True)
    if "nome" in data:
        cliente.nome = data["nome"]
    if "is_active" in data:
        cliente.is_active = data["is_active"]

    db.commit()
    db.refresh(cliente)
    return cliente

@router.delete("/{cliente_id}")
def delete_cliente(cliente_id: int, db: Session = Depends(get_db)):
    obj = cliente_service.delete(db, cliente_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return obj
