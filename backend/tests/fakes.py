"""Deterministic stand-ins for the engines in app.ai.interfaces, so tests never load models or call Google.
The vector store in tests is the real ChromaVectorStore, in memory."""

import hashlib
import io
import math
import wave
from pathlib import Path

from app.ai.chroma import ChromaVectorStore
from app.ai.interfaces import (
    AIServices,
    AIUnavailableError,
    AnswerDraft,
    TranscriptionResult,
    WhisperSegment,
    Word,
)  # fmt: skip
from app.search.keyword import tokenize

TESSDATA = Path(__file__).resolve().parent.parent / ".tessdata"  # eng + tur (+ ara), see CLAUDE.md


def silent_wav(seconds: float = 0.5, rate: int = 24_000) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b"\x00\x00" * int(seconds * rate))
    return buf.getvalue()


def trigram_vector(text: str, dims: int = 256) -> list[float]:
    """Similar wording → similar vectors (character trigrams hashed into `dims` buckets)."""
    vec = [0.0] * dims
    for word in text.lower().split():
        word = f" {word} "
        for i in range(len(word) - 2):
            vec[int(hashlib.md5(word[i : i + 3].encode()).hexdigest(), 16) % dims] += 1  # noqa: S324
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def segment(start: float, text: str, seconds_per_word: float = 0.4, logprob: float = -0.2) -> WhisperSegment:
    """A Whisper segment with evenly spaced word timings."""
    words = [
        Word(
            start=round(start + i * seconds_per_word, 3), end=round(start + (i + 1) * seconds_per_word, 3), text=" " + w
        )
        for i, w in enumerate(text.split())
    ]
    return WhisperSegment(start=start, end=words[-1].end, text=text, avg_logprob=logprob, words=words)


class _Failing:
    def __init__(self) -> None:
        self.fail = False
        self.calls = 0

    def _call(self) -> None:
        self.calls += 1
        if self.fail:
            raise AIUnavailableError(f"fake {type(self).__name__} failed")


class FakeTranscriber(_Failing):
    def __init__(self) -> None:
        super().__init__()
        self.hints: list[str | None] = []
        self.result = TranscriptionResult(
            language="tr",
            segments=[segment(0.0, "Önce makineyi kapatın."), segment(1.4, "Sonra elektrotu yenisiyle değiştirin.")],
        )

    def transcribe(self, audio: Path, language_hint: str | None) -> TranscriptionResult:
        self._call()
        self.hints.append(language_hint)
        return self.result


class FakeEmbedder(_Failing):
    model_version = "fake-trigram-v1"

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        self._call()
        return [trigram_vector(t) for t in texts]

    def embed_query(self, text: str) -> list[float]:
        self._call()
        return trigram_vector(text)


class FakeReranker(_Failing):
    """Score = share of the question's words found in the passage."""

    def score(self, query: str, passages: list[str]) -> list[float]:
        self._call()
        q = set(tokenize(query))
        return [len(q & set(tokenize(p))) / (len(q) or 1) for p in passages]


class FakeTranslator(_Failing):
    def __init__(self) -> None:
        super().__init__()
        self.table: dict[str, str] = {}  # known translations; anything else becomes "[target] text"

    async def translate(self, texts: list[str], source: str, target: str) -> list[str]:
        if source == target:
            return list(texts)
        self._call()
        return [self.table.get(t, f"[{target}] {t}") for t in texts]


class FakeTTS(_Failing):
    async def synthesize(self, text: str, language: str) -> bytes:
        self._call()
        return silent_wav(0.05 * len(text))  # about 20 characters per second


class FakeLLM(_Failing):
    def __init__(self) -> None:
        super().__init__()
        self.draft: AnswerDraft | None = None  # None: answer from the first source
        self.sources: list[str] = []  # what the last answer() call was given
        self.corrections: dict[str, str] = {}  # refine_transcript: sentence → corrected sentence (else unchanged)
        self.context = ""  # what the last refine_transcript() was told about the video
        self.rewrites: list[str] = []  # search_queries() returns these
        self.rewrite_context = ""  # what the last search_queries() was told about the machine

    async def answer(self, question: str, language: str, sources: list[str]) -> AnswerDraft:
        self._call()
        self.sources = sources
        return self.draft or AnswerDraft(found=True, answer=f"[{language}] {sources[0]}", source_ids=[1])

    async def search_queries(self, question: str, languages: list[str], context: str) -> list[str]:
        if self.fail:  # not counted in `calls` (those are answer/summary/refine calls the tests assert on)
            raise AIUnavailableError("fake FakeLLM failed")
        self.rewrite_context = context
        return self.rewrites

    async def refine_transcript(self, sentences: list[str], language: str, context: str) -> list[str]:
        self._call()
        self.context = context
        return [self.corrections.get(s, s) for s in sentences]

    async def summarize(self, pages: list[str], language: str) -> list[str]:
        self._call()
        return [f"Özet: {pages[0].strip()[:40]}", "Bakımdan önce enerjiyi kesin."]


class FakeAI:
    """The fakes, typed, plus the AIServices built from them (what the app gets)."""

    def __init__(self) -> None:
        self.transcriber = FakeTranscriber()
        self.embedder = FakeEmbedder()
        self.reranker = FakeReranker()
        self.vectors = ChromaVectorStore(None)
        self.vectors.reset()  # the in-memory client is shared within the process
        self.translator = FakeTranslator()
        self.tts = FakeTTS()
        self.llm = FakeLLM()
        self.services = AIServices(
            transcriber=self.transcriber, embedder=self.embedder, reranker=self.reranker, vectors=self.vectors,
            translator=self.translator, tts=self.tts, llm=self.llm, ocr_languages="tur+eng", tessdata_dir=TESSDATA,
        )  # fmt: skip
