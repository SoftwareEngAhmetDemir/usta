import io
import wave

import httpx
import pytest

from app.ai.google_free import (
    TRANSLATE_URL,
    TTS_URL,
    GoogleFreeTranslator,
    GoogleFreeTTS,
    parse_translation,
    split_for_speech,
)  # fmt: skip
from app.ai.interfaces import AIUnavailableError


def _mp3() -> bytes:
    """A short real MP3 (the speech endpoint's format), made once with ffmpeg."""
    import subprocess

    return subprocess.run(
        ["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "sine=frequency=300:duration=0.5", "-f", "mp3", "pipe:1"],  # noqa: S607
        capture_output=True, check=True,
    ).stdout  # fmt: skip


def test_parse_translation_joins_the_pieces() -> None:
    payload = [
        [["Lock the switch. ", "Şalteri kilitleyin. ", None, None, 10], ["Nozzle every 8 h.", "Nozul 8 saatte.", None]],
        None,
        "tr",
    ]
    assert parse_translation(payload) == "Lock the switch. Nozzle every 8 h."
    with pytest.raises(AIUnavailableError):
        parse_translation({"error": "x"})


def test_split_for_speech_keeps_pieces_under_the_limit() -> None:
    text = "Bakıma başlamadan önce makinenin enerjisini mutlaka kesin. " * 5
    pieces = split_for_speech(text, limit=60)
    assert all(len(p) <= 60 for p in pieces) and " ".join(pieces) == " ".join(text.split())
    assert split_for_speech("x" * 130, limit=60) == ["x" * 60, "x" * 60, "x" * 10]
    assert split_for_speech("   ") == []


async def test_translator_calls_the_free_endpoint_per_text_and_retries() -> None:
    seen: list[dict[str, str]] = []
    failures = iter([429])

    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url).startswith(TRANSLATE_URL)
        if (status := next(failures, 200)) != 200:
            return httpx.Response(status)
        params = dict(request.url.params)
        seen.append(params)
        return httpx.Response(200, json=[[[f"<{params['tl']}> {params['q']}", params["q"]]]])

    t = GoogleFreeTranslator(httpx.AsyncClient(transport=httpx.MockTransport(handler)))
    assert await t.translate(["Merhaba", "Nozul"], "tr", "en") == ["<en> Merhaba", "<en> Nozul"]
    assert {(p["sl"], p["tl"], p["client"]) for p in seen} == {("tr", "en", "gtx")}
    assert await t.translate(["x"], "tr", "tr") == ["x"]  # same language: no call


async def test_translator_gives_up_with_a_clear_error() -> None:
    t = GoogleFreeTranslator(httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(403))))
    with pytest.raises(AIUnavailableError, match="Çeviri servisine ulaşılamadı"):
        await t.translate(["Merhaba"], "tr", "en")


async def test_tts_joins_pieces_and_returns_a_readable_wav() -> None:
    mp3 = _mp3()
    asked: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        assert str(request.url).startswith(TTS_URL) and request.url.params["tl"] == "tr"
        asked.append(request.url.params["q"])
        return httpx.Response(200, content=mp3, headers={"content-type": "audio/mpeg"})

    tts = GoogleFreeTTS(httpx.AsyncClient(transport=httpx.MockTransport(handler)))
    wav = await tts.synthesize("Kısa cümle. " + "uzun " * 60, "tr")
    assert len(asked) >= 2 and all(len(q) <= 180 for q in asked)
    with wave.open(io.BytesIO(wav)) as w:  # real header: the dub timing reads its duration
        assert (w.getframerate(), w.getnchannels()) == (24_000, 1)
        assert w.getnframes() / w.getframerate() > 0.5


async def test_translator_pauses_when_google_throttles(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.ai.google_free.asyncio.sleep", _no_sleep)
    calls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request.url.params["q"])
        return httpx.Response(429)

    t = GoogleFreeTranslator(httpx.AsyncClient(transport=httpx.MockTransport(handler)))
    with pytest.raises(AIUnavailableError):
        await t.translate(["Merhaba"], "tr", "en")
    assert len(calls) == 2  # a second 429 in a row: no more retries
    with pytest.raises(AIUnavailableError, match="yoğun"):
        await t.translate(["Nozul", "Elektrot"], "tr", "en")
    assert len(calls) == 2  # during the pause nothing is sent at all


async def _no_sleep(_: float) -> None:
    return None
