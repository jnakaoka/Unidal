# routes/auth.py
from fastapi import APIRouter, Depends, Form, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from jose import JWTError
from app.services.auth import autenticar_usuario, criar_tokens
from app.dependencies.auth import get_db, get_current_user, require_role
from app.models import User
from app.schemas.token import Token
from app.utils.jwt import decode_access_token, create_access_token
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas.password import ChangeOwnPasswordInput, AdminResetPasswordInput
from app.utils.security import verify_password, hash_password
from app.utils.passwords import check_strength

#router = APIRouter()

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login/", response_model=Token)
async def login(
    request: Request,
    username: str = Form(None),
    password: str = Form(None),
    db: Session = Depends(get_db),
):
    """
    Compatível com:
     - application/x-www-form-urlencoded (OAuth2PasswordRequestForm style)
     - application/json with {"username":"...", "password":"..."} or {"email":...}
    """
    # Se o cliente enviou JSON, lê do body
    content_type = (request.headers.get("content-type") or "").lower()
    if content_type.startswith("application/json"):
        try:
            body = await request.json()
        except Exception:
            body = {}
        # aceita "username" ou "email"
        username = body.get("username") or body.get("email") or username
        password = body.get("password") or password

    # fallback: se veio via OAuth2PasswordRequestForm (caso use esse depends)
    if not username or not password:
        # devolve 422 para manter consistência com validação
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="username and password required",
        )

    usuario = autenticar_usuario(username, password)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")

    tokens = criar_tokens(usuario, usuario.perfil.nome)
    return tokens

# async def login(request: Request, username: str = Form(None), password: str = Form(None), db: Session = Depends(get_db)):
#     content_type = request.headers.get("content-type", "")
#     if content_type.startswith("application/json"):
#         body = await request.json()
#         username = body.get("username") or body.get("email")
#         password = body.get("password")
#     if not username or not password:
#         raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="username/password required")
#     usuario = autenticar_usuario(username, password)
#     if not usuario:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
#     tokens = criar_tokens(usuario, usuario.perfil.nome)
#     return tokens

# # def login(username: str = Form(...), password: str = Form(...), # db: Session = Depends(get_db)
# # ):
# def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
#     # usuario = autenticar_usuario(db, username, password)
#     print(form_data)
#     usuario = autenticar_usuario(form_data.username, form_data.password)
#     if not usuario:
#         raise HTTPException(status_code=401, detail="Credenciais inválidassss")

#     tokens = criar_tokens(usuario, usuario.perfil.nome)
#     return tokens

@router.post("/logout")
def logout():
    # Em sistemas baseados em JWT, o logout é geralmente tratado no frontend
    # ou implementado com blacklist de tokens no backend.
    return {"message": "Logout efetuado com sucesso"}

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str = Form(...)):
    try:
        payload = decode_access_token(refresh_token)
        email = payload.get("sub")
        perfil = payload.get("perfil")
        if email is None or perfil is None:
            raise HTTPException(status_code=401, detail="Token inválido")

        new_token = create_access_token({"sub": email, "perfil": perfil})
        return {
            "access_token": new_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "perfil": current_user.perfil
    }

@router.get("/admin-area")
def admin_route(current_user: User = Depends(require_role("admin"))):
    return {"msg": f"Acesso autorizado para {current_user.perfil}"}

# 1) Operador/admin troca a PRÓPRIA senha
@router.post("/change-password")
def change_own_password(
    payload: ChangeOwnPasswordInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Usuário autenticado troca a PRÓPRIA senha.
    - precisa mandar senha atual
    - precisa mandar nova senha forte
    """

    # 1. validar senha atual
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta.",
        )

    # 2. validar força da nova senha
    #    sua check_strength exige >=8 chars e mistura letra+número
    check_strength(payload.new_password)

    # 3. se passou, faz o hash e salva
    current_user.hashed_password = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()

    return {"detail": "Senha alterada com sucesso."}

    # atualiza hash
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()

    return {"detail": "Senha alterada com sucesso."}


@router.post("/admin-reset-password")
def admin_reset_password(
    payload: AdminResetPasswordInput,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin")),
):
    """
    ADMIN redefina a senha de um usuário com perfil 'operador'.
    - NÃO precisa da senha atual desse operador.
    - Admin envia nova senha explícita.
    """

    # 1. carregar o usuário alvo
    alvo: User | None = (
        db.query(User)
        .options(joinedload(User.perfil))
        .filter(User.id == payload.user_id)
        .first()
    )

    if not alvo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado.",
        )

    # 2. garantir que o alvo é operador
    perfil_nome = (alvo.perfil.nome if getattr(alvo, "perfil", None) else "").strip().lower()
    if perfil_nome != "operador":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Só é permitido redefinir a senha de usuários com perfil 'operador'.",
        )

    # 3. validar força da senha nova
    check_strength(payload.new_password)

    # 4. atualizar hash
    alvo.hashed_password = hash_password(payload.new_password)
    db.add(alvo)
    db.commit()

    return {"detail": f"Senha redefinida para o operador {alvo.name}."}
