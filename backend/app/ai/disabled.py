"""Stand-in when Gemini is not configured: answers, summaries and transcript corrections fail loudly instead of
inventing output (callers fall back: "not found", no summary, Whisper's own text)."""

from app.ai.interfaces import AIUnavailableError, AnswerDraft

_MESSAGE = "Yapay zekâ kapalı: backend/.env içinde VERTEX_PROJECT_ID (veya GEMINI_API_KEY) tanımlı değil."


class DisabledLLM:
    async def answer(self, question: str, language: str, sources: list[str]) -> AnswerDraft:
        raise AIUnavailableError(_MESSAGE)

    async def summarize(self, pages: list[str], language: str) -> list[str]:
        raise AIUnavailableError(_MESSAGE)

    async def refine_transcript(self, sentences: list[str], language: str, context: str) -> list[str]:
        raise AIUnavailableError(_MESSAGE)
