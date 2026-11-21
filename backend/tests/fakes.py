"""Deterministic stand-in for app.ai.protocol.AI, so tests never call Gemini."""

import hashlib
import io
import math
import wave
from pathlib import Path

from app.ai.protocol import AIUnavailableError, AnswerDraft, EmbedKind, Segment, Transcript


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


class FakeAI:
    def __init__(self) -> None:
        self.transcript = Transcript(
            language="tr",
            segments=[
                Segment(start_sec=0.0, end_sec=1.0, text="Önce makineyi kapatın."),
                Segment(start_sec=1.0, end_sec=2.5, text="Sonra elektrotu yenisiyle değiştirin."),
            ],
        )
        self.draft: AnswerDraft | None = None  # None: answer from the first source
        self.fail: set[str] = set()  # method names that raise AIUnavailableError
        self.calls: list[str] = []

    def _call(self, name: str) -> None:
        self.calls.append(name)
        if name in self.fail:
            raise AIUnavailableError(f"fake {name} failed")

    async def transcribe(self, audio: Path) -> Transcript:
        self._call("transcribe")
        return self.transcript

    async def translate(self, texts: list[str], source: str, target: str) -> list[str]:
        self._call("translate")
        return [f"[{target}] {t}" for t in texts]

    async def embed(self, texts: list[str], kind: EmbedKind) -> list[list[float]]:
        self._call("embed")
        return [trigram_vector(t) for t in texts]

    async def speak(self, text: str, language: str) -> bytes:
        self._call("speak")
        return silent_wav()

    async def answer(self, question: str, language: str, sources: list[str]) -> AnswerDraft:
        self._call("answer")
        return self.draft or AnswerDraft(found=True, answer=f"[{language}] {sources[0]}", source_ids=[1])

    async def summarize(self, pages: list[str], language: str) -> list[str]:
        self._call("summarize")
        return [f"Özet: {pages[0].strip()[:40]}", "Bakımdan önce enerjiyi kesin."]

    async def read_image(self, image: Path, mime_type: str) -> str:
        self._call("read_image")
        return "Fotoğraftaki doküman metni"
