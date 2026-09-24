from decimal import Decimal
from app.models.funcao import Funcao
from app.models.user import User
from app.models.perfil import Perfil
from app.utils.security import hash_password

def user(db, email, perfil="operador", funcao=None):
    p=db.query(Perfil).filter(Perfil.nome==perfil).first()
    if not p:
        p=Perfil(nome=perfil,is_active=True); db.add(p); db.flush()
    u=User(name=email,email=email,empresa="UNIDAL",hashed_password=hash_password("Teste123!"),perfil_id=p.id,is_active=True)
    if funcao:
        f=db.query(Funcao).filter(Funcao.codigo==funcao).first(); u.funcoes.append(f)
    db.add(u); db.commit(); db.refresh(u); return u

def headers(client,email):
    r=client.post("/auth/login/",data={"username":email,"password":"Teste123!"})
    return {"Authorization":f"Bearer {r.json()['access_token']}"}

def test_chefe_cria_pedido_e_ve_apenas_proprios(client,db):
    est=user(db,"est@t.pt",funcao="RESPONSAVEL_ESTALEIRO")
    chefe=user(db,"chefe@t.pt",funcao="CHEFE_EQUIPE")
    m=client.post("/materiais/catalogo",json={"nome":"Cimento","unidade":"saco","estoque_inicial":10,"estoque_minimo":2},headers=headers(client,est)).json()
    r=client.post("/materiais/pedidos",json={"itens":[{"material_id":m["id"],"quantidade":3}]},headers=headers(client,chefe))
    assert r.status_code==200
    assert len(client.get("/materiais/pedidos",headers=headers(client,chefe)).json())==1

def test_estaleiro_atende_e_conclui_total(client,db):
    est=user(db,"est2@t.pt",funcao="RESPONSAVEL_ESTALEIRO"); chefe=user(db,"chefe2@t.pt",funcao="CHEFE_EQUIPE")
    m=client.post("/materiais/catalogo",json={"nome":"Malha","unidade":"un","estoque_inicial":5},headers=headers(client,est)).json()
    p=client.post("/materiais/pedidos",json={"itens":[{"material_id":m["id"],"quantidade":2}]},headers=headers(client,chefe)).json()
    item=p["itens"][0]
    r=client.put(f"/materiais/pedidos/{p['id']}/itens/{item['id']}",json={"quantidade_enviada":2},headers=headers(client,est))
    assert r.status_code==200
    c=client.post(f"/materiais/pedidos/{p['id']}/concluir",json={},headers=headers(client,est))
    assert c.json()["resultado"]=="TOTAL"

def test_permite_concluir_parcial_com_motivo(client,db):
    est=user(db,"est3@t.pt",funcao="RESPONSAVEL_ESTALEIRO"); chefe=user(db,"chefe3@t.pt",funcao="CHEFE_EQUIPE")
    m=client.post("/materiais/catalogo",json={"nome":"Disco","estoque_inicial":1},headers=headers(client,est)).json()
    p=client.post("/materiais/pedidos",json={"itens":[{"material_id":m["id"],"quantidade":3}]},headers=headers(client,chefe)).json()
    item=p["itens"][0]
    client.put(f"/materiais/pedidos/{p['id']}/itens/{item['id']}",json={"quantidade_enviada":1},headers=headers(client,est))
    bad=client.post(f"/materiais/pedidos/{p['id']}/concluir",json={},headers=headers(client,est))
    assert bad.status_code==400
    ok=client.post(f"/materiais/pedidos/{p['id']}/concluir",json={"motivo_parcial":"Sem estoque"},headers=headers(client,est))
    assert ok.json()["resultado"]=="PARCIAL"

def test_operador_comum_nao_acessa(client,db):
    comum=user(db,"comum@t.pt")
    assert client.get("/materiais/catalogo",headers=headers(client,comum)).status_code==403
