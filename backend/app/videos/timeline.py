"""Pure functions over a Whisper transcript: one line per sentence with its timing and speaking rate.
No I/O and no LLM, so everything here is unit-tested directly (tests/test_timeline.py)."""

import re
import statistics

from pydantic import BaseModel

from app.ai.interfaces import WhisperSegment, Word

# Sentence ends: . ! ? … and the Arabic question mark, optionally followed by closing quotes/brackets.
_SENTENCE_END = re.compile(r"[.!?…؟]+[\"')\]»”’]*$")
MAX_SENTENCE_SEC = 30.0  # unpunctuated speech is cut at a pause once a "sentence" gets this long


class Sentence(BaseModel):
    start: float
    end: float
    text: str
    avg_logprob: float = 0.0
    words: list[Word] = []
    # filled by compute_speaking_rate
    pause_before: float = 0.0
    pause_after: float = 0.0
    duration: float = 0.0
    word_count: int = 0
    words_per_sec: float = 0.0
    chars_per_sec: float = 0.0


class RateSummary(BaseModel):
    avg_words_per_sec: float
    median_words_per_sec: float
    avg_chars_per_sec: float
    median_chars_per_sec: float


def _tokens(segments: list[WhisperSegment]) -> list[tuple[Word, float]]:
    """Every word with its segment's confidence; a segment without word timings counts as one long word."""
    out: list[tuple[Word, float]] = []
    for seg in segments:
        words = seg.words or [Word(start=seg.start, end=seg.end, text=" " + seg.text.strip())]
        out += [(w, seg.avg_logprob) for w in words if w.text.strip()]
    return out


def _sentence(tokens: list[tuple[Word, float]]) -> Sentence:
    words = [w for w, _ in tokens]
    text = re.sub(r"\s+", " ", "".join(w.text if w.text.startswith(" ") else " " + w.text for w in words)).strip()
    return Sentence(
        start=words[0].start,
        end=max(w.end for w in words),
        text=text,
        avg_logprob=sum(lp for _, lp in tokens) / len(tokens),
        words=words,
    )


def build_sentence_timeline(
    segments: list[WhisperSegment], max_sentence_sec: float = MAX_SENTENCE_SEC
) -> list[Sentence]:
    """Merge or split Whisper segments so that each item is one sentence, using word timestamps.
    A sentence ends at sentence punctuation; very long unpunctuated speech is cut at a pause (or at 1.5x the limit)."""
    tokens = _tokens(segments)
    sentences: list[Sentence] = []
    current: list[tuple[Word, float]] = []
    for i, (word, logprob) in enumerate(tokens):
        current.append((word, logprob))
        nxt = tokens[i + 1][0] if i + 1 < len(tokens) else None
        length = word.end - current[0][0].start
        gap = nxt.start - word.end if nxt else 0.0
        too_long = length >= max_sentence_sec and (gap >= 0.5 or length >= max_sentence_sec * 1.5)
        if nxt is None or _SENTENCE_END.search(word.text.strip()) or too_long:
            sentences.append(_sentence(current))
            current = []
    return sentences


def compute_speaking_rate(sentences: list[Sentence], video_duration: float | None = None) -> RateSummary:
    """Fills each sentence's duration, word count, words/chars per second and the pauses around it
    (in place), and returns the video's average and median rates. Used to time the dubbing."""
    for i, s in enumerate(sentences):
        s.duration = round(max(s.end - s.start, 0.0), 3)
        s.word_count = len(s.text.split())
        s.pause_before = round(max(s.start - sentences[i - 1].end, 0.0) if i else s.start, 3)
        if i + 1 < len(sentences):
            s.pause_after = round(max(sentences[i + 1].start - s.end, 0.0), 3)
        else:
            s.pause_after = round(max((video_duration or s.end) - s.end, 0.0), 3)
        speaking = s.duration or 1e-6
        s.words_per_sec = round(s.word_count / speaking, 3)
        s.chars_per_sec = round(len(s.text.replace(" ", "")) / speaking, 3)
    wps = [s.words_per_sec for s in sentences if s.duration > 0]
    cps = [s.chars_per_sec for s in sentences if s.duration > 0]
    return RateSummary(
        avg_words_per_sec=round(statistics.fmean(wps), 3) if wps else 0.0,
        median_words_per_sec=round(statistics.median(wps), 3) if wps else 0.0,
        avg_chars_per_sec=round(statistics.fmean(cps), 3) if cps else 0.0,
        median_chars_per_sec=round(statistics.median(cps), 3) if cps else 0.0,
    )


def format_timestamp(seconds: float, with_hours: bool = False) -> str:
    """65.9 → "1:05"; with_hours (videos over an hour) → "0:01:05". Seconds are floored, never rounded up,
    so a jump to the label never starts after the sentence."""
    total = max(int(seconds), 0)
    h, rest = divmod(total, 3600)
    m, s = divmod(rest, 60)
    return f"{h}:{m:02d}:{s:02d}" if with_hours else f"{h * 60 + m}:{s:02d}"


def transcript_lines(sentences: list[Sentence], video_duration: float) -> str:
    """Readable transcript: one sentence per line, "M:SS  sentence" (or "H:MM:SS" for videos over an hour)."""
    hours = video_duration >= 3600
    return "\n".join(f"{format_timestamp(s.start, hours)}  {s.text}" for s in sentences)
