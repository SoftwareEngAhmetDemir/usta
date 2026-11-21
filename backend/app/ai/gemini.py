"""Gemini implementation of app.ai.protocol.AI (google-genai SDK). The only module that talks to the LLM."""

import asyncio
import io
import json
import logging
import wave
from pathlib import Path
from typing import TypeVar

from google import genai
from google.genai import errors, types
from pydantic import BaseModel, TypeAdapter, ValidationError

from app.ai import prompts
from app.ai.protocol import AIUnavailableError, AnswerDraft, EmbedKind, Transcript
from app.config import Settings

log = logging.getLogger(__name__)
M = TypeVar("M", bound=BaseModel)

_STRINGS = TypeAdapter(list[str])


class _Points(BaseModel):
    points: list[str]


class GeminiAI:
    def __init__(self, settings: Settings) -> None:
        key = settings.gemini_api_key
        if key is None:
            raise ValueError("GeminiAI needs GEMINI_API_KEY")
        self._client = genai.Client(api_key=key.get_secret_value())
        self._model = settings.gemini_model
        self._embed_model = settings.gemini_embedding_model
        self._tts_model = settings.gemini_tts_model
        self._voice = settings.gemini_tts_voice

    async def _json(self, contents: types.ContentListUnion, schema: type[M], system: str | None = None) -> M:
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema=schema.model_json_schema(),
            system_instruction=system,
            temperature=0,
        )
        text = await self._text(contents, config)
        try:
            return schema.model_validate_json(text)
        except ValidationError as e:
            raise AIUnavailableError("Yapay zekâ beklenmeyen bir cevap verdi.") from e

    async def _text(self, contents: types.ContentListUnion, config: types.GenerateContentConfig | None = None) -> str:
        try:
            res = await self._client.aio.models.generate_content(model=self._model, contents=contents, config=config)
        except errors.APIError as e:
            log.warning("gemini generate failed: %s", e)
            raise AIUnavailableError("Yapay zekâ servisine ulaşılamadı.") from e
        return res.text or ""

    async def transcribe(self, audio: Path) -> Transcript:
        parts: list[types.PartUnion] = [
            prompts.TRANSCRIBE,
            types.Part.from_bytes(data=await asyncio.to_thread(audio.read_bytes), mime_type="audio/mpeg"),
        ]
        return await self._json(parts, Transcript)

    async def translate(self, texts: list[str], source: str, target: str) -> list[str]:
        if not texts or source == target:
            return list(texts)
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_json_schema={"type": "array", "items": {"type": "string"}},
            temperature=0,
        )
        parts: list[types.PartUnion] = [prompts.translate(source, target), json.dumps(texts, ensure_ascii=False)]
        raw = await self._text(parts, config)
        try:
            out = _STRINGS.validate_json(raw)
        except ValidationError as e:
            raise AIUnavailableError("Çeviri beklenmeyen bir cevap verdi.") from e
        if len(out) != len(texts):
            raise AIUnavailableError("Çeviri eksik döndü.")
        return out

    async def embed(self, texts: list[str], kind: EmbedKind) -> list[list[float]]:
        task = "RETRIEVAL_QUERY" if kind == "query" else "RETRIEVAL_DOCUMENT"
        vectors: list[list[float]] = []
        for start in range(0, len(texts), 100):  # API batch limit
            batch: list[types.PartUnion] = list(texts[start : start + 100])
            try:
                res = await self._client.aio.models.embed_content(
                    model=self._embed_model, contents=batch, config=types.EmbedContentConfig(task_type=task)
                )
            except errors.APIError as e:
                raise AIUnavailableError("Yapay zekâ servisine ulaşılamadı.") from e
            vectors += [list(e.values or []) for e in res.embeddings or []]
        if len(vectors) != len(texts):
            raise AIUnavailableError("Vektör sayısı eksik döndü.")
        return vectors

    async def speak(self, text: str, language: str) -> bytes:
        config = types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=self._voice))
            ),
        )
        try:
            res = await self._client.aio.models.generate_content(
                model=self._tts_model, contents=f"{prompts.speak(language)} {text}", config=config
            )
        except errors.APIError as e:
            raise AIUnavailableError("Seslendirme servisine ulaşılamadı.") from e
        parts = res.candidates[0].content.parts if res.candidates and res.candidates[0].content else None
        pcm = parts[0].inline_data.data if parts and parts[0].inline_data else None
        if not pcm:
            raise AIUnavailableError("Seslendirme boş döndü.")
        return _wav(pcm)

    async def answer(self, question: str, language: str, sources: list[str]) -> AnswerDraft:
        numbered = "\n\n".join(f"[{i}] {text}" for i, text in enumerate(sources, start=1))
        contents = f"Sources:\n{numbered}\n\nQuestion: {question}"
        return await self._json(contents, AnswerDraft, system=prompts.answer_system(language))

    async def summarize(self, pages: list[str], language: str) -> list[str]:
        document = "\n\n".join(f"--- page {i} ---\n{p}" for i, p in enumerate(pages, start=1))
        parts: list[types.PartUnion] = [prompts.summarize(language), document[:200_000]]
        return (await self._json(parts, _Points)).points

    async def read_image(self, image: Path, mime_type: str) -> str:
        data = await asyncio.to_thread(image.read_bytes)
        parts: list[types.PartUnion] = [prompts.READ_IMAGE, types.Part.from_bytes(data=data, mime_type=mime_type)]
        return await self._text(parts)


def _wav(pcm: bytes, rate: int = 24_000) -> bytes:
    """Gemini TTS returns raw 16-bit mono PCM at 24 kHz."""
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)
    return buf.getvalue()
