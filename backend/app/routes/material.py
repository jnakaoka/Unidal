from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.funcao import Funcao
from app.models.material import Material, MovimentoEstoque, PedidoMaterial, PedidoMaterialItem
from app.models.user import User
from app.schemas.material import MaterialCreate, MaterialOut, PedidoCreate, PedidoOut, AtenderItem, ConcluirPedido

router = APIRouter()

def _admin(u: User) -> bool:
    return bool(u.perfil and u.perfil.nome.lower() in {"admin", "administrador"})

def _funcao(u: User, codigo: str) -> bool:
    return any(f.is_active and f.codigo == codigo for f in (u.funcoes or []))

def _chefe(u: User) -> bool:
    return _funcao(u, "CHEFE_EQUIPE")

def _estaleiro(u: User) -> bool:
    return _funcao(u, "RESPONSAVEL_ESTALEIRO")

def _pode_ver(u: User) -> bool:
    return _admin(u) or _chefe(u) or _estaleiro(u)

def _pode_gerir(u: User) -> bool:
    return _admin(u) or _estaleiro(u)

@router.get("/catalogo", response_model=list[MaterialOut])
def catalogo(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _pode_ver(current_user): raise HTTPException(403, "Sem acesso ao estaleiro.")
    return db.query(Material).filter(Material.is_active.is_(True)).order_by(Material.nome).all()

@router.post("/catalogo", response_model=MaterialOut)
def criar_material(payload: MaterialCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _pode_gerir(current_user): raise HTTPException(403, "Sem permissão para gerir materiais.")
    nome = payload.nome.strip()
    if db.query(Material).filter(Material.nome == nome).first(): raise HTTPException(409, "Material já cadastrado.")
    material = Material(nome=nome, unidade=payload.unidade.strip(), estoque_fisico=payload.estoque_inicial, estoque_minimo=payload.estoque_minimo)
    db.add(material); db.flush()
    if payload.estoque_inicial > 0:
        db.add(MovimentoEstoque(material_id=material.id, usuario_id=current_user.id, tipo="ENTRADA", quantidade=payload.estoque_inicial, observacao="Estoque inicial"))
    db.commit(); db.refresh(material); return material

@router.get("/pedidos", response_model=list[PedidoOut])
def listar_pedidos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _pode_ver(current_user): raise HTTPException(403, "Sem acesso aos pedidos.")
    q = db.query(PedidoMaterial).options(joinedload(PedidoMaterial.itens))
    if not (_admin(current_user) or _estaleiro(current_user)):
        q = q.filter(PedidoMaterial.solicitante_id == current_user.id)
    return q.order_by(PedidoMaterial.id.desc()).all()

@router.post("/pedidos", response_model=PedidoOut)
def criar_pedido(payload: PedidoCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not (_admin(current_user) or _chefe(current_user)): raise HTTPException(403, "Apenas chefe de equipa ou admin pode solicitar materiais.")
    ids = {i.material_id for i in payload.itens}
    materiais = {m.id: m for m in db.query(Material).filter(Material.id.in_(ids), Material.is_active.is_(True)).all()}
    if len(materiais) != len(ids): raise HTTPException(400, "Há material inválido ou inativo no pedido.")
    pedido = PedidoMaterial(solicitante_id=current_user.id, observacao=payload.observacao)
    db.add(pedido); db.flush()
    for item in payload.itens:
        pedido.itens.append(PedidoMaterialItem(material_solicitado_id=item.material_id, quantidade_solicitada=item.quantidade, quantidade_enviada=0))
    db.commit(); db.refresh(pedido); return pedido

@router.put("/pedidos/{pedido_id}/itens/{item_id}", response_model=PedidoOut)
def atender_item(pedido_id: int, item_id: int, payload: AtenderItem, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _pode_gerir(current_user): raise HTTPException(403, "Sem permissão para preparar pedidos.")
    pedido = db.query(PedidoMaterial).options(joinedload(PedidoMaterial.itens)).filter(PedidoMaterial.id == pedido_id).first()
    if not pedido: raise HTTPException(404, "Pedido não encontrado.")
    if pedido.status == "CONCLUIDO": raise HTTPException(409, "Pedido já concluído.")
    item = next((i for i in pedido.itens if i.id == item_id), None)
    if not item: raise HTTPException(404, "Item não encontrado.")
    material_id = payload.material_enviado_id or item.material_solicitado_id
    material = db.query(Material).filter(Material.id == material_id, Material.is_active.is_(True)).with_for_update().first()
    if not material: raise HTTPException(400, "Material de envio inválido.")
    if payload.quantidade_enviada > item.quantidade_solicitada: raise HTTPException(400, "Quantidade enviada não pode superar a solicitada.")
    if material_id != item.material_solicitado_id and not (payload.motivo_substituicao or "").strip(): raise HTTPException(400, "Informe o motivo da substituição.")
    anterior = Decimal(item.quantidade_enviada or 0)
    delta = payload.quantidade_enviada - anterior
    if delta > 0 and Decimal(material.estoque_fisico) < delta: raise HTTPException(409, "Estoque insuficiente.")
    material.estoque_fisico = Decimal(material.estoque_fisico) - delta
    item.material_enviado_id = material_id
    item.quantidade_enviada = payload.quantidade_enviada
    item.motivo_substituicao = payload.motivo_substituicao.strip() if payload.motivo_substituicao else None
    if delta != 0:
        db.add(MovimentoEstoque(material_id=material_id, pedido_id=pedido.id, usuario_id=current_user.id, tipo="SAIDA" if delta > 0 else "ESTORNO", quantidade=abs(delta), observacao=f"Atendimento do pedido #{pedido.id}"))
    pedido.status = "EM_PREPARACAO"
    db.commit(); db.refresh(pedido); return pedido

@router.post("/pedidos/{pedido_id}/concluir", response_model=PedidoOut)
def concluir(pedido_id: int, payload: ConcluirPedido, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _pode_gerir(current_user): raise HTTPException(403, "Sem permissão para concluir pedidos.")
    pedido = db.query(PedidoMaterial).options(joinedload(PedidoMaterial.itens)).filter(PedidoMaterial.id == pedido_id).first()
    if not pedido: raise HTTPException(404, "Pedido não encontrado.")
    parcial = any(Decimal(i.quantidade_enviada or 0) < Decimal(i.quantidade_solicitada) for i in pedido.itens)
    if parcial and not (payload.motivo_parcial or "").strip(): raise HTTPException(400, "Informe o motivo para concluir um pedido parcial.")
    pedido.status = "CONCLUIDO"
    pedido.resultado = "PARCIAL" if parcial else "TOTAL"
    pedido.motivo_conclusao_parcial = payload.motivo_parcial.strip() if parcial else None
    db.commit(); db.refresh(pedido); return pedido
