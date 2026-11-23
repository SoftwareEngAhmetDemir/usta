"""The swappable engines behind the knowledge pipelines. Only `LLMClient` uses an LLM: the final "Makineye sor"
answer, document summaries (KAN-44) and correcting Whisper transcripts; everything else runs without one.

Implementations: app/ai/{whisper,local_models,chroma,google_free,gemini}.py; tests use tests/fakes.py.
Provider output is schema-validated before use (CLAUDE.md rule 5)."""

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from pydantic import BaseModel, Field


class AIUnavailableError(Exception):
    """An engine is not configured or failed; callers fall back to a safe result (e.g. "not found")."""


# ---- transcription ----


class Word(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(ge=0)
    text: str  # as the model returns it, usually with a leading space
    probability: float = 1.0


class WhisperSegment(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(ge=0)
    text: str
    avg_logprob: float = 0.0  # confidence: closer to 0 is better, below about -1 is doubtful
    words: list[Word] = []


class TranscriptionResult(BaseModel):
    language: str  # ISO 639-1, detected
    segments: list[WhisperSegment]


class Transcriber(Protocol):
    def transcribe(self, audio: Path, language_hint: str | None) -> TranscriptionResult:
        """16 kHz mono WAV → segments with word timestamps. Blocking: call it in a thread."""
        ...


# ---- embeddings, rerank, vectors ----


class Embedder(Protocol):
    @property
    def model_version(self) -> str:
        """Stored on every chunk; a different value means the chunk must be re-embedded."""
        ...

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Unit-length vectors. Blocking."""
        ...

    def embed_query(self, text: str) -> list[float]: ...


class Reranker(Protocol):
    def score(self, query: str, passages: list[str]) -> list[float]:
        """Relevance in 0..1 for each passage (cross-encoder). Blocking."""
        ...


@dataclass(frozen=True)
class VectorHit:
    chunk_id: int
    score: float  # cosine similarity


class VectorStore(Protocol):
    def upsert(self, ids: list[int], vectors: list[list[float]], metadata: list[dict[str, str | int | float]]) -> None:
        """Every item's metadata includes machine_id, so a search can be limited to one machine."""
        ...

    def query(self, vector: list[float], machine_id: int, k: int) -> list[VectorHit]: ...

    def delete(self, ids: list[int]) -> None: ...


# ---- dubbing: machine translation and speech ----


class Translator(Protocol):
    async def translate(self, texts: list[str], source: str, target: str) -> list[str]:
        """Machine translation (not an LLM). Same length and order as `texts`. source "auto" = detect it."""
        ...


class TTSEngine(Protocol):
    async def synthesize(self, text: str, language: str) -> bytes:
        """Speech as WAV bytes."""
        ...


# ---- the LLM ----


class AnswerDraft(BaseModel):
    found: bool
    answer: str = ""
    source_ids: list[int] = []  # 1-based numbers of the sources the answer used


class LLMClient(Protocol):
    async def answer(self, question: str, language: str, sources: list[str]) -> AnswerDraft: ...

    async def summarize(self, pages: list[str], language: str) -> list[str]: ...

    async def search_queries(self, question: str, languages: list[str], context: str) -> list[str]:
        """The question rewritten as short standalone search queries in each of `languages` (who "you" is, vague
        words spelled out with the words a transcript or manual would use). Retrieval only, never shown.
        `context`: the machine, its ustas and what its knowledge is about."""
        ...

    async def refine_transcript(self, sentences: list[str], language: str, context: str) -> list[str]:
        """Speech-recognition errors fixed, one output per input sentence in the same order (timing is kept).
        `context`: what the video is about (machine, model, title), to get technical terms right."""
        ...


@dataclass
class AIServices:
    """Everything the pipelines need, built once in create_app (tests pass fakes)."""

    transcriber: Transcriber
    embedder: Embedder
    reranker: Reranker
    vectors: VectorStore
    translator: Translator
    tts: TTSEngine
    llm: LLMClient
    ocr_languages: str = "tur+eng+ara"  # Tesseract language packs, e.g. "tur+eng"
    tessdata_dir: Path | None = None  # None = the system's Tesseract data
