from app.ai.interfaces import WhisperSegment, Word
from app.videos.timeline import build_sentence_timeline, compute_speaking_rate, format_timestamp, transcript_lines
from tests.fakes import segment


def test_format_timestamp() -> None:
    assert format_timestamp(0) == "0:00"
    assert format_timestamp(65.9) == "1:05"  # floored, never later than the sentence
    assert format_timestamp(600) == "10:00"
    assert format_timestamp(3725, with_hours=True) == "1:02:05"
    assert format_timestamp(65, with_hours=True) == "0:01:05"
    assert format_timestamp(-3) == "0:00"


def test_segments_are_merged_and_split_into_sentences() -> None:
    # Whisper split one sentence over two segments, and put two sentences in one segment.
    segs = [
        segment(0.0, "Bu düğmeyi kapatın", logprob=-0.1),
        segment(1.6, "kapağı açmadan önce. Sonra vidaları sökün!", logprob=-0.5),
    ]
    sentences = build_sentence_timeline(segs)
    assert [s.text for s in sentences] == ["Bu düğmeyi kapatın kapağı açmadan önce.", "Sonra vidaları sökün!"]
    assert (sentences[0].start, sentences[0].end) == (0.0, 2.8)
    assert (sentences[1].start, sentences[1].end) == (2.8, 4.0)
    assert len(sentences[0].words) == 6
    assert round(sentences[0].avg_logprob, 3) == -0.3  # (3 words at -0.1 + 3 at -0.5) / 6: weighted by words


def test_arabic_question_mark_and_segments_without_words() -> None:
    segs = [
        WhisperSegment(start=0, end=2, text="كيف أغير القطب؟"),
        WhisperSegment(start=2.5, end=4, text="Tamam", words=[Word(start=2.5, end=3, text=" Tamam")]),
    ]
    assert [s.text for s in build_sentence_timeline(segs)] == ["كيف أغير القطب؟", "Tamam"]


def test_long_unpunctuated_speech_is_cut_at_a_pause() -> None:
    words = [Word(start=i * 1.0, end=i * 1.0 + 0.5, text=f" kelime{i}") for i in range(40)]
    sentences = build_sentence_timeline([WhisperSegment(start=0, end=40, text="...", words=words)], max_sentence_sec=10)
    assert len(sentences) == 4 and all(s.end - s.start <= 10.5 for s in sentences)


def test_speaking_rate_and_pauses() -> None:
    sentences = build_sentence_timeline([segment(1.0, "Bir iki üç.", 0.5), segment(3.0, "Dört beş altı yedi.", 0.25)])
    summary = compute_speaking_rate(sentences, video_duration=6.0)
    first, second = sentences
    assert (first.duration, first.word_count, first.words_per_sec) == (1.5, 3, 2.0)
    assert (first.pause_before, first.pause_after) == (1.0, 0.5)
    assert (second.duration, second.words_per_sec, second.pause_after) == (1.0, 4.0, 2.0)
    assert first.chars_per_sec == 6.0  # "Birikiüç." = 9 characters in 1.5 s
    assert summary.avg_words_per_sec == 3.0 and summary.median_words_per_sec == 3.0


def test_transcript_lines() -> None:
    sentences = build_sentence_timeline([segment(65.2, "Kapağı açmadan önce düğmeyi kapatın.")])
    assert transcript_lines(sentences, 300) == "1:05  Kapağı açmadan önce düğmeyi kapatın."
    assert transcript_lines(sentences, 4000) == "0:01:05  Kapağı açmadan önce düğmeyi kapatın."
