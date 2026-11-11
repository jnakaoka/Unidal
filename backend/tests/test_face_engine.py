import math
import pytest
from app.services.face_engine import FaceEngine, FaceEmbedding, FaceEngineError, FaceEngineNotConfiguredError, UnconfiguredFaceEngine


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


def test_enrollment_rejeita_sem_fotos():
    with pytest.raises(FaceEngineError, match="pelo menos uma"):
        UnconfiguredFaceEngine().build_enrollment([])


def test_enrollment_uma_foto_normaliza_vetor():
    result = StubEngine([[3.0, 4.0]]).build_enrollment([b"a"])
    assert result.model_version == "stub-v1"
    assert result.vector == pytest.approx([0.6, 0.8])


@pytest.mark.parametrize("vector", [[], [0.0, 0.0], [float("nan"), 1.0], [float("inf"), 1.0]])
def test_enrollment_uma_foto_rejeita_vetor_invalido(vector):
    with pytest.raises(FaceEngineError):
        StubEngine([vector]).build_enrollment([b"a"])


def test_enrollment_preserva_erro_de_motor_nao_configurado():
    with pytest.raises(FaceEngineNotConfiguredError):
        UnconfiguredFaceEngine().build_enrollment([b"a"])


def test_enrollment_uma_foto_rejeitada():
    class RejectedEngine(FaceEngine):
        def extract_embedding(self, image_bytes):
            raise FaceEngineError("Nenhum rosto detetado.")

    with pytest.raises(FaceEngineError, match="Fotografia 1: Nenhum rosto"):
        RejectedEngine().build_enrollment([b"a"])


def test_enrollment_rejeita_dimensoes_incompativeis():
    engine = StubEngine([[1.0, 0.0], [1.0, 0.0, 0.0], [1.0, 0.0]])
    with pytest.raises(FaceEngineError, match="incompatíveis"):
        engine.build_enrollment([b"a", b"b", b"c"])


def test_enrollment_rejeita_valores_nao_finitos():
    engine = StubEngine([[1.0, 0.0], [float("nan"), 0.0], [1.0, 0.0]])
    with pytest.raises(FaceEngineError, match="inválido"):
        engine.build_enrollment([b"a", b"b", b"c"])


def test_enrollment_rejeita_modelos_diferentes():
    class DifferentVersions(FaceEngine):
        def __init__(self):
            self.count = 0

        def extract_embedding(self, image_bytes):
            self.count += 1
            return FaceEmbedding([1.0, 0.0], f"model-{self.count}")

    with pytest.raises(FaceEngineError, match="modelos diferentes"):
        DifferentVersions().build_enrollment([b"a", b"b", b"c"])
