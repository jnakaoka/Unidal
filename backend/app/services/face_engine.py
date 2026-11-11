from abc import ABC, abstractmethod
from dataclasses import dataclass
from math import isfinite, sqrt
import os
import logging
from threading import Lock
from time import perf_counter
from pathlib import Path
from typing import Sequence


logger = logging.getLogger("uvicorn.error.face")


class FaceEngineError(Exception):
    """Erro controlado do motor facial."""


class FaceEngineNotConfiguredError(FaceEngineError):
    """O motor facial ainda não possui modelo configurado."""


@dataclass(frozen=True)
class FaceEmbedding:
    vector: Sequence[float]
    model_version: str


class FaceEngine(ABC):
    @abstractmethod
    def extract_embedding(self, image_bytes: bytes) -> FaceEmbedding:
        """Valida uma captura e devolve um embedding normalizado."""
        raise NotImplementedError

    def build_enrollment(self, images: Sequence[bytes]) -> FaceEmbedding:
        """Cria um template com uma captura; aceita várias para clientes antigos."""
        if not images:
            raise FaceEngineError("É necessária pelo menos uma captura facial.")

        embeddings = []
        for index, image in enumerate(images, start=1):
            try:
                embeddings.append(self.extract_embedding(image))
            except FaceEngineNotConfiguredError:
                raise
            except FaceEngineError as exc:
                raise FaceEngineError(f"Fotografia {index}: {exc}") from exc
        versions = {item.model_version for item in embeddings}
        if len(versions) != 1:
            raise FaceEngineError("As capturas foram processadas por modelos diferentes.")

        dimensions = {len(item.vector) for item in embeddings}
        if len(dimensions) != 1 or 0 in dimensions:
            raise FaceEngineError("Embeddings faciais incompatíveis.")

        for item in embeddings:
            if not all(isfinite(float(value)) for value in item.vector):
                raise FaceEngineError("Embedding facial inválido.")
        # Capturas da mesma pessoa devem produzir vetores semelhantes.
        # Este limiar é conservador e deve ser calibrado com dados consentidos.
        for i, first in enumerate(embeddings):
            for j, second in enumerate(embeddings[i + 1:], start=i + 1):
                similarity = sum(float(a) * float(b) for a, b in zip(first.vector, second.vector))
                if similarity < 0.55:
                    raise FaceEngineError(
                        f"Fotografias {i + 1} e {j + 1} não parecem pertencer à mesma pessoa (baixa semelhança). "
                        "Repita uma das capturas com o rosto de frente e boa iluminação."
                    )

        averaged = [
            sum(float(item.vector[index]) for item in embeddings) / len(embeddings)
            for index in range(len(embeddings[0].vector))
        ]
        norm = sqrt(sum(value * value for value in averaged))
        if norm <= 0:
            raise FaceEngineError("Não foi possível normalizar o template facial.")

        return FaceEmbedding(
            vector=[value / norm for value in averaged],
            model_version=embeddings[0].model_version,
        )


class UnconfiguredFaceEngine(FaceEngine):
    def extract_embedding(self, image_bytes: bytes) -> FaceEmbedding:
        raise FaceEngineNotConfiguredError(
            "Motor de reconhecimento facial ainda não configurado."
        )



class OpenCVFaceEngine(FaceEngine):
    """YuNet (deteção) + SFace (embedding), com modelos ONNX fornecidos localmente.

    Não descarrega modelos automaticamente. O operador deve verificar as licenças
    e configurar os caminhos antes de ativar o motor.
    """

    MODEL_VERSION = "opencv-sface-2021dec-v1"
    MAX_DETECTION_SIDE = 960

    def __init__(self, detector_path: str, recognizer_path: str):
        try:
            import cv2
            import numpy as np
        except ImportError as exc:
            raise FaceEngineNotConfiguredError(
                "Instale opencv-contrib-python-headless e numpy para ativar a biometria."
            ) from exc
        if not Path(detector_path).is_file() or not Path(recognizer_path).is_file():
            raise FaceEngineNotConfiguredError("Modelos YuNet/SFace não encontrados.")
        self.cv2 = cv2
        self.np = np
        self._inference_lock = Lock()
        try:
            self.detector = cv2.FaceDetectorYN.create(
                detector_path, "", (320, 320), score_threshold=0.7
            )
            self.recognizer = cv2.FaceRecognizerSF.create(recognizer_path, "")
        except (cv2.error, AttributeError) as exc:
            raise FaceEngineNotConfiguredError("Não foi possível carregar YuNet/SFace.") from exc

    def extract_embedding(self, image_bytes: bytes) -> FaceEmbedding:
        if not image_bytes:
            raise FaceEngineError("Imagem facial vazia.")
        image = self.cv2.imdecode(
            self.np.frombuffer(image_bytes, dtype=self.np.uint8),
            self.cv2.IMREAD_COLOR,
        )
        if image is None:
            raise FaceEngineError("Imagem facial inválida.")
        height, width = image.shape[:2]
        if min(height, width) < 240 or width * height > 12_000_000:
            raise FaceEngineError("Resolução facial inadequada.")
        # YuNet não precisa de processar todos os megapixels da fotografia.
        # SFace continua a alinhar/recortar a imagem original, preservando detalhe.
        detection_image = image
        if max(width, height) > self.MAX_DETECTION_SIDE:
            scale = self.MAX_DETECTION_SIDE / max(width, height)
            detection_image = self.cv2.resize(
                image, (max(1, round(width * scale)), max(1, round(height * scale))),
                interpolation=self.cv2.INTER_AREA,
            )
        detection_height, detection_width = detection_image.shape[:2]
        lock_started = perf_counter()
        try:
            # A instância é partilhada: os objetos DNN têm estado mutável.
            with self._inference_lock:
                wait_ms = (perf_counter() - lock_started) * 1000
                detection_started = perf_counter()
                self.detector.setInputSize((detection_width, detection_height))
                _, faces = self.detector.detect(detection_image)
                face_count = 0 if faces is None else len(faces)
                detection_ms = (perf_counter() - detection_started) * 1000
                logger.info(
                    "face_detection original=%sx%s detector=%sx%s faces=%s duration_ms=%.1f wait_ms=%.1f",
                    width, height, detection_width, detection_height, face_count, detection_ms, wait_ms,
                )
                if face_count == 0:
                    raise FaceEngineError("Nenhum rosto detetado. Verifique enquadramento, iluminação e resolução.")
                if face_count > 1:
                    raise FaceEngineError(f"Foram detetados {face_count} rostos. Envie uma fotografia individual.")
                face = faces[0].copy()
                # Caixa e cinco landmarks voltam às coordenadas originais.
                # O índice 14 é a confiança, não uma coordenada.
                face[:14:2] *= width / detection_width
                face[1:14:2] *= height / detection_height
                if min(float(face[2]), float(face[3])) < 100:
                    raise FaceEngineError("Aproxime o rosto da câmara.")
                x, y, face_width, face_height = map(float, face[:4])
                if x < 0 or y < 0 or x + face_width > width or y + face_height > height:
                    raise FaceEngineError("Mantenha o rosto inteiro dentro da moldura.")
                embedding_started = perf_counter()
                aligned = self.recognizer.alignCrop(image, face)
                vector = self.recognizer.feature(aligned).flatten().astype("float64")
                logger.info("face_embedding duration_ms=%.1f", (perf_counter() - embedding_started) * 1000)
        except self.cv2.error as exc:
            raise FaceEngineError("Não foi possível processar a imagem facial.") from exc
        norm = float(self.np.linalg.norm(vector))
        if not isfinite(norm) or norm <= 0:
            raise FaceEngineError("Embedding facial inválido.")
        return FaceEmbedding(
            vector=(vector / norm).tolist(),
            model_version=self.MODEL_VERSION,
        )


def _configured_engine() -> FaceEngine:
    detector = os.getenv("FACE_YUNET_MODEL")
    recognizer = os.getenv("FACE_SFACE_MODEL")
    if not detector or not recognizer:
        return UnconfiguredFaceEngine()
    return OpenCVFaceEngine(detector, recognizer)


_face_engine: FaceEngine | None = None
_face_engine_lock = Lock()


def get_face_engine() -> FaceEngine:
    global _face_engine
    with _face_engine_lock:
        if _face_engine is None:
            _face_engine = _configured_engine()
        return _face_engine


def set_face_engine(engine: FaceEngine) -> None:
    """Permite injetar a implementação do motor sem acoplar as rotas ao modelo."""
    global _face_engine
    with _face_engine_lock:
        _face_engine = engine
