import os
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.documento import CategoriaDocumento, Documento, DocumentoVersao
from app.models.perfil import Perfil
from app.models.user import User
from app.schemas.documento import CategoriaInput

router = APIRouter(prefix="/documentos", tags=["Documentos"])
EXTENSOES = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx"}


def pasta():
    return Path(os.getenv("DOCUMENTOS_DIR", "/app/data/documentos"))


def pode_aceder(categoria, user):
    if not user.is_active:
        return False
    return (user.perfil.nome.lower() == "admin" or categoria.visibilidade == "todos"
            or categoria.visibilidade == "perfis" and user.perfil_id in categoria.perfil_ids
            or categoria.visibilidade == "usuarios" and user.id in categoria.usuario_ids)


def categoria_autorizada(db, categoria_id, user):
    c = db.get(CategoriaDocumento, categoria_id)
    if not c or not pode_aceder(c, user):
        raise HTTPException(404, "Categoria não encontrada.")
    return c


def admin_ativo(user=Depends(require_role("admin"))):
    if not user.is_active:
        raise HTTPException(403, "Utilizador inativo.")
    return user


def validar_destinatarios(db, dados):
    for model, ids in ((Perfil, dados.perfil_ids), (User, dados.usuario_ids)):
        if ids and db.query(model).filter(model.id.in_(ids), model.is_active.is_(True)).count() != len(ids):
            raise HTTPException(422, "Existe um destinatário inválido ou inativo.")
    if db.query(CategoriaDocumento).filter(CategoriaDocumento.nome == dados.nome).first():
        raise HTTPException(409, "Já existe uma categoria com este nome.")


@router.get("/destinatarios")
def destinatarios(db: Session = Depends(get_db), user=Depends(admin_ativo)):
    return {"perfis": [{"id": p.id, "nome": p.nome} for p in db.query(Perfil).filter_by(is_active=True).all()],
            "usuarios": [{"id": u.id, "nome": u.name} for u in db.query(User).filter_by(is_active=True).order_by(User.name).all()]}


@router.get("/categorias")
def categorias(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return [c for c in db.query(CategoriaDocumento).order_by(CategoriaDocumento.nome).all() if pode_aceder(c, user)]


@router.post("/categorias", status_code=201)
def criar_categoria(dados: CategoriaInput, db: Session = Depends(get_db), user=Depends(admin_ativo)):
    validar_destinatarios(db, dados)
    c = CategoriaDocumento(**dados.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/categorias/{categoria_id}")
def editar_categoria(categoria_id: int, dados: CategoriaInput, db: Session = Depends(get_db), user=Depends(admin_ativo)):
    c = categoria_autorizada(db, categoria_id, user)
    for model, ids in ((Perfil, dados.perfil_ids), (User, dados.usuario_ids)):
        if ids and db.query(model).filter(model.id.in_(ids), model.is_active.is_(True)).count() != len(ids):
            raise HTTPException(422, "Existe um destinatário inválido ou inativo.")
    if db.query(CategoriaDocumento).filter(CategoriaDocumento.nome == dados.nome, CategoriaDocumento.id != c.id).first():
        raise HTTPException(409, "Já existe uma categoria com este nome.")
    for key, value in dados.model_dump().items():
        setattr(c, key, value)
    db.commit()
    db.refresh(c)
    return c


@router.get("/")
def documentos(db: Session = Depends(get_db), user=Depends(get_current_user)):
    ids = [c.id for c in db.query(CategoriaDocumento).all() if pode_aceder(c, user)]
    result = []
    for doc in db.query(Documento).filter(Documento.categoria_id.in_(ids), Documento.arquivado.is_(False)).order_by(Documento.titulo).all():
        v = db.query(DocumentoVersao).filter_by(documento_id=doc.id).order_by(DocumentoVersao.id.desc()).first()
        result.append({"id": doc.id, "titulo": doc.titulo, "descricao": doc.descricao,
                       "categoria_id": doc.categoria_id, "versao_id": v.id, "nome_original": v.nome_original,
                       "tamanho": v.tamanho, "criado_em": v.criado_em})
    return result


def guardar_versao(db, doc, ficheiro, user):
    nome = Path((ficheiro.filename or "").replace("\\", "/")).name
    ext = Path(nome).suffix.lower()
    if ext not in EXTENSOES or len(nome) > 255:
        raise HTTPException(422, "Formato não permitido. Utilize PDF, imagem, Word ou Excel.")
    chave = uuid4().hex + ext
    pasta().mkdir(parents=True, exist_ok=True)
    destino = pasta() / chave
    tamanho = 0
    limite = int(os.getenv("DOCUMENTOS_MAX_MB", "20")) * 1024 * 1024
    try:
        with destino.open("xb") as stream:
            while chunk := ficheiro.file.read(1024 * 1024):
                tamanho += len(chunk)
                if tamanho > limite:
                    raise HTTPException(413, "Ficheiro acima do limite de tamanho.")
                stream.write(chunk)
        if not tamanho:
            raise HTTPException(422, "Ficheiro vazio.")
        db.flush()
        v = DocumentoVersao(documento_id=doc.id, nome_original=nome, chave=chave, tamanho=tamanho, criado_por=user.id)
        db.add(v)
        db.commit()
        db.refresh(v)
        return {"id": doc.id, "versao_id": v.id}
    except Exception:
        db.rollback()
        destino.unlink(missing_ok=True)
        raise
    finally:
        ficheiro.file.close()


@router.post("/", status_code=201)
def publicar(titulo: str = Form(..., min_length=1, max_length=200), categoria_id: int = Form(...),
             descricao: str = Form("", max_length=10000), ficheiro: UploadFile = File(...),
             db: Session = Depends(get_db), user=Depends(admin_ativo)):
    categoria_autorizada(db, categoria_id, user)
    if not titulo.strip():
        raise HTTPException(422, "Informe o título.")
    doc = Documento(titulo=titulo.strip(), descricao=descricao, categoria_id=categoria_id)
    db.add(doc)
    return guardar_versao(db, doc, ficheiro, user)


def documento_autorizado(db, documento_id, user):
    doc = db.get(Documento, documento_id)
    if not doc or doc.arquivado:
        raise HTTPException(404, "Documento não encontrado.")
    categoria_autorizada(db, doc.categoria_id, user)
    return doc


@router.post("/{documento_id}/versoes", status_code=201)
def nova_versao(documento_id: int, ficheiro: UploadFile = File(...), db: Session = Depends(get_db), user=Depends(admin_ativo)):
    doc = documento_autorizado(db, documento_id, user)
    return guardar_versao(db, doc, ficheiro, user)


@router.get("/{documento_id}/versoes")
def versoes(documento_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    documento_autorizado(db, documento_id, user)
    return [{"id": v.id, "nome_original": v.nome_original, "tamanho": v.tamanho, "criado_em": v.criado_em}
            for v in db.query(DocumentoVersao).filter_by(documento_id=documento_id).order_by(DocumentoVersao.id.desc()).all()]


@router.get("/{documento_id}/download")
def download(documento_id: int, versao_id: int | None = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    documento_autorizado(db, documento_id, user)
    q = db.query(DocumentoVersao).filter_by(documento_id=documento_id)
    if versao_id is not None:
        q = q.filter_by(id=versao_id)
    v = q.order_by(DocumentoVersao.id.desc()).first()
    if not v or not (pasta() / v.chave).is_file():
        raise HTTPException(404, "Ficheiro não encontrado.")
    return FileResponse(pasta() / v.chave, filename=v.nome_original, media_type="application/octet-stream",
                        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})


@router.delete("/{documento_id}")
def arquivar(documento_id: int, db: Session = Depends(get_db), user=Depends(admin_ativo)):
    doc = documento_autorizado(db, documento_id, user)
    doc.arquivado = True
    db.commit()
    return {"ok": True}
