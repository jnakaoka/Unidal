# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Dockerfile (dentro de /backend)
# O contexto de build é backend/; start.sh encontra-se nesta pasta.

COPY . .

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["bash", "/app/start.sh"]
