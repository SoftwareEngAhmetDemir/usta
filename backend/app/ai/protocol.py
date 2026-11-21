"""Everything the app asks an LLM for, behind one Protocol. Implementations: gemini.GeminiAI, DisabledAI,
tests/fakes.FakeAI. Outputs are schema-validated here, never trusted (CLAUDE.md rule 5)."""

from pathlib import Path
from typing import Literal, Protocol

from pydantic import BaseModel, Field


class AIUnavailableError(Exception):
    """No AI configured or the provider failed; callers fall back to a safe result (e.g. "not found")."""


class Segment(BaseModel):
    start_sec: float = Field(ge=0)
    end_sec: float = Field(ge=0)
    text: str


class Transcript(BaseModel):
    language: str  # ISO 639-1
    segments: list[Segment]


class AnswerDraft(BaseModel):
    found: bool
    answer: str = ""
    source_ids: list[int] = []  # 1-based numbers of the sources the answer used


EmbedKind = Literal["document", "query"]


class AI(Protocol):
    async def transcribe(self, audio: Path) -> Transcript: ...

    async def translate(self, texts: list[str], source: str, target: str) -> list[str]: ...

    async def embed(self, texts: list[str], kind: EmbedKind) -> list[list[float]]: ...

    async def speak(self, text: str, language: str) -> bytes:
        """Speech as WAV bytes."""
        ...

    async def answer(self, question: str, language: str, sources: list[str]) -> AnswerDraft: ...

    async def summarize(self, pages: list[str], language: str) -> list[str]: ...

    async def read_image(self, image: Path, mime_type: str) -> str: ...


class DisabledAI:
    """Used when GEMINI_API_KEY is not set: every call fails loudly instead of inventing output."""

    def _fail(self) -> AIUnavailableError:
        return AIUnavailableError("Yapay zekâ kapalı: backend/.env içinde GEMINI_API_KEY tanımlı değil.")

    async def transcribe(self, audio: Path) -> Transcript:
        raise self._fail()

    async def translate(self, texts: list[str], source: str, target: str) -> list[str]:
        raise self._fail()

    async def embed(self, texts: list[str], kind: EmbedKind) -> list[list[float]]:
        raise self._fail()

    async def speak(self, text: str, language: str) -> bytes:
        raise self._fail()

    async def answer(self, question: str, language: str, sources: list[str]) -> AnswerDraft:
        raise self._fail()

    async def summarize(self, pages: list[str], language: str) -> list[str]:
        raise self._fail()

    async def read_image(self, image: Path, mime_type: str) -> str:
        raise self._fail()
