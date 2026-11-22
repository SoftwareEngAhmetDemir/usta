"""Dub timing, pure: how fast each translated speech clip must play to fit where the usta said the sentence.
tests/test_dubbing.py covers it; app/videos/pipeline.py applies the plan with ffmpeg."""

import logging
from dataclasses import dataclass

log = logging.getLogger(__name__)

MIN_TEMPO, MAX_TEMPO = 0.85, 1.25  # ffmpeg atempo range that still sounds natural


@dataclass(frozen=True)
class Slot:
    start: float  # when the original sentence starts
    end: float  # when it ends
    pause_after: float  # silence before the next sentence (or the end of the video)


@dataclass(frozen=True)
class Placement:
    start: float  # where the dubbed clip starts in the video
    tempo: float  # atempo factor (>1 = faster)
    end: float
    borrowed: float  # seconds taken from the next sentence's time because the clip did not fit


def fit_clip_to_slot(tts_sec: float, slot_sec: float, lo: float = MIN_TEMPO, hi: float = MAX_TEMPO) -> float:
    """speed_factor = tts_duration / slot_duration, clamped to [lo, hi]."""
    if slot_sec <= 0:
        return hi
    return round(min(max(tts_sec / slot_sec, lo), hi), 4)  # ffmpeg atempo takes 4 decimals


def plan_dub(slots: list[Slot], tts_seconds: list[float]) -> list[Placement]:
    """Place each clip in its sentence's slot (the sentence + the pause after it). A clip that still does not fit
    at the fastest tempo borrows time: the next clip starts after it (and may then speed up); words are never cut.
    A warning is logged when the overrun is longer than the next sentence's own pause (the dub then drifts late)."""
    placements: list[Placement] = []
    cursor = 0.0
    for i, (slot, tts) in enumerate(zip(slots, tts_seconds, strict=True)):
        start = max(slot.start, cursor)
        slot_end = slot.end + slot.pause_after
        tempo = fit_clip_to_slot(tts, slot_end - start)
        end = start + tts / tempo
        borrowed = max(end - slot_end, 0.0)
        if borrowed > (slots[i + 1].pause_after if i + 1 < len(slots) else 0.0):
            log.warning("dub clip %d overruns by %.2fs, more than the next pause; the dub drifts late", i, borrowed)
        placements.append(Placement(round(start, 3), round(tempo, 4), round(end, 3), round(borrowed, 3)))
        cursor = end
    return placements


def _ts(sec: float, sep: str) -> str:
    ms = round(max(sec, 0.0) * 1000)
    return f"{ms // 3_600_000:02d}:{ms // 60_000 % 60:02d}:{ms // 1000 % 60:02d}{sep}{ms % 1000:03d}"


def vtt(cues: list[tuple[float, float, str]]) -> str:
    body = [f"{_ts(s, '.')} --> {_ts(max(e, s + 0.5), '.')}\n{t.strip()}" for s, e, t in cues if t.strip()]
    return "WEBVTT\n\n" + "\n\n".join(body) + "\n"


def srt(cues: list[tuple[float, float, str]]) -> str:
    kept = [(s, e, t) for s, e, t in cues if t.strip()]
    body = [f"{i}\n{_ts(s, ',')} --> {_ts(max(e, s + 0.5), ',')}\n{t.strip()}" for i, (s, e, t) in enumerate(kept, 1)]
    return "\n\n".join(body) + "\n"
