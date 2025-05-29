#!/bin/bash
echo "Aplicando migrações..."
alembic upgrade head

echo "Iniciando servidor..."
uvicorn app.main:app --host 0.0.0.0 --port 8000

exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload

echo "Servidor iniciado!"