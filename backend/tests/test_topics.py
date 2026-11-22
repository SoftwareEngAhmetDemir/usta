from app.videos.topics import TopicSpan, depth_scores, detect_topic_boundaries, gap_similarities

A, B = [1.0, 0.0], [0.0, 1.0]
TORCH = "Torç yüksekliği kesim sacı"
NOZZLE = "Nozul elektrot bakım değişim"


def _times(n: int, sec: float) -> tuple[list[float], list[float]]:
    return [i * sec for i in range(n)], [i * sec + sec * 0.9 for i in range(n)]


def test_gap_similarities_drop_where_the_topic_changes() -> None:
    sims = gap_similarities([A, A, A, B, B, B], window=2)
    assert sims[2] == min(sims) and sims[2] < 0.1 and sims[0] > 0.99


def test_depth_scores_measure_the_dip_against_the_peaks_around_it() -> None:
    depths = depth_scores([0.9, 0.5, 0.8, 0.8])
    assert depths[0] == 0.0 and round(depths[1], 3) == 0.7 and depths[2] == 0.0  # (0.9-0.5) + (0.8-0.5)


def test_boundary_where_meaning_and_words_change() -> None:
    starts, ends = _times(8, 10.0)  # 10 s per sentence
    texts = [TORCH] * 4 + [NOZZLE] * 4
    spans = detect_topic_boundaries(starts, ends, [A] * 4 + [B] * 4, texts, window=2, min_sec=20)
    assert spans == [TopicSpan(0, 3), TopicSpan(4, 7)]


def test_shared_words_find_the_topic_change_when_embeddings_cannot() -> None:
    """A whole video is about one machine, so all sentence embeddings can look alike (seen with real models)."""
    starts, ends = _times(8, 10.0)
    spans = detect_topic_boundaries(starts, ends, [A] * 8, [TORCH] * 4 + [NOZZLE] * 4, window=2, min_sec=20)
    assert spans == [TopicSpan(0, 3), TopicSpan(4, 7)]


def test_minimum_topic_length_blocks_tiny_topics() -> None:
    starts, ends = _times(8, 10.0)
    texts = [TORCH] * 4 + [NOZZLE] + [TORCH] * 3  # one odd sentence would make a 10 s topic
    spans = detect_topic_boundaries(starts, ends, [A] * 4 + [B] + [A] * 3, texts, window=1, min_sec=20)
    assert all(ends[s.last] - starts[s.first] >= 20 for s in spans)


def test_maximum_topic_length_forces_a_split() -> None:
    starts, ends = _times(30, 10.0)  # 300 s of one topic
    spans = detect_topic_boundaries(starts, ends, [A] * 30, [TORCH] * 30, min_sec=20, max_sec=180)
    assert len(spans) == 2 and all(ends[s.last] - starts[s.first] <= 180 for s in spans)
    assert spans[0].first == 0 and spans[-1].last == 29 and spans[1].first == spans[0].last + 1


def test_no_sentences() -> None:
    assert detect_topic_boundaries([], [], [], []) == []
