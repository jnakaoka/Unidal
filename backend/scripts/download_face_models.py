"""Download verified OpenCV Zoo ONNX models at Docker image build time.

The SHA-256 values are from the upstream Git LFS pointers.
Never bypass TLS verification or accept unverified downloads.
"""
from hashlib import sha256
from pathlib import Path
from urllib.request import urlopen
import os
import tempfile
import time

BASE_URL = "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models"
MODELS = {
    "face_detection_yunet_2023mar.onnx": (
        "face_detection_yunet",
        "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
        232589,
    ),
    "face_recognition_sface_2021dec.onnx": (
        "face_recognition_sface",
        "0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
        38696353,
    ),
}
DEST = Path(os.environ.get("FACE_MODELS_DIR", "/opt/face_models"))


def download(name: str, subfolder: str, expected_hash: str, expected_size: int) -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    destination = DEST / name
    if destination.is_file() and destination.stat().st_size == expected_size:
        if sha256(destination.read_bytes()).hexdigest() == expected_hash:
            print(f"{name}: verified existing file", flush=True)
            return

    url = f"{BASE_URL}/{subfolder}/{name}"
    for attempt in range(1, 4):
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(dir=DEST, prefix=".download-", delete=False) as temp:
                temp_path = Path(temp.name)
                digest = sha256()
                total = 0
                with urlopen(url, timeout=90) as response:
                    while chunk := response.read(1024 * 1024):
                        temp.write(chunk)
                        digest.update(chunk)
                        total += len(chunk)
            if total != expected_size or digest.hexdigest() != expected_hash:
                raise ValueError(f"Model integrity check failed: {name}")
            temp_path.replace(destination)
            print(f"{name}: downloaded and SHA-256 verified", flush=True)
            return
        except Exception as exc:
            if temp_path is not None:
                temp_path.unlink(missing_ok=True)
            if isinstance(exc, ValueError):
                raise
            if attempt == 3:
                raise RuntimeError(f"Unable to download {name} securely") from exc
            print(f"{name}: attempt {attempt} failed; retrying", flush=True)
            time.sleep(attempt * 2)


if __name__ == "__main__":
    for filename, (folder, digest, size) in MODELS.items():
        download(filename, folder, digest, size)
