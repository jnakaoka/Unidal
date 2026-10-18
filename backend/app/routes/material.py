from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.material import Material, MaterialTamanho, MovimentoEstoque, PedidoMaterial, PedidoMaterialItem
from app.models.user import User
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialOut, MovimentoEstoqueCreate, AjusteEstoqueCreate, PedidoCreate, PedidoOut, AtenderItem, ConcluirPedido, MovimentoEstoqueOut

router = APIRouter()

def _admin(u: User) -> bool: return bool(u.perfil and u.perfil.nome.lower() in {"admin", "administrador"})
def _funcao(u: User, codigo: str) -> bool: return any(f.is_active and f.codigo == codigo for f in (u.funcoes or []))
def _chefe(u: User) -> bool: return _funcao(u, "CHEFE_EQUIPE")
def _estaleiro(u: User) -> bool: return _funcao(u, "RESPONSAVEL_ESTALEIRO")
def _pode_ver(u: User) -> bool: return _admin(u) or _chefe(u) or _estaleiro(u)
def _pode_gerir(u: User) -> bool: return _admin(u) or _estaleiro(u)

def _variante(db: Session, material: Material, tamanho: str | None, lock=False):
    if not material.controla_tamanho:
        return None
    tamanho = (tamanho or "").strip()
    if not tamanho: raise HTTPException(400, f"Informe o tamanho de {material.nome}.")
    q = db.query(MaterialTamanho).filter(MaterialTamanho.material_id == material.id, MaterialTamanho.tamanho == tamanho)
    if lock: q = q.with_for_update()
    variante = q.first()
    if not variante: raise HTTPException(400, f"Tamanho {tamanho} não cadastrado para {material.nome}.")
    return variante

@router.get("/catalogo", response_model=list[MaterialOut])
def catalogo(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _pode_ver(current_user): raise HTTPException(403, "Sem acesso ao armazém.")
    materiais = db.query(Material).options(joinedload(Material.tamanhos)).filter(Material.is_active.is_(True)).order_by(Material.nome).all()
    reservas = db.query(PedidoMaterialItem.material_solicitado_id, PedidoMaterialItem.tamanho_solicitado, func.coalesce(func.sum(PedidoMaterialItem.quantidade_solicitada - PedidoMaterialItem.quantidade_enviada), 0)).join(PedidoMaterial).filter(PedidoMaterial.status != "CONCLUIDO").group_by(PedidoMaterialItem.material_solicitado_id, PedidoMaterialItem.tamanho_solicitado).all()
    reserva_map = {(mid, tam): Decimal(qtd) for mid, tam, qtd in reservas}
    for material in materiais:
        if material.controla_tamanho:
            total_fisico = total_reservado = Decimal("0")
            for v in material.tamanhos:
                reservado = max(Decimal("0"), reserva_map.get((material.id, v.tamanho), Decimal("0")))
                v.estoque_reservado = reservado
                v.estoque_disponivel = max(Decimal("0"), Decimal(v.estoque_fisico) - reservado)
                total_fisico += Decimal(v.estoque_fisico); total_reservado += reservado
            material.estoque_fisico = total_fisico
            material.estoque_reservado = total_reservado
            material.estoque_disponivel = max(Decimal("0"), total_fisico - total_reservado)
        else:
            reservado = max(Decimal("0"), reserva_map.get((material.id, None), Decimal("0")))
            material.estoque_reservado = reservado
            material.estoque_disponivel = max(Decimal("0"), Decimal(material.estoque_fisico) - reservado)
    return materiais

@router.post("/catalogo", response_model=MaterialOut)
def criar_material(payload: MaterialCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not _pode_gerir(current_user): raise HTTPException(403, "Sem permissão para gerir materiais.")
    nome = payload.nome.strip()
    if db.query(Material).filter(Material.nome == nome).first(): raise HTTPException(409, "Material já cadastrado.")
    material = Material(nome=nome, unidade=payload.unidade.strip(), estoque_fisico=0 if payload.controla_tamanho else payload.estoque_inicial, estoque_minimo=payload.estoque_minimo, controla_tamanho=payload.controla_tamanho)
    db.add(material); db.flush()
    if payload.controla_tamanho:
        vistos=set()
        for t in payload.tamanhos:
            tam=t.tamanho.strip()
            if tam.lower() in vistos: raise HTTPException(400, f"Tamanho duplicado: {tam}.")
            vistos.add(tam.lower())
            db.add(MaterialTamanho(material_id=material.id,tamanho=tam,estoque_fisico=t.estoque_inicial,estoque_minimo=t.estoque_minimo))
            if t.estoque_inicial > 0: db.add(MovimentoEstoque(material_id=material.id,usuario_id=current_user.id,tipo="ENTRADA",quantidade=t.estoque_inicial,tamanho=tam,observacao="Estoque inicial"))
    elif payload.estoque_inicial > 0:
        db.add(MovimentoEstoque(material_id=material.id, usuario_id=current_user.id, tipo="ENTRADA", quantidade=payload.estoque_inicial, observacao="Estoque inicial"))
    db.commit(); db.refresh(material); return material

@router.put("/catalogo/{material_id}", response_model=MaterialOut)
def editar_material(material_id:int,payload:MaterialUpdate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    if not _pode_gerir(current_user): raise HTTPException(403,"Sem permissão para gerir materiais.")
    material=db.query(Material).filter(Material.id==material_id).first()
    if not material: raise HTTPException(404,"Material não encontrado.")
    if payload.nome is not None:
        nome=payload.nome.strip(); duplicado=db.query(Material).filter(Material.nome==nome,Material.id!=material_id).first()
        if duplicado: raise HTTPException(409,"Já existe outro material com este nome.")
        material.nome=nome
    if payload.unidade is not None: material.unidade=payload.unidade.strip()
    if payload.estoque_minimo is not None: material.estoque_minimo=payload.estoque_minimo
    if payload.is_active is not None: material.is_active=payload.is_active
    db.commit(); db.refresh(material); return material

@router.post("/catalogo/{material_id}/entrada", response_model=MaterialOut)
def entrada_estoque(material_id:int,payload:MovimentoEstoqueCreate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    if not _pode_gerir(current_user): raise HTTPException(403,"Sem permissão para gerir estoque.")
    material=db.query(Material).filter(Material.id==material_id,Material.is_active.is_(True)).with_for_update().first()
    if not material: raise HTTPException(404,"Material não encontrado ou inativo.")
    variante=_variante(db,material,payload.tamanho,True)
    alvo=variante or material; alvo.estoque_fisico=Decimal(alvo.estoque_fisico)+payload.quantidade
    db.add(MovimentoEstoque(material_id=material.id,usuario_id=current_user.id,tipo="ENTRADA",quantidade=payload.quantidade,tamanho=variante.tamanho if variante else None,observacao=(payload.observacao or "").strip() or "Entrada de estoque"))
    db.commit(); db.refresh(material); return material

@router.post("/catalogo/{material_id}/ajuste", response_model=MaterialOut)
def ajustar_estoque(material_id:int,payload:AjusteEstoqueCreate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    if not _pode_gerir(current_user): raise HTTPException(403,"Sem permissão para gerir estoque.")
    material=db.query(Material).filter(Material.id==material_id).with_for_update().first()
    if not material: raise HTTPException(404,"Material não encontrado.")
    variante=_variante(db,material,payload.tamanho,True); alvo=variante or material
    anterior=Decimal(alvo.estoque_fisico); novo=payload.estoque_fisico; diferenca=novo-anterior; alvo.estoque_fisico=novo
    if diferenca!=0: db.add(MovimentoEstoque(material_id=material.id,usuario_id=current_user.id,tipo="AJUSTE_ENTRADA" if diferenca>0 else "AJUSTE_SAIDA",quantidade=abs(diferenca),tamanho=variante.tamanho if variante else None,observacao=f"Ajuste de inventário: {payload.motivo.strip()} (anterior: {anterior}; novo: {novo})"))
    db.commit(); db.refresh(material); return material

@router.get("/pedidos",response_model=list[PedidoOut])
def listar_pedidos(db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    if not _pode_ver(current_user): raise HTTPException(403,"Sem acesso aos pedidos.")
    q=db.query(PedidoMaterial).options(joinedload(PedidoMaterial.itens))
    if not (_admin(current_user) or _estaleiro(current_user)): q=q.filter(PedidoMaterial.solicitante_id==current_user.id)
    return q.order_by(PedidoMaterial.id.desc()).all()

@router.post("/pedidos",response_model=PedidoOut)
def criar_pedido(payload:PedidoCreate,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    if not (_admin(current_user) or _chefe(current_user)): raise HTTPException(403,"Apenas chefe de equipa ou admin pode solicitar materiais.")
    ids={i.material_id for i in payload.itens}; materiais={m.id:m for m in db.query(Material).options(joinedload(Material.tamanhos)).filter(Material.id.in_(ids),Material.is_active.is_(True)).all()}
    if len(materiais)!=len(ids): raise HTTPException(400,"Há material inválido ou inativo no pedido.")
    pedido=PedidoMaterial(solicitante_id=current_user.id,observacao=payload.observacao); db.add(pedido); db.flush()
    for item in payload.itens:
        material=materiais[item.material_id]; variante=_variante(db,material,item.tamanho)
        pedido.itens.append(PedidoMaterialItem(material_solicitado_id=item.material_id,tamanho_solicitado=variante.tamanho if variante else None,quantidade_solicitada=item.quantidade,quantidade_enviada=0))
    db.commit(); db.refresh(pedido); return pedido

@router.put("/pedidos/{pedido_id}/itens/{item_id}",response_model=PedidoOut)
def atender_item(pedido_id:int,item_id:int,payload:AtenderItem,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    if not _pode_gerir(current_user): raise HTTPException(403,"Sem permissão para preparar pedidos.")
    pedido=db.query(PedidoMaterial).options(joinedload(PedidoMaterial.itens)).filter(PedidoMaterial.id==pedido_id).first()
    if not pedido: raise HTTPException(404,"Pedido não encontrado.")
    if pedido.status=="CONCLUIDO": raise HTTPException(409,"Pedido já concluído.")
    item=next((i for i in pedido.itens if i.id==item_id),None)
    if not item: raise HTTPException(404,"Item não encontrado.")
    material_id=payload.material_enviado_id or item.material_solicitado_id
    if payload.quantidade_enviada>item.quantidade_solicitada: raise HTTPException(400,"Quantidade enviada não pode superar a solicitada.")
    if material_id!=item.material_solicitado_id and not (payload.motivo_substituicao or "").strip(): raise HTTPException(400,"Informe o motivo da substituição.")
    material=db.query(Material).filter(Material.id==material_id,Material.is_active.is_(True)).with_for_update().first()
    if not material: raise HTTPException(400,"Material de envio inválido.")
    tamanho_novo=payload.tamanho_enviado if material.controla_tamanho else None
    if material_id==item.material_solicitado_id and material.controla_tamanho and not tamanho_novo: tamanho_novo=item.tamanho_solicitado
    variante_nova=_variante(db,material,tamanho_novo,True)
    anterior=Decimal(item.quantidade_enviada or 0)
    material_anterior_id=item.material_enviado_id or item.material_solicitado_id; tamanho_anterior=item.tamanho_enviado or item.tamanho_solicitado
    mesmo=material_id==material_anterior_id and tamanho_novo==tamanho_anterior
    if mesmo:
        alvo=variante_nova or material; delta=payload.quantidade_enviada-anterior
        if delta>0 and Decimal(alvo.estoque_fisico)<delta: raise HTTPException(409,"Estoque insuficiente.")
        alvo.estoque_fisico=Decimal(alvo.estoque_fisico)-delta
        if delta!=0: db.add(MovimentoEstoque(material_id=material_id,pedido_id=pedido.id,usuario_id=current_user.id,tipo="SAIDA" if delta>0 else "ESTORNO",quantidade=abs(delta),tamanho=tamanho_novo,observacao=f"Atendimento do pedido #{pedido.id}"))
    else:
        if anterior>0:
            mat_ant=db.query(Material).filter(Material.id==material_anterior_id).with_for_update().first(); var_ant=_variante(db,mat_ant,tamanho_anterior,True) if mat_ant else None; alvo_ant=var_ant or mat_ant
            if alvo_ant: alvo_ant.estoque_fisico=Decimal(alvo_ant.estoque_fisico)+anterior; db.add(MovimentoEstoque(material_id=material_anterior_id,pedido_id=pedido.id,usuario_id=current_user.id,tipo="ESTORNO",quantidade=anterior,tamanho=tamanho_anterior,observacao=f"Troca no pedido #{pedido.id}"))
        alvo=variante_nova or material
        if Decimal(alvo.estoque_fisico)<payload.quantidade_enviada: raise HTTPException(409,"Estoque insuficiente.")
        alvo.estoque_fisico=Decimal(alvo.estoque_fisico)-payload.quantidade_enviada
        if payload.quantidade_enviada>0: db.add(MovimentoEstoque(material_id=material_id,pedido_id=pedido.id,usuario_id=current_user.id,tipo="SAIDA",quantidade=payload.quantidade_enviada,tamanho=tamanho_novo,observacao=f"Atendimento do pedido #{pedido.id}"))
    item.material_enviado_id=material_id; item.tamanho_enviado=tamanho_novo; item.quantidade_enviada=payload.quantidade_enviada
    item.motivo_substituicao=payload.motivo_substituicao.strip() if material_id!=item.material_solicitado_id and payload.motivo_substituicao else None
    pedido.status="EM_PREPARACAO"; db.commit(); db.refresh(pedido); return pedido

@router.post("/pedidos/{pedido_id}/concluir",response_model=PedidoOut)
def concluir(pedido_id:int,payload:ConcluirPedido,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    if not _pode_gerir(current_user): raise HTTPException(403,"Sem permissão para concluir pedidos.")
    pedido=db.query(PedidoMaterial).options(joinedload(PedidoMaterial.itens)).filter(PedidoMaterial.id==pedido_id).first()
    if not pedido: raise HTTPException(404,"Pedido não encontrado.")
    parcial=any(Decimal(i.quantidade_enviada or 0)<Decimal(i.quantidade_solicitada) for i in pedido.itens)
    if parcial and not (payload.motivo_parcial or "").strip(): raise HTTPException(400,"Informe o motivo para concluir um pedido parcial.")
    pedido.status="CONCLUIDO"; pedido.resultado="PARCIAL" if parcial else "TOTAL"; pedido.motivo_conclusao_parcial=payload.motivo_parcial.strip() if parcial else None
    db.commit(); db.refresh(pedido); return pedido

@router.get("/movimentos",response_model=list[MovimentoEstoqueOut])
def listar_movimentos(material_id:int|None=None,limite:int=100,db:Session=Depends(get_db),current_user:User=Depends(get_current_user)):
    if not _pode_gerir(current_user): raise HTTPException(403,"Sem permissão para consultar movimentações.")
    limite=max(1,min(limite,500)); q=db.query(MovimentoEstoque,User.name.label("usuario_nome")).join(User,User.id==MovimentoEstoque.usuario_id)
    if material_id is not None: q=q.filter(MovimentoEstoque.material_id==material_id)
    rows=q.order_by(MovimentoEstoque.id.desc()).limit(limite).all(); saida=[]
    for movimento,usuario_nome in rows: movimento.usuario_nome=usuario_nome; saida.append(movimento)
    return saida
