"""Keyword side of hybrid search: BM25 over a machine's chunk texts, plus Reciprocal Rank Fusion.
Semantic search alone misses exact tokens (error codes like "E-204", part numbers, model names). Pure."""

import math
import re
import unicodedata
from collections import Counter

# A word, or a code made of parts joined by - . / (E-204, PK-105, 6.2, 3/8).
_TOKEN = re.compile(r"\w+(?:[-./]\w+)*")


def normalize(text: str) -> str:
    """Case- and accent-insensitive: "İŞLEM" = "islem", so workers can type without Turkish letters."""
    decomposed = unicodedata.normalize("NFKD", text.casefold().replace("ı", "i"))
    return "".join(c for c in decomposed if not unicodedata.combining(c))


def tokenize(text: str) -> list[str]:
    """Words and whole codes; a code also yields its parts ("e-204" → "e-204", "e", "204")."""
    out: list[str] = []
    for token in _TOKEN.findall(normalize(text)):
        out.append(token)
        parts = re.split(r"[-./]", token)
        if len(parts) > 1:
            out += [p for p in parts if p]
    return out


class BM25:
    """Okapi BM25 (k1=1.5, b=0.75) over pre-tokenized documents."""

    def __init__(self, docs: list[list[str]], k1: float = 1.5, b: float = 0.75) -> None:
        self._docs = [Counter(d) for d in docs]
        self._lengths = [len(d) for d in docs]
        self._avg = (sum(self._lengths) / len(docs)) if docs else 0.0
        df: Counter[str] = Counter(t for d in self._docs for t in d)
        n = len(docs)
        self._idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}
        self._k1, self._b = k1, b

    def scores(self, query: list[str]) -> list[float]:
        out: list[float] = []
        for counts, length in zip(self._docs, self._lengths, strict=True):
            norm = self._k1 * (1 - self._b + self._b * length / (self._avg or 1))
            out.append(
                sum(self._idf.get(t, 0.0) * counts[t] * (self._k1 + 1) / (counts[t] + norm) for t in query if counts[t])
            )
        return out


def rrf_merge(rankings: list[list[int]], k: int = 60) -> list[tuple[int, float]]:
    """Reciprocal Rank Fusion: each list ranks ids best-first; score = Σ 1/(k + rank). Best first."""
    scores: dict[int, float] = {}
    for ranking in rankings:
        for rank, item in enumerate(ranking, start=1):
            scores[item] = scores.get(item, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
