from abc import ABC, abstractmethod
from dataclasses import dataclass
from math import isfinite, sqrt
import os
from pathlib import Path
from typing import Sequence


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
        """Extrai várias capturas e cria um único template normalizado."""
        if len(images) < 3:
            raise FaceEngineError("São necessárias pelo menos 3 capturas faciais.")

        embeddings = [self.extract_embedding(image) for image in images]
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
            for second in embeddings[i + 1:]:
                similarity = sum(float(a) * float(b) for a, b in zip(first.vector, second.vector))
                if similarity < 0.55:
                    raise FaceEngineError("As capturas não parecem pertencer à mesma pessoa.")

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
        try:
            self.detector = cv2.FaceDetectorYN.create(
                detector_path, "", (320, 320), score_threshold=0.9
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
        try:
            self.detector.setInputSize((width, height))
            _, faces = self.detector.detect(image)
            face_count = 0 if faces is None else len(faces)
            if face_count == 0:
                raise FaceEngineError("Nenhum rosto detetado. Verifique enquadramento, iluminação e resolução.")
            if face_count > 1:
                raise FaceEngineError(f"Foram detetados {face_count} rostos. Envie uma fotografia individual.")
            face = faces[0]
            if min(float(face[2]), float(face[3])) < 100:
                raise FaceEngineError("Aproxime o rosto da câmara.")
            aligned = self.recognizer.alignCrop(image, face)
            vector = self.recognizer.feature(aligned).flatten().astype("float64")
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


def get_face_engine() -> FaceEngine:
    global _face_engine
    if _face_engine is None:
        _face_engine = _configured_engine()
    return _face_engine


def set_face_engine(engine: FaceEngine) -> None:
    """Permite injetar a implementação do motor sem acoplar as rotas ao modelo."""
    global _face_engine
    _face_engine = engine
