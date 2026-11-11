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


def _opencv_stub(width, height, original_face=None):
    import cv2
    import numpy as np
    from threading import Lock
    from types import SimpleNamespace
    from app.services.face_engine import OpenCVFaceEngine

    engine = OpenCVFaceEngine.__new__(OpenCVFaceEngine)
    engine.cv2, engine.np = cv2, np
    engine._inference_lock = Lock()
    face = np.array(original_face if original_face is not None else [
        width * .25, height * .2, width * .5, height * .6,
        width * .4, height * .4, width * .6, height * .4,
        width * .5, height * .5, width * .4, height * .6,
        width * .6, height * .6, .99,
    ], dtype=np.float32)
    seen = {}

    class Detector:
        def setInputSize(self, size):
            seen['size'] = size

        def detect(self, image):
            h, w = image.shape[:2]
            assert seen['size'] == (w, h)
            scaled_face = face.copy()
            scaled_face[:14:2] *= w / width
            scaled_face[1:14:2] *= h / height
            return None, np.array([scaled_face])

    class Recognizer:
        def alignCrop(self, image, mapped_face):
            seen['original_shape'] = image.shape[:2]
            seen['mapped_face'] = mapped_face.copy()
            return image[:112, :112]

        def feature(self, aligned):
            return np.array([[3., 4.]])

    engine.detector, engine.recognizer = Detector(), Recognizer()
    _, data = cv2.imencode('.jpg', np.zeros((height, width, 3), dtype=np.uint8))
    return engine, data.tobytes(), seen, face


@pytest.mark.parametrize('width,height', [(4000, 3000), (1801, 1001), (480, 640)])
def test_detector_limitado_mantem_coordenadas_e_original_para_sface(width, height):
    import numpy as np
    engine, data, seen, original_face = _opencv_stub(width, height)
    result = engine.extract_embedding(data)
    assert max(seen['size']) <= engine.MAX_DETECTION_SIDE
    if max(width, height) <= engine.MAX_DETECTION_SIDE:
        assert seen['size'] == (width, height)
    assert seen['original_shape'] == (height, width)
    np.testing.assert_allclose(seen['mapped_face'], original_face, rtol=1e-6, atol=.001)
    assert result.vector == pytest.approx([.6, .8])
    assert result.model_version == engine.MODEL_VERSION


@pytest.mark.parametrize('box,message', [
    ([-10, 200, 400, 400], 'rosto inteiro'),
    ([900, 200, 400, 400], 'rosto inteiro'),
    ([100, 100, 90, 90], 'Aproxime'),
])
def test_reescala_preserva_rejeicao_de_rosto_cortado_ou_pequeno(box, message):
    engine, data, _, _ = _opencv_stub(1200, 1000, box + [200] * 10 + [.99])
    with pytest.raises(FaceEngineError, match=message):
        engine.extract_embedding(data)


@pytest.mark.parametrize('faces,message', [(None, 'Nenhum rosto'), ([[], []], '2 rostos')])
def test_detector_reduzido_rejeita_zero_ou_varios_rostos(faces, message):
    engine, data, _, _ = _opencv_stub(1200, 1000)
    engine.detector.detect = lambda _: (None, faces)
    with pytest.raises(FaceEngineError, match=message):
        engine.extract_embedding(data)


def test_motor_partilhado_serializa_inferencias_concorrentes():
    from concurrent.futures import ThreadPoolExecutor
    from threading import Lock
    import time
    engine, data, _, _ = _opencv_stub(480, 640)
    original_detect = engine.detector.detect
    counter_lock = Lock()
    active, maximum = 0, 0
    def detect(image):
        nonlocal active, maximum
        with counter_lock:
            active += 1
            maximum = max(maximum, active)
        try:
            time.sleep(.01)
            return original_detect(image)
        finally:
            with counter_lock:
                active -= 1
    engine.detector.detect = detect
    with ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(engine.extract_embedding, [data] * 3))
    assert maximum == 1
    assert all(result.vector == pytest.approx([.6, .8]) for result in results)
