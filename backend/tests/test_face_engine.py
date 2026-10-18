import math
import pytest
from app.services.face_engine import FaceEngine, FaceEmbedding, FaceEngineError, UnconfiguredFaceEngine


class StubEngine(FaceEngine):
    def __init__(self, vectors):
        self.vectors = iter(vectors)

    def extract_embedding(self, image_bytes):
        return FaceEmbedding(next(self.vectors), "stub-v1")


def test_enrollment_normaliza_media():
    engine = StubEngine([[1.0, 0.0], [0.98, 0.2], [0.96, 0.28]])
    result = engine.build_enrollment([b"a", b"b", b"c"])
    assert result.model_version == "stub-v1"
    assert math.isclose(sum(v*v for v in result.vector), 1.0, abs_tol=1e-6)


def test_enrollment_rejeita_pessoas_diferentes():
    engine = StubEngine([[1.0, 0.0], [0.0, 1.0], [1.0, 0.0]])
    with pytest.raises(FaceEngineError, match="mesma pessoa"):
        engine.build_enrollment([b"a", b"b", b"c"])


def test_enrollment_rejeita_poucas_fotos():
    with pytest.raises(FaceEngineError, match="pelo menos 3"):
        UnconfiguredFaceEngine().build_enrollment([b"a", b"b"])
