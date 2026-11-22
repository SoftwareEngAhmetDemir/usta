from app.videos.dubbing import Slot, fit_clip_to_slot, plan_dub, srt, vtt


def test_fit_clip_to_slot_is_clamped() -> None:
    assert fit_clip_to_slot(3.0, 3.0) == 1.0
    assert fit_clip_to_slot(3.3, 3.0) == 1.1  # speed up a little
    assert fit_clip_to_slot(6.0, 3.0) == 1.25  # never faster than 1.25
    assert fit_clip_to_slot(1.0, 3.0) == 0.85  # never slower than 0.85
    assert fit_clip_to_slot(2.0, 0.0) == 1.25


def test_clips_fit_their_slots() -> None:
    slots = [Slot(0.0, 2.0, 1.0), Slot(3.0, 5.0, 1.0)]
    plan = plan_dub(slots, [3.3, 2.7])
    assert [(p.start, p.tempo, p.borrowed) for p in plan] == [(0.0, 1.1, 0.0), (3.0, 0.9, 0.0)]


def test_a_clip_that_does_not_fit_borrows_from_the_next_pause() -> None:
    slots = [Slot(0.0, 2.0, 0.5), Slot(2.5, 4.0, 2.0)]  # slot 1 = 2.5 s, slot 2 = 3.5 s
    plan = plan_dub(slots, [3.75, 2.0])
    assert plan[0].tempo == 1.25 and plan[0].end == 3.0 and plan[0].borrowed == 0.5  # still 0.5 s too long
    assert plan[1].start == 3.0  # the next clip starts after it; its slot ends at 6.0
    assert plan[1].tempo == 0.85 and plan[1].borrowed == 0.0  # 2 s in the 3 s left


def test_overrun_longer_than_the_next_pause_warns(caplog: object) -> None:
    import logging

    import pytest

    assert isinstance(caplog, pytest.LogCaptureFixture)
    with caplog.at_level(logging.WARNING):
        plan_dub([Slot(0.0, 1.0, 0.0), Slot(1.0, 2.0, 0.2)], [5.0, 1.0])
    assert "drifts late" in caplog.text


def test_subtitles() -> None:
    cues = [(0.0, 1.2, "Önce makineyi kapatın."), (65.5, 65.6, "Kısa"), (70.0, 71.0, "  ")]
    assert vtt(cues) == (
        "WEBVTT\n\n00:00:00.000 --> 00:00:01.200\nÖnce makineyi kapatın.\n\n00:01:05.500 --> 00:01:06.000\nKısa\n"
    )
    assert (
        srt(cues)
        == "1\n00:00:00,000 --> 00:00:01,200\nÖnce makineyi kapatın.\n\n2\n00:01:05,500 --> 00:01:06,000\nKısa\n"
    )
