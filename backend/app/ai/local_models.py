"""Local multilingual models (sentence-transformers, CPU): embeddings for search and topic detection, and a
cross-encoder that re-scores search candidates. Loaded on first use; both are thread-safe to call."""

import math
import threading

from sentence_transformers import CrossEncoder, SentenceTransformer


class E5Embedder:
    """intfloat/multilingual-e5-*: texts need the "query: " / "passage: " prefixes the model was trained with."""

    def __init__(self, model: str) -> None:
        self._name = model
        self._model: SentenceTransformer | None = None
        self._lock = threading.Lock()

    @property
    def model_version(self) -> str:
        return self._name

    def _load(self) -> SentenceTransformer:
        with self._lock:
            if self._model is None:
                self._model = SentenceTransformer(self._name, device="cpu")
            return self._model

    def _encode(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        vectors = self._load().encode(texts, batch_size=16, normalize_embeddings=True, convert_to_numpy=True)
        return [[float(x) for x in v] for v in vectors]

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._encode([f"passage: {t}" for t in texts])

    def embed_query(self, text: str) -> list[float]:
        return self._encode([f"query: {text}"])[0]


class CrossEncoderReranker:
    def __init__(self, model: str, max_length: int = 512) -> None:
        self._name, self._max_length = model, max_length
        self._model: CrossEncoder | None = None
        self._lock = threading.Lock()

    def _load(self) -> CrossEncoder:
        with self._lock:
            if self._model is None:
                self._model = CrossEncoder(self._name, max_length=self._max_length, device="cpu")
            return self._model

    def score(self, query: str, passages: list[str]) -> list[float]:
        if not passages:
            return []
        logits = self._load().predict([(query, p) for p in passages], batch_size=8, activation_fn=_identity)
        return [1.0 / (1.0 + math.exp(-float(x))) for x in logits]


def _identity(x: object) -> object:
    """Raw logits from predict(); the sigmoid above maps them to 0..1 the same way for every model version."""
    return x
