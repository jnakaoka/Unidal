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

def headers(client, user_or_email):
    email = user_or_email.email if isinstance(user_or_email, User) else user_or_email
    r = client.post("/auth/login/", data={"username": email, "password": "Teste123!"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}

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


def test_entrada_soma_estoque_sem_duplicar_material(client, db):
    est=user(db,"entrada@t.pt",funcao="RESPONSAVEL_ESTALEIRO")
    h=headers(client,est)
    m=client.post("/materiais/catalogo",json={"nome":"Luvas","unidade":"par","estoque_inicial":20,"estoque_minimo":10},headers=h).json()
    r=client.post(f"/materiais/catalogo/{m['id']}/entrada",json={"quantidade":30,"observacao":"Receção de fornecedor"},headers=h)
    assert r.status_code==200
    assert Decimal(str(r.json()["estoque_fisico"]))==Decimal("50")
    catalogo=client.get("/materiais/catalogo",headers=h).json()
    assert len([x for x in catalogo if x["nome"]=="Luvas"])==1

def test_edita_dados_sem_alterar_estoque_diretamente(client, db):
    est=user(db,"edita@t.pt",funcao="RESPONSAVEL_ESTALEIRO")
    h=headers(client,est)
    m=client.post("/materiais/catalogo",json={"nome":"Luva nitrilo","unidade":"cx","estoque_inicial":20,"estoque_minimo":5},headers=h).json()
    r=client.put(f"/materiais/catalogo/{m['id']}",json={"nome":"Luvas nitrilo","unidade":"caixa","estoque_minimo":8},headers=h)
    assert r.status_code==200
    assert Decimal(str(r.json()["estoque_fisico"]))==Decimal("20")
    assert r.json()["nome"]=="Luvas nitrilo"

def test_ajuste_estoque_exige_motivo(client, db):
    est=user(db,"ajuste@t.pt",funcao="RESPONSAVEL_ESTALEIRO")
    h=headers(client,est)
    m=client.post("/materiais/catalogo",json={"nome":"Capacete","estoque_inicial":12},headers=h).json()
    bad=client.post(f"/materiais/catalogo/{m['id']}/ajuste",json={"estoque_fisico":10,"motivo":""},headers=h)
    assert bad.status_code==422
    ok=client.post(f"/materiais/catalogo/{m['id']}/ajuste",json={"estoque_fisico":10,"motivo":"Contagem física"},headers=h)
    assert ok.status_code==200
    assert Decimal(str(ok.json()["estoque_fisico"]))==Decimal("10")


def test_troca_material_estorna_anterior_e_debita_novo(client, db):
    est=user(db,"troca@t.pt",funcao="RESPONSAVEL_ESTALEIRO"); chefe=user(db,"trocachefe@t.pt",funcao="CHEFE_EQUIPE")
    h=headers(client,est)
    a=client.post("/materiais/catalogo",json={"nome":"Material A","estoque_inicial":10},headers=h).json()
    b=client.post("/materiais/catalogo",json={"nome":"Material B","estoque_inicial":10},headers=h).json()
    p=client.post("/materiais/pedidos",json={"itens":[{"material_id":a["id"],"quantidade":4}]},headers=headers(client,chefe)).json()
    item=p["itens"][0]
    assert client.put(f"/materiais/pedidos/{p['id']}/itens/{item['id']}",json={"quantidade_enviada":4},headers=h).status_code==200
    r=client.put(f"/materiais/pedidos/{p['id']}/itens/{item['id']}",json={"quantidade_enviada":4,"material_enviado_id":b["id"],"motivo_substituicao":"Troca operacional"},headers=h)
    assert r.status_code==200
    cat={x["id"]:x for x in client.get("/materiais/catalogo",headers=h).json()}
    assert Decimal(str(cat[a["id"]]["estoque_fisico"]))==Decimal("10")
    assert Decimal(str(cat[b["id"]]["estoque_fisico"]))==Decimal("6")

def test_catalogo_mostra_reservado_e_disponivel(client, db):
    est=user(db,"reserva@t.pt",funcao="RESPONSAVEL_ESTALEIRO"); chefe=user(db,"reservachefe@t.pt",funcao="CHEFE_EQUIPE")
    h=headers(client,est)
    m=client.post("/materiais/catalogo",json={"nome":"Mascara","estoque_inicial":20},headers=h).json()
    client.post("/materiais/pedidos",json={"itens":[{"material_id":m["id"],"quantidade":7}]},headers=headers(client,chefe))
    cat=next(x for x in client.get("/materiais/catalogo",headers=h).json() if x["id"]==m["id"])
    assert Decimal(str(cat["estoque_reservado"]))==Decimal("7")
    assert Decimal(str(cat["estoque_disponivel"]))==Decimal("13")

def test_historico_movimentos(client, db):
    est=user(db,"historico@t.pt",funcao="RESPONSAVEL_ESTALEIRO"); h=headers(client,est)
    m=client.post("/materiais/catalogo",json={"nome":"Oculos","estoque_inicial":5},headers=h).json()
    client.post(f"/materiais/catalogo/{m['id']}/entrada",json={"quantidade":3,"observacao":"Reposicao"},headers=h)
    r=client.get(f"/materiais/movimentos?material_id={m['id']}",headers=h)
    assert r.status_code==200
    assert len(r.json())>=2
    assert r.json()[0]["usuario_nome"]=="historico@t.pt"
