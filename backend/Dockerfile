FROM python:3.11-slim

WORKDIR /app

# HTTPS certificate verification for downloads at build time.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download ONNX models only at image build time, with SHA-256 verification.
# Keep models outside /app so local files cannot overwrite verified artifacts.
ENV FACE_MODELS_DIR=/opt/face_models
COPY scripts/download_face_models.py /tmp/download_face_models.py
RUN python /tmp/download_face_models.py \
    && rm /tmp/download_face_models.py

ENV FACE_YUNET_MODEL=/opt/face_models/face_detection_yunet_2023mar.onnx
ENV FACE_SFACE_MODEL=/opt/face_models/face_recognition_sface_2021dec.onnx

COPY . .
RUN chmod +x /app/start.sh

CMD ["bash", "/app/start.sh"]
