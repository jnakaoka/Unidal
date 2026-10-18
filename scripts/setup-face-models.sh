#!/usr/bin/env bash
set -euo pipefail

# Modelos ONNX oficiais do OpenCV Zoo. Não altera serviços Docker nem bancos.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${FACE_MODELS_DIR:-$ROOT/face-models}"
mkdir -p "$DEST"

download() {
  local name="$1" url="$2" expected_sha="$3" output="$DEST/$1" tmp
  if [[ -s "$output" ]] && echo "$expected_sha  $output" | sha256sum -c --status; then
    echo "Já existe: $output (não substituído)"
    return
  fi
  tmp="$(mktemp "$DEST/.download.XXXXXXXX")"
  trap 'rm -f "$tmp"' RETURN
  echo "A descarregar $name..."
  # No Git Bash do Windows, PowerShell pode usar a cadeia TLS do sistema
  # mesmo quando o curl do Git falha ao localizar a CA.
  if [[ "$OSTYPE" == msys* || "$OSTYPE" == cygwin* ]] && command -v powershell.exe >/dev/null 2>&1; then
    local win_tmp
    win_tmp="$(cygpath -w "$tmp")"
    # URL e caminho são argumentos, não interpolados no código PowerShell.
    powershell.exe -NoProfile -NonInteractive -Command \
      '& { param($Uri,$OutFile) $ErrorActionPreference = "Stop"; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri $Uri -OutFile $OutFile -UseBasicParsing }' \
      "$url" "$win_tmp"
  else
    curl --fail --location --retry 3 --connect-timeout 15 --max-time 180 --silent --show-error "$url" -o "$tmp"
  fi
  if [[ ! -s "$tmp" ]] || ! echo "$expected_sha  $tmp" | sha256sum -c --status; then
    echo "Erro: $name não corresponde ao SHA-256 esperado (ficheiro incorreto ou incompleto)." >&2
    return 1
  fi
  mv "$tmp" "$output"
  trap - RETURN
  echo "Guardado: $output"
}

download "yunet.onnx" "https://huggingface.co/opencv/opencv_zoo/resolve/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx" "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4"
download "sface.onnx" "https://huggingface.co/opencv/opencv_zoo/resolve/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx" "0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79"

echo "Modelos preparados e SHA-256 verificado em $DEST"
echo "Nota: valide as licenças dos pesos antes do uso comercial."
