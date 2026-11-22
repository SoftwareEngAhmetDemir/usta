"""Retrieval evaluation: question → expected source pairs, scored as hit@k and MRR. Pure; the runner is
scripts/eval_retrieval.py."""

from pydantic import BaseModel

from app.search.models import Chunk


class Expected(BaseModel):
    """Where the answer is: a video moment, a document page, or an earlier usta answer."""

    video_id: int | None = None
    at_sec: float | None = None  # the moment in the video; a chunk covering it (±tolerance) is a hit
    document_id: int | None = None
    page: int | None = None
    question_id: int | None = None


class Case(BaseModel):
    question: str
    expect: Expected


class EvalSet(BaseModel):
    machine_id: int
    cases: list[Case]


def matches(chunk: Chunk, expect: Expected, tolerance_sec: float = 5.0) -> bool:
    if expect.video_id is not None:
        if chunk.video_id != expect.video_id:
            return False
        if expect.at_sec is None:
            return True
        start, end = chunk.start_sec or 0.0, chunk.end_sec or chunk.start_sec or 0.0
        return start - tolerance_sec <= expect.at_sec <= end + tolerance_sec
    if expect.document_id is not None:
        return chunk.document_id == expect.document_id and (expect.page is None or chunk.page == expect.page)
    return expect.question_id is not None and chunk.question_id == expect.question_id


def hit_rank(ranked: list[Chunk], expect: Expected) -> int | None:
    """1-based rank of the first matching chunk, or None."""
    return next((i for i, c in enumerate(ranked, start=1) if matches(c, expect)), None)


class Report(BaseModel):
    cases: int
    hit_at_k: float
    mrr: float
    k: int


def report(ranks: list[int | None], k: int) -> Report:
    n = len(ranks) or 1
    return Report(
        cases=len(ranks),
        hit_at_k=round(sum(1 for r in ranks if r is not None and r <= k) / n, 3),
        mrr=round(sum(1 / r for r in ranks if r is not None) / n, 3),
        k=k,
    )
