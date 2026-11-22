from app.search.evaluation import Expected, hit_rank, report
from app.search.models import Chunk


def _chunk(**kw: int | float | None) -> Chunk:
    return Chunk(**kw)


def test_hit_rank_matches_video_moments_pages_and_answers() -> None:
    ranked = [
        _chunk(video_id=3, start_sec=0.0, end_sec=40.0),
        _chunk(document_id=4, page=7),
        _chunk(video_id=3, start_sec=60.0, end_sec=110.0),
        _chunk(question_id=9),
    ]
    assert hit_rank(ranked, Expected(video_id=3, at_sec=65)) == 3
    assert hit_rank(ranked, Expected(video_id=3, at_sec=43)) == 1  # within the 5 s tolerance
    assert hit_rank(ranked, Expected(document_id=4, page=7)) == 2
    assert hit_rank(ranked, Expected(document_id=4, page=8)) is None
    assert hit_rank(ranked, Expected(question_id=9)) == 4


def test_report() -> None:
    r = report([1, 3, None, 6], k=5)
    assert (r.cases, r.hit_at_k, r.mrr) == (4, 0.5, round((1 + 1 / 3 + 1 / 6) / 4, 3))
