"""ffmpeg/ffprobe wrappers (subprocesses, at most 2 at a time) and the dub-track assembly."""

import asyncio
import json
import wave
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

_LIMIT = asyncio.Semaphore(2)


class MediaError(Exception):
    pass


async def _run(*args: str) -> bytes:
    async with _LIMIT:
        proc = await asyncio.create_subprocess_exec(
            *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        out, err = await proc.communicate()
    if proc.returncode != 0:
        tail = err.decode(errors="replace").strip().splitlines()[-1:] or ["?"]
        raise MediaError(f"Video işlenemedi ({args[0]}): {tail[0][:200]}")
    return out


async def duration(path: Path) -> float:
    out = await _run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path))
    try:
        return float(json.loads(out)["format"]["duration"])
    except (KeyError, ValueError, TypeError) as e:
        raise MediaError("Video süresi okunamadı.") from e


async def transcode(src: Path, dst: Path) -> None:
    """H.264/AAC MP4 that every phone plays, at most 1280 px wide, with the index at the front for streaming."""
    await _run(
        "ffmpeg", "-y", "-v", "error", "-i", str(src),
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-vf", "scale='min(1280,iw)':-2",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(dst),
    )  # fmt: skip


async def thumbnail(src: Path, dst: Path, at_sec: float) -> None:
    await _run(
        "ffmpeg",
        "-y",
        "-v",
        "error",
        "-ss",
        f"{at_sec:.2f}",
        "-i",
        str(src),
        "-frames:v",
        "1",
        "-vf",
        "scale=480:-2",
        str(dst),
    )


async def extract_audio(src: Path, dst: Path) -> None:
    """16 kHz mono 16-bit WAV: what Whisper expects."""
    await _run(
        "ffmpeg", "-y", "-v", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(dst)
    )


async def gray_frame(src: Path, at_sec: float, width: int = 320) -> NDArray[np.uint8] | None:
    """One frame as a small grayscale image (for sharpness), or None past the end of the video."""
    out = await _run(
        "ffmpeg", "-v", "error", "-ss", f"{at_sec:.2f}", "-i", str(src), "-frames:v", "1",
        "-vf", f"scale={width}:-2,format=gray", "-f", "image2pipe", "-vcodec", "pgm", "-",
    )  # fmt: skip
    return _pgm(out)


def _pgm(data: bytes) -> NDArray[np.uint8] | None:
    """Binary PGM (P5) → 2-D array."""
    parts = data.split(maxsplit=4)
    if len(parts) < 5 or parts[0] != b"P5":
        return None
    w, h = int(parts[1]), int(parts[2])
    pixels = np.frombuffer(parts[4][: w * h], dtype=np.uint8)
    return pixels.reshape(h, w) if pixels.size == w * h else None


async def save_frame(src: Path, at_sec: float, dst: Path, max_width: int = 640) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    await _run("ffmpeg", "-y", "-v", "error", "-ss", f"{at_sec:.2f}", "-i", str(src), "-frames:v", "1",
               "-vf", f"scale='min({max_width},iw)':-2", "-q:v", "3", str(dst))  # fmt: skip


def wav_seconds(path: Path) -> float:
    with wave.open(str(path)) as w:
        return float(w.getnframes()) / float(w.getframerate())


async def retime(src: Path, dst: Path, tempo: float, rate: int = 24_000) -> None:
    """Speed a speech clip up or down without changing its pitch (atempo), as mono WAV at `rate`."""
    await _run("ffmpeg", "-y", "-v", "error", "-i", str(src), "-filter:a", f"atempo={tempo:.4f}",
               "-ac", "1", "-ar", str(rate), "-c:a", "pcm_s16le", str(dst))  # fmt: skip


def place_clips(clips: list[tuple[float, Path]], total_sec: float, dst: Path, rate: int = 24_000) -> None:
    """One mono WAV of `total_sec` with each (start, wav) clip mixed in at its start (blocking; numpy).
    Every clip must already be mono 16-bit at `rate` (see retime)."""
    track = np.zeros(int(total_sec * rate) + rate, dtype=np.int32)
    for start, clip in clips:
        with wave.open(str(clip)) as w:
            samples = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.int32)
        at = int(start * rate)
        if at + len(samples) > len(track):
            track = np.pad(track, (0, at + len(samples) - len(track)))
        track[at : at + len(samples)] += samples
    with wave.open(str(dst), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(np.clip(track, -32768, 32767).astype(np.int16).tobytes())


async def dub_track(voice: Path, video: Path, dst: Path, bed_volume: float = 0.15) -> None:
    """The dubbed audio: the translated voice over the original sound turned down (machine noise keeps the
    context). shortcut: the usta's own voice is ducked, not removed; separating it needs a model (KAN-51, Demucs)."""
    await _run(
        "ffmpeg", "-y", "-v", "error", "-i", str(voice), "-i", str(video),
        "-filter_complex",
        f"[1:a]aresample=24000,volume={bed_volume}[bed];[0:a][bed]amix=inputs=2:duration=longest:normalize=0[a]",
        "-map", "[a]", "-c:a", "aac", "-b:a", "128k", str(dst),
    )  # fmt: skip


def _iso639_2(code: str) -> str:
    """MP4 language tags are 3 letters."""
    return {"tr": "tur", "en": "eng", "ar": "ara"}.get(code, code)


async def mux_dub(video: Path, dub: Path, dst: Path, language: str, original_language: str) -> None:
    """MP4 with the dubbed track first (default; what browsers play) and the original audio as a second track."""
    await _run(
        "ffmpeg", "-y", "-v", "error", "-i", str(video), "-i", str(dub),
        "-map", "0:v", "-map", "1:a", "-map", "0:a?", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
        "-metadata:s:a:0", f"language={_iso639_2(language)}",
        "-metadata:s:a:1", f"language={_iso639_2(original_language)}",
        "-disposition:a:0", "default", "-disposition:a:1", "0", "-movflags", "+faststart", str(dst),
    )  # fmt: skip
