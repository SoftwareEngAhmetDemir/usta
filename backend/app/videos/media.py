"""ffmpeg/ffprobe wrappers. All heavy work runs in subprocesses, at most 2 at a time."""

import asyncio
import json
import wave
from pathlib import Path

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


async def speech_audio(src: Path, dst: Path) -> None:
    """Small mono MP3 for transcription."""
    await _run(
        "ffmpeg", "-y", "-v", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", "16000", "-b:a", "48k", str(dst)
    )


async def background_audio(src: Path, dst: Path) -> None:
    await _run("ffmpeg", "-y", "-v", "error", "-i", str(src), "-vn", "-ac", "2", "-ar", "44100", str(dst))


def wav_seconds(path: Path) -> float:
    with wave.open(str(path)) as w:
        return float(w.getnframes()) / float(w.getframerate())


async def mix_dub(video: Path, background: Path, clips: list[tuple[float, float, Path]], dst: Path) -> None:
    """Mux `video` with `background` (quieter) plus each (start, slot_end, wav) voice clip placed at its start.
    A clip longer than its slot is sped up (max 1.6x) so it ends near the next sentence.
    shortcut: the original voice is ducked, not removed; true voice separation needs a separate model."""
    inputs: list[str] = ["-i", str(video), "-i", str(background)]
    filters = ["[1:a]volume=0.18[bg]"]
    labels = ["[bg]"]
    for i, (start, slot_end, clip) in enumerate(clips):
        inputs += ["-i", str(clip)]
        slot = max(slot_end - start, 0.5)
        tempo = min(max(wav_seconds(clip) / slot, 1.0), 1.6)
        delay = int(start * 1000)
        filters.append(f"[{i + 2}:a]atempo={tempo:.3f},adelay={delay}:all=1[v{i}]")
        labels.append(f"[v{i}]")
    filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:duration=first:normalize=0[aout]")
    await _run(
        "ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(filters),
        "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart", str(dst),
    )  # fmt: skip


def vtt(segments: list[tuple[float, float, str]]) -> str:
    def ts(sec: float) -> str:
        ms = round(sec * 1000)
        return f"{ms // 3_600_000:02d}:{ms // 60_000 % 60:02d}:{ms // 1000 % 60:02d}.{ms % 1000:03d}"

    cues = [f"{ts(s)} --> {ts(max(e, s + 0.5))}\n{text.strip()}" for s, e, text in segments if text.strip()]
    return "WEBVTT\n\n" + "\n\n".join(cues) + "\n"
