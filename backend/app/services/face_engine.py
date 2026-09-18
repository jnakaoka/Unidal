from abc import ABC, abstractmethod
from dataclasses import dataclass
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


class UnconfiguredFaceEngine(FaceEngine):
    def extract_embedding(self, image_bytes: bytes) -> FaceEmbedding:
        raise FaceEngineNotConfiguredError(
            "Motor de reconhecimento facial ainda não configurado."
        )


_face_engine: FaceEngine = UnconfiguredFaceEngine()


def get_face_engine() -> FaceEngine:
    return _face_engine


def set_face_engine(engine: FaceEngine) -> None:
    """Permite injetar a implementação ONNX sem acoplar as rotas ao modelo."""
    global _face_engine
    _face_engine = engine
