"""Gemini (google-genai SDK; API key or Vertex AI): the LLMClient. The only module that talks to an LLM, and only
for the final answer and document summaries."""

import logging
from typing import TypeVar

from google import genai
from google.genai import errors, types
from pydantic import BaseModel, ValidationError

from app.ai import prompts
from app.ai.interfaces import AIUnavailableError, AnswerDraft
from app.config import Settings

log = logging.getLogger(__name__)
M = TypeVar("M", bound=BaseModel)

# Rate limits (429) and server hiccups are common when jobs run in parallel: retry with backoff before giving up.
_RETRY = types.HttpOptions(retry_options=types.HttpRetryOptions(attempts=5, initial_delay=2, max_delay=30))


class _Points(BaseModel):
    points: list[str]


class _Sentence(BaseModel):
    id: int
    text: str


class _Sentences(BaseModel):
    sentences: list[_Sentence]


REFINE_BATCH = 60  # sentences per call: long videos are corrected in parts


def client(settings: Settings) -> genai.Client:
    key = settings.gemini_api_key
    if key is not None:
        return genai.Client(api_key=key.get_secret_value(), http_options=_RETRY)
    if settings.vertex_project_id:  # Vertex AI with the machine's gcloud application-default credentials
        return genai.Client(
            vertexai=True, project=settings.vertex_project_id, location=settings.vertex_region, http_options=_RETRY
        )
    raise ValueError("Gemini needs GEMINI_API_KEY or VERTEX_PROJECT_ID")


class GeminiLLM:
    def __init__(self, settings: Settings) -> None:
        self._client = client(settings)
        self._model = settings.gemini_model

    async def _json(self, contents: types.ContentListUnion, schema: type[M], system: str | None = None) -> M:
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=schema.model_json_schema(),
            system_instruction=system,
            temperature=0,
        )
        try:
            res = await self._client.aio.models.generate_content(model=self._model, contents=contents, config=config)
        except errors.APIError as e:
            log.warning("gemini generate failed: %s", e)
            raise AIUnavailableError("Yapay zekâ servisine ulaşılamadı.") from e
        try:
            return schema.model_validate_json(res.text or "")
        except ValidationError as e:
            raise AIUnavailableError("Yapay zekâ beklenmeyen bir cevap verdi.") from e

    async def answer(self, question: str, language: str, sources: list[str]) -> AnswerDraft:
        return await self._json(
            prompts.answer_user(question, language, sources), AnswerDraft, system=prompts.answer_system(language)
        )

    async def refine_transcript(self, sentences: list[str], language: str, context: str) -> list[str]:
        """Corrected sentences; a sentence the model skipped stays as it was (the caller also checks each one)."""
        out = list(sentences)
        system = prompts.refine_transcript(language, context)
        for start in range(0, len(sentences), REFINE_BATCH):
            batch = sentences[start : start + REFINE_BATCH]
            numbered = "\n".join(f"{i}. {text}" for i, text in enumerate(batch, start=1))
            result = await self._json(numbered, _Sentences, system=system)
            for s in result.sentences:
                if 1 <= s.id <= len(batch):
                    out[start + s.id - 1] = s.text
        return out

    async def summarize(self, pages: list[str], language: str) -> list[str]:
        document = "\n\n".join(f"--- page {i} ---\n{p}" for i, p in enumerate(pages, start=1))
        parts: list[types.PartUnion] = [prompts.summarize(language), document[:200_000]]
        return (await self._json(parts, _Points)).points
