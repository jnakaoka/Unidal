# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Dockerfile (dentro de /backend)
# Copia o start.sh da raiz do projeto para o /app do container

COPY . .

COPY ../start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["bash", "/app/start.sh"]
