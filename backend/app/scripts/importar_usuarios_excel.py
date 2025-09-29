# app/scripts/importar_usuarios_excel.py
"""
Importa usuários e perfis a partir de um Excel.

Exemplo (no container da API):
  python -m app.scripts.importar_usuarios_excel \
    --file "/app/data/import trabalhadores.xlsx" \
    --sheet "Folha1"

Campos esperados (case-insensitive):
  - NOME TRABALHADOR (obrigatório)
  - EMPRESA          (obrigatório)
  - Email            (pode ser gerado a partir de nome+empresa)
  - Perfil           (obrigatório; cria se não existir)
  - Status           (opcional; mapeia para ativo/inativo)
  - hash_passord | hashed_password (opcional; hash já pronto)
  - password | senha               (opcional; texto claro a ser hasheado)
"""

from __future__ import annotations

import argparse
import sys
from typing import Optional

import pandas as pd
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.models.perfil import Perfil
import importlib, sys
from sqlalchemy.orm import configure_mappers

# headers esperados
COL_NOME = "NOME TRABALHADOR"
COL_EMPRESA = "EMPRESA"
COL_EMAIL = "Email"
COL_PERFIL = "Perfil"
COL_STATUS = "Status"

# Usa a função oficial do projeto se existir; senão, usa passlib(bcrypt)
try:
    from app.core.security import get_password_hash  # type: ignore
except Exception:
    try:
        from passlib.context import CryptContext

        _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        def get_password_hash(password: str) -> str:
            return _pwd_context.hash(password)
    except Exception:
        get_password_hash = None  # type: ignore


def _import_all_models():
    for m in (
        "app.models.cliente",
        "app.models.obra",
        "app.models.projeto",
        "app.models.registro_hora",
        "app.models.user",
        "app.models.perfil",
    ):
        try:
            importlib.import_module(m)
        except Exception as e:
            print(f"[WARN] Não consegui importar {m}: {e}", file=sys.stderr)

_import_all_models()

# Opcional: força a configuração dos mapeadores já com tudo importado
try:
    configure_mappers()
except Exception as e:
    print(f"[WARN] configure_mappers: {e}", file=sys.stderr)

def load_excel_with_header_autodetect(path, sheet):
    """
    Lê a planilha e tenta encontrar a linha do cabeçalho procurando pelos
    cabeçalhos obrigatórios nas 10 primeiras linhas. Se não achar, usa linha 1 (segunda).
    """
    required = {COL_NOME, COL_EMPRESA, COL_EMAIL, COL_PERFIL, COL_STATUS}
    df_raw = pd.read_excel(path, sheet_name=sheet, header=None)
    header_row = None
    for i in range(min(10, len(df_raw))):
        row_vals = [str(x).strip() for x in df_raw.iloc[i].tolist()]
        if required.issubset(set(row_vals)):
            header_row = i
            break
    if header_row is None:
        header_row = 1  # fallback comum em arquivos com linha de título extra

    df = pd.read_excel(path, sheet_name=sheet, header=header_row)
    df.columns = [str(c).strip() for c in df.columns]  # normaliza nomes
    df = df.dropna(how="all")  # remove linhas totalmente vazias
    return df


# ---------- utilidades de coluna / normalização ----------
def _col(df: pd.DataFrame, *names: str) -> Optional[str]:
    """Retorna o primeiro nome de coluna existente (case-insensitive)."""
    cmap = {c.lower(): c for c in df.columns}
    for n in names:
        if n.lower() in cmap:
            return cmap[n.lower()]
    return None


def is_active_from_status(val: Optional[str]) -> bool:
    if val is None:
        return True
    s = str(val).strip().lower()
    if s == "":
        return True
    truthy = {"ativo", "activa", "sim", "yes", "1", "true"}
    falsy = {"inativo", "inactiva", "não", "nao", "no", "0", "false", "inativo(a)"}
    if s in truthy:
        return True
    if s in falsy:
        return False
    return True


def normalize_company(empresa: Optional[str]) -> str:
    if empresa is None:
        return ""
    if isinstance(empresa, float) and pd.isna(empresa):
        return ""
    return str(empresa).strip()

def normalize_email(email: Optional[str]) -> str:
    if email is None:
        return ""
    if isinstance(email, float) and pd.isna(email):
        return ""
    return str(email).strip().lower()

def _safe_str(val) -> str:
    if val is None:
        return ""
    if isinstance(val, float) and pd.isna(val):
        return ""
    return str(val).strip()


def first_last(name: str) -> tuple[str, Optional[str]]:
    parts = [p for p in (name or "").strip().split() if p]
    if not parts:
        return "", None
    if len(parts) == 1:
        return parts[0], None
    return parts[0], parts[-1]


def generate_email_from_name_company(name: str, empresa: str, tld: str = "com") -> Optional[str]:
    name = (name or "").strip()
    empresa = (empresa or "").strip()
    if not name or not empresa:
        return None
    p, u = first_last(name)
    if not p:
        return None
    domain = empresa.replace(" ", "").lower() + f".{tld}"
    return (f"{p}.{u}@{domain}" if u else f"{p}@{domain}").lower()


# ---------- acesso ao banco ----------
def get_or_create_perfil(db: Session, nome: str) -> Perfil:
    nome = (nome or "").strip() or "Padrão"
    perfil = db.query(Perfil).filter(Perfil.nome == nome).first()
    if perfil:
        return perfil
    perfil = Perfil(nome=nome, is_active=True)
    db.add(perfil)
    db.commit()
    db.refresh(perfil)
    return perfil


def create_or_update_user(
    db: Session,
    *,
    name: str,
    email: str,
    empresa: str,
    perfil: Perfil,
    is_active: bool,
    hashed_password: Optional[str],
    update_existing: bool,
    update_password: bool,
) -> tuple[User, bool]:
    """
    Cria usuário se não existir; atualiza se existir (se update_existing=True).
    Se update_password=True e hashed_password vier preenchido, atualiza a senha.
    Retorna (user, created=True/False)
    """
    email_norm = normalize_email(email)
    if not email_norm:
        raise ValueError(f"E-mail vazio para o usuário '{name}'.")

    user = db.query(User).filter(User.email == email_norm).first()
    if user is None:
        user = User(
            name=name.strip(),
            email=email_norm,
            empresa=empresa.strip(),
            perfil_id=perfil.id,
            is_active=is_active,
            hashed_password=(hashed_password or ""),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, True

    changed = False
    if update_existing:
        if user.name != name.strip():
            user.name = name.strip(); changed = True
        if user.empresa != empresa.strip():
            user.empresa = empresa.strip(); changed = True
        if user.perfil_id != perfil.id:
            user.perfil_id = perfil.id; changed = True
        if user.is_active != is_active:
            user.is_active = is_active; changed = True

    if update_password and hashed_password:
        if user.hashed_password != hashed_password:
            user.hashed_password = hashed_password
            changed = True

    if changed:
        db.commit()
        db.refresh(user)

    return user, False


# ---------- validação de cabeçalhos ----------
def validate_headers(df: pd.DataFrame):
    req = {"NOME TRABALHADOR", "EMPRESA", "Email", "Perfil", "Status"}
    present = {c.lower() for c in df.columns}
    missing = [c for c in req if c.lower() not in present]
    if missing:
        raise ValueError(f"Colunas ausentes no Excel: {missing}")


# ---------- main ----------
def main():
    parser = argparse.ArgumentParser(description="Importa usuários de um arquivo Excel.")
    parser.add_argument("--file", required=True, help="Caminho do arquivo .xlsx")
    parser.add_argument("--sheet", default=0, help="Nome da planilha ou índice (padrão: 0)")
    parser.add_argument("--update-existing", action="store_true",
                        help="Atualiza empresa/perfil/status/nome se o usuário já existir.")
    parser.add_argument("--update-password", action="store_true",
                        help="Se presente, atualiza o hashed_password dos usuários existentes quando vier no Excel.")
    parser.add_argument("--fallback-password", default=None,
                        help="Senha padrão apenas para linhas SEM hash e SEM senha em claro (opcional).")
    parser.add_argument("--tld", default="com", help="TLD do domínio quando gerar e-mail (padrão: com).")
    args = parser.parse_args()

    # Lê Excel (com autodetecção de header)
    try:
        df = load_excel_with_header_autodetect(args.file, args.sheet)
    except Exception as e:
        print(f"Erro ao ler Excel: {e}", file=sys.stderr)
        sys.exit(1)

    # Valida headers mínimos
    try:
        validate_headers(df)
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

    # Descobre colunas (case-insensitive)
    col_nome   = _col(df, "NOME TRABALHADOR", "nome")
    col_emp    = _col(df, "EMPRESA", "empresa")
    col_email  = _col(df, "Email", "email")
    col_perfil = _col(df, "Perfil", "perfil")
    col_status = _col(df, "Status", "status")

    # Senha/Hash
    col_hash   = _col(df, "hash_passord", "hashed_password", "hash_password")
    col_plain  = _col(df, "password", "senha")

    db = SessionLocal()

    total = created = updated = skipped = errors = 0

    try:
        for idx, row in df.iterrows():
            total += 1
            # nome    = str(row.get(col_nome, "") or "").strip()
            # empresa = normalize_company(row.get(col_emp))
            # email   = normalize_email(row.get(col_email))
            # perfil_nome = str(row.get(col_perfil, "") or "").strip()
            # ativo   = is_active_from_status(row.get(col_status))

            nome       = _safe_str(row.get(col_nome))
            empresa    = normalize_company(row.get(col_emp))
            email      = normalize_email(row.get(col_email))
            perfil_nome= _safe_str(row.get(col_perfil))
            status_raw = _safe_str(row.get(col_status))
            ativo      = is_active_from_status(status_raw)

            if not nome:
                print(f"[{idx}] PULANDO: nome vazio.")
                skipped += 1
                continue

            # gera email se vier vazio
            if not email:
                gen = generate_email_from_name_company(nome, empresa, tld=args.tld)
                if gen:
                    email = gen
                else:
                    print(f"[{idx}] ERRO: não foi possível gerar e-mail para '{nome}' (empresa='{empresa}').", file=sys.stderr)
                    errors += 1
                    continue

            # resolve hashed_password
            hashed: Optional[str] = None
            if col_hash and pd.notna(row.get(col_hash)) and str(row.get(col_hash)).strip():
                raw = str(row.get(col_hash)).strip()
                if raw.startswith("$2"):  # parece bcrypt
                    hashed = raw
                else:
                    # Valor parece senha em claro: vamos hashear se possível
                    if get_password_hash is None:
                        print(f"[{idx}] ERRO: coluna '{col_hash}' não é bcrypt e não há função de hashing disponível.", file=sys.stderr)
                        errors += 1
                        continue
                    hashed = get_password_hash(raw)
            elif col_plain and pd.notna(row.get(col_plain)) and str(row.get(col_plain)).strip():
                plain = str(row.get(col_plain)).strip()
                if get_password_hash is None:
                    print(f"[{idx}] ERRO: veio senha em claro mas não há função de hashing.", file=sys.stderr)
                    errors += 1
                    continue
                hashed = get_password_hash(plain)
            elif args.fallback_password:
                if get_password_hash is None:
                    print(f"[{idx}] ERRO: fallback-password informado mas não há função de hashing.", file=sys.stderr)
                    errors += 1
                    continue
                hashed = get_password_hash(args.fallback_password)
            else:
                print(f"[{idx}] ERRO: linha sem hash_passord/hashed_password e sem password/senha.", file=sys.stderr)
                errors += 1
                continue

            try:
                perfil = get_or_create_perfil(db, perfil_nome)
                before = db.query(User).filter(User.email == email).first()

                user, was_created = create_or_update_user(
                    db,
                    name=nome,
                    email=email,
                    empresa=empresa,
                    perfil=perfil,
                    is_active=ativo,
                    hashed_password=hashed,
                    update_existing=args.update_existing,
                    update_password=args.update_password,
                )

                if was_created:
                    created += 1
                    print(f"[{idx}] CRIADO: {user.name} <{user.email}> perfil='{perfil.nome}' ativo={user.is_active}")
                else:
                    if args.update_existing and before and (
                        before.name != user.name
                        or before.empresa != user.empresa
                        or before.perfil_id != user.perfil_id
                        or before.is_active != user.is_active
                        or (args.update_password and before.hashed_password != user.hashed_password)
                    ):
                        updated += 1
                        print(f"[{idx}] ATUALIZADO: {user.name} <{user.email}> perfil='{perfil.nome}' ativo={user.is_active}")
                    else:
                        skipped += 1
                        print(f"[{idx}] JÁ EXISTIA (sem mudanças): {user.name} <{user.email}>")

            except Exception as e:
                errors += 1
                print(f"[{idx}] ERRO ao processar '{nome}': {e}", file=sys.stderr)

    finally:
        db.close()

    print("\n=== RESUMO ===")
    print(f"Total linhas: {total}")
    print(f"Criados     : {created}")
    print(f"Atualizados : {updated}")
    print(f"Pulados     : {skipped}")
    print(f"Erros       : {errors}")
    if get_password_hash is None:
        print("\n[AVISO] Sem função de hashing disponível. Apenas hashes prontos (hash_passord/hashed_password) foram aceitos.")
    print("\n=== FIM ===")


if __name__ == "__main__":
    main()

    print("\n=== FIM ===")