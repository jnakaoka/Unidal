#!/usr/bin/env bash
set -euo pipefail

# Modelos ONNX oficiais do OpenCV Zoo. Não altera serviços Docker nem bancos.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${FACE_MODELS_DIR:-$ROOT/face-models}"
mkdir -p "$DEST"

download() {
  local name="$1" url="$2" output="$DEST/$1" tmp
  if [[ -s "$output" ]] && [[ "$(head -c 4 "$output")" != "vers" ]]; then
    echo "Já existe: $output (não substituído)"
    return
  fi
  tmp="$(mktemp "$DEST/.download.XXXXXXXX")"
  trap 'rm -f "$tmp"' RETURN
  echo "A descarregar $name..."
  local curl_bin="curl"
  # Em Git Bash, preferir curl.exe com Schannel quando disponível.
  if [[ "$OSTYPE" == msys* || "$OSTYPE" == cygwin* ]]; then
    if command -v curl.exe >/dev/null 2>&1 && curl.exe --version | grep -qi Schannel; then
      curl_bin="curl.exe"
    fi
  fi
  "$curl_bin" --fail --location --retry 3 --connect-timeout 15 --max-time 180 --silent --show-error "$url" -o "$tmp"
  if [[ ! -s "$tmp" ]] || [[ "$(head -c 4 "$tmp")" == "vers" ]]; then
    echo "Erro: $name não parece ser um modelo ONNX válido." >&2
    return 1
  fi
  mv "$tmp" "$output"
  trap - RETURN
  echo "Guardado: $output"
}

download "yunet.onnx" "https://raw.githubusercontent.com/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
download "sface.onnx" "https://raw.githubusercontent.com/opencv/opencv_zoo/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

echo "Modelos preparados em $DEST"
echo "Nota: valide as licenças e a integridade dos pesos antes do uso comercial."
