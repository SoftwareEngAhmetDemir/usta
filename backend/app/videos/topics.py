"""Topic segmentation without an LLM (TextTiling): at each gap between sentences, compare the sentences before and
after it by meaning (embeddings) and by shared words (lexical cohesion). Where that similarity dips deeply compared
with the peaks around it, a new topic starts. Pure; tests/test_topics.py.

Why both: a whole usta video is about one machine, so embeddings alone rate every sentence as similar (live check
2026-11-22: 0.85-0.95 everywhere, the real topic change was not even a dip); shared words ("torç" vs "nozul")
show the change clearly."""

import math
import statistics
from collections import Counter
from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray

from app.search.keyword import tokenize


@dataclass(frozen=True)
class TopicSpan:
    first: int  # index of the first sentence
    last: int  # index of the last sentence (inclusive)


def gap_similarities(vectors: list[list[float]], window: int = 2) -> list[float]:
    """For each gap between sentence i-1 and i (i = 1..n-1): cosine of the mean of the `window` sentences
    before it and the mean of the `window` sentences after it."""
    v: NDArray[np.float64] = np.asarray(vectors, dtype=np.float64)
    sims: list[float] = []
    for i in range(1, len(v)):
        left, right = v[max(0, i - window) : i].mean(axis=0), v[i : i + window].mean(axis=0)
        norm = float(np.linalg.norm(left) * np.linalg.norm(right))
        sims.append(float(left @ right / norm) if norm else 0.0)
    return sims


def _stems(text: str) -> Counter[str]:
    """Content words cut to 5 letters: a simple, effective stemmer for Turkish suffixes (yüksekliği → yukse)."""
    return Counter(t[:5] for t in tokenize(text) if len(t) > 2 and not t.isdigit())


def lexical_gap_similarities(texts: list[str], window: int = 2) -> list[float]:
    """Like gap_similarities, but over word-stem counts (TextTiling's lexical cohesion)."""
    bags = [_stems(t) for t in texts]
    sims: list[float] = []
    for i in range(1, len(bags)):
        left, right = sum(bags[max(0, i - window) : i], Counter()), sum(bags[i : i + window], Counter())
        dot = sum(left[k] * right[k] for k in left)
        norm = math.sqrt(sum(x * x for x in left.values())) * math.sqrt(sum(x * x for x in right.values()))
        sims.append(dot / norm if norm else 0.0)
    return sims


def depth_scores(sims: list[float]) -> list[float]:
    """TextTiling depth: how far each gap's similarity lies below the nearest peak on its left and on its right."""
    out: list[float] = []
    for i, s in enumerate(sims):
        left = i
        while left > 0 and sims[left - 1] >= sims[left]:
            left -= 1
        right = i
        while right < len(sims) - 1 and sims[right + 1] >= sims[right]:
            right += 1
        out.append((sims[left] - s) + (sims[right] - s))
    return out


def _length(starts: list[float], ends: list[float], first: int, last: int) -> float:
    return ends[last] - starts[first]


def _best_split(
    depths: list[float], starts: list[float], ends: list[float], first: int, last: int, min_sec: float
) -> int | None:
    """Deepest gap inside [first, last] that leaves both sides at least min_sec (else any gap); on equal depth the
    gap nearest the middle, so a long uniform stretch is halved, not trimmed."""
    middle = (starts[first] + ends[last]) / 2
    gaps = sorted(range(first + 1, last + 1), key=lambda g: (-round(depths[g - 1], 3), abs(starts[g] - middle)))
    for g in gaps:
        if _length(starts, ends, first, g - 1) >= min_sec and _length(starts, ends, g, last) >= min_sec:
            return g
    return gaps[0] if gaps else None


def detect_topic_boundaries(
    starts: list[float],
    ends: list[float],
    vectors: list[list[float]],
    texts: list[str],
    *,
    window: int = 2,
    depth_sd: float = 0.5,
    min_sec: float = 20.0,
    max_sec: float = 180.0,
) -> list[TopicSpan]:
    """Topic spans over the sentences (start/end times, unit embeddings, texts). A gap is a boundary when its depth
    is above mean + depth_sd x standard deviation of all depths (the tuned threshold), deepest first, but never
    creating a topic shorter than `min_sec`; a topic still longer than `max_sec` is split at its deepest gap."""
    n = len(starts)
    if n == 0:
        return []
    embedded = gap_similarities(vectors, window)
    lexical = lexical_gap_similarities(texts, window)
    depths = depth_scores([(a + b) / 2 for a, b in zip(embedded, lexical, strict=True)])
    cutoff = statistics.fmean(depths) + depth_sd * statistics.pstdev(depths) if depths else math.inf
    cuts: set[int] = set()  # cut g: a topic starts at sentence g
    for g in sorted((g for g in range(1, n) if depths[g - 1] > cutoff), key=lambda g: -depths[g - 1]):
        before = max((c for c in cuts if c < g), default=0)
        after = min((c for c in cuts if c > g), default=n)
        if _length(starts, ends, before, g - 1) >= min_sec and _length(starts, ends, g, after - 1) >= min_sec:
            cuts.add(g)
    spans = _spans(sorted(cuts), n)
    out: list[TopicSpan] = []
    while spans:
        span = spans.pop(0)
        if _length(starts, ends, span.first, span.last) > max_sec and span.last > span.first:
            split = _best_split(depths, starts, ends, span.first, span.last, min_sec)
            if split is not None:
                spans[:0] = [TopicSpan(span.first, split - 1), TopicSpan(split, span.last)]
                continue
        out.append(span)
    return out


def _spans(cuts: list[int], n: int) -> list[TopicSpan]:
    edges = [0, *cuts, n]
    return [TopicSpan(edges[i], edges[i + 1] - 1) for i in range(len(edges) - 1)]
