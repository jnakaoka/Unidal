from pathlib import Path

from sqlalchemy import create_engine, inspect

from app.config import settings


BASELINE_REVISION = "004bf99640eb"
SCHEMA_PATH = Path("/app/bootstrap/schema_baseline.sql")


def split_sql_statements(sql: str) -> list[str]:
    statements: list[str] = []
    current: list[str] = []

    for line in sql.splitlines():
        stripped = line.strip()

        if not stripped:
            continue

        current.append(line)

        if stripped.endswith(";"):
            statement = "\n".join(current).strip()
            statements.append(statement)
            current = []

    if current:
        statement = "\n".join(current).strip()
        if statement:
            statements.append(statement)

    return statements


def database_needs_bootstrap() -> bool:
    engine = create_engine(settings.DATABASE_URL)

    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())

        required_tables = {
            "users",
            "perfis",
            "projetos",
            "clientes",
            "obras",
            "registros_hora",
            "registros_hora_equipa",
        }

        if not tables:
            return True

        missing_tables = required_tables - tables

        if missing_tables:
            raise RuntimeError(
                "Banco parcialmente inicializado. "
                f"Tabelas ausentes: {', '.join(sorted(missing_tables))}"
            )

        return False
    finally:
        engine.dispose()


def apply_baseline() -> None:
    if not SCHEMA_PATH.exists():
        raise FileNotFoundError(
            f"Arquivo de baseline nao encontrado: {SCHEMA_PATH}"
        )

    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    statements = split_sql_statements(schema_sql)

    engine = create_engine(settings.DATABASE_URL)
    raw_connection = engine.raw_connection()

    try:
        cursor = raw_connection.cursor()

        for statement in statements:
            cursor.execute(statement)

        raw_connection.commit()
        cursor.close()
    except Exception:
        raw_connection.rollback()
        raise
    finally:
        raw_connection.close()
        engine.dispose()


def main() -> int:
    print("Verificando estrutura do banco...")

    if database_needs_bootstrap():
        print("Banco vazio detectado.")
        print("Aplicando baseline...")

        apply_baseline()

        print("Baseline aplicada com sucesso.")
        print(f"BASELINE_APPLIED={BASELINE_REVISION}")

        return 10

    print("Banco existente detectado.")
    print("BASELINE_APPLIED=NO")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())