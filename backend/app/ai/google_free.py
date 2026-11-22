"""Google's free, key-less endpoints (the ones translate.google.com uses): machine translation and speech.
No Cloud console, project or login needed. Unofficial: no SLA and rate-limited, so calls are few at a time, retried
with backoff, and fail as AIUnavailableError (a failed dub step can be retried)."""

import asyncio
import logging
import re
import tempfile
from pathlib import Path

import httpx

from app.ai.interfaces import AIUnavailableError

log = logging.getLogger(__name__)

TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
TTS_URL = "https://translate.google.com/translate_tts"
TTS_MAX_CHARS = 180  # the speech endpoint reads at most ~200 characters per request
_PARALLEL = 4
_ATTEMPTS = 4


def parse_translation(payload: object) -> str:
    """Join the translated pieces of a translate_a/single response: [[["translated", "original", ...], ...], ...]."""
    pieces = payload[0] if isinstance(payload, list) and payload else None
    if not isinstance(pieces, list):
        raise AIUnavailableError("Çeviri servisi beklenmeyen bir cevap verdi.")
    return "".join(p[0] for p in pieces if isinstance(p, list) and p and isinstance(p[0], str))


def split_for_speech(text: str, limit: int = TTS_MAX_CHARS) -> list[str]:
    """Pieces of at most `limit` characters, cut after sentence punctuation or between words when possible."""
    pieces: list[str] = []
    for sentence in re.split(r"(?<=[.!?…؟;:,،])\s+", " ".join(text.split())):
        current = ""
        for word in sentence.split(" "):
            while len(word) > limit:  # one huge "word" (a URL, a code): hard cut
                if current:
                    pieces.append(current)
                    current = ""
                pieces.append(word[:limit])
                word = word[limit:]
            if current and len(current) + 1 + len(word) > limit:
                pieces.append(current)
                current = word
            else:
                current = f"{current} {word}".strip()
        if current:
            pieces.append(current)
    return [p for p in pieces if p]


class _FreeEndpoint:
    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client or httpx.AsyncClient(timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        self._limit = asyncio.Semaphore(_PARALLEL)

    async def _get(self, url: str, params: dict[str, str], what: str) -> httpx.Response:
        delay = 1.0
        for attempt in range(1, _ATTEMPTS + 1):
            try:
                async with self._limit:
                    res = await self._client.get(url, params=params)
                if res.status_code == 200:
                    return res
                if res.status_code not in (429, 500, 502, 503, 504):
                    break
                log.warning("%s: HTTP %s (attempt %d)", what, res.status_code, attempt)
            except httpx.HTTPError as e:
                log.warning("%s: %s (attempt %d)", what, e, attempt)
            if attempt < _ATTEMPTS:
                await asyncio.sleep(delay)
                delay *= 2
        raise AIUnavailableError(f"{what} servisine ulaşılamadı.")


class GoogleFreeTranslator(_FreeEndpoint):
    async def _one(self, text: str, source: str, target: str) -> str:
        if not text.strip():
            return text
        params = {"client": "gtx", "sl": source, "tl": target, "dt": "t", "q": text}
        res = await self._get(TRANSLATE_URL, params, "Çeviri")
        try:
            return parse_translation(res.json())
        except ValueError as e:  # not JSON
            raise AIUnavailableError("Çeviri servisi beklenmeyen bir cevap verdi.") from e

    async def translate(self, texts: list[str], source: str, target: str) -> list[str]:
        if not texts or source == target:
            return list(texts)
        return list(await asyncio.gather(*(self._one(t, source, target) for t in texts)))


class GoogleFreeTTS(_FreeEndpoint):
    """Speech as 24 kHz mono WAV (the endpoint returns MP3 pieces; ffmpeg joins and converts them)."""

    async def synthesize(self, text: str, language: str) -> bytes:
        mp3 = b""
        for piece in split_for_speech(text):
            params = {"ie": "UTF-8", "client": "tw-ob", "tl": language, "q": piece}
            mp3 += (await self._get(TTS_URL, params, "Seslendirme")).content
        if not mp3:
            raise AIUnavailableError("Seslendirilecek metin yok.")
        return await _mp3_to_wav(mp3)


async def _mp3_to_wav(mp3: bytes) -> bytes:
    """Via temp files: a WAV written to a pipe has no lengths in its header, which breaks reading its duration."""
    with tempfile.TemporaryDirectory(prefix="usta-tts-") as tmp:
        src, dst = Path(tmp) / "speech.mp3", Path(tmp) / "speech.wav"
        src.write_bytes(mp3)
        proc = await asyncio.create_subprocess_exec(
            "ffmpeg", "-y", "-v", "error", "-i", str(src), "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", str(dst),
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )  # fmt: skip
        _, err = await proc.communicate()
        if proc.returncode != 0 or not dst.exists():
            raise AIUnavailableError(f"Seslendirme dönüştürülemedi: {err.decode(errors='replace')[:200]}")
        return dst.read_bytes()
