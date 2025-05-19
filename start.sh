#!/bin/bash
echo "Aplicando migrações..."
alembic upgrade head

echo "Iniciando servidor..."
uvicorn main:app --host 0.0.0.0 --port 8000

echo "Servidor iniciado!"