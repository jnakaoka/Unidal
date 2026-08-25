#!/bin/sh
set -e

echo "Preparando banco exclusivo de testes..."

set +e
python -m bootstrap.bootstrap_db
bootstrap_exit_code=$?
set -e

if [ "$bootstrap_exit_code" -eq 10 ]; then
    echo "Marcando baseline de testes..."
    alembic stamp 004bf99640eb
elif [ "$bootstrap_exit_code" -ne 0 ]; then
    echo "Falha ao preparar banco de testes."
    exit "$bootstrap_exit_code"
fi

echo "Aplicando migrations no banco de testes..."
alembic upgrade head

echo "Executando testes..."
pytest -v