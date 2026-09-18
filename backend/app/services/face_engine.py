from abc import ABC, abstractmethod
from dataclasses import dataclass
from math import sqrt
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


_face_engine: FaceEngine = UnconfiguredFaceEngine()


def get_face_engine() -> FaceEngine:
    return _face_engine


def set_face_engine(engine: FaceEngine) -> None:
    """Permite injetar a implementação do motor sem acoplar as rotas ao modelo."""
    global _face_engine
    _face_engine = engine
