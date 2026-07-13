#!/bin/bash
set -e

echo "Preparando banco de dados..."

set +e
python -m bootstrap.bootstrap_db
BOOTSTRAP_EXIT_CODE=$?
set -e

if [ "$BOOTSTRAP_EXIT_CODE" -eq 10 ]; then
  echo "Marcando baseline no Alembic..."
  alembic stamp 004bf99640eb
elif [ "$BOOTSTRAP_EXIT_CODE" -ne 0 ]; then
  echo "Falha ao preparar banco de dados."
  exit "$BOOTSTRAP_EXIT_CODE"
fi

echo "Aplicando migracoes..."
alembic upgrade head

echo "Iniciando servidor..."
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --proxy-headers \
  --forwarded-allow-ips="*"