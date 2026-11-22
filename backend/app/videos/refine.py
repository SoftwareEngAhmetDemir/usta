"""Guard for LLM corrections of a transcript sentence (pure; tests/test_refine.py). The correction must still be
the same sentence: not empty and of a similar length; otherwise Whisper's text is kept."""

MIN_RATIO, MAX_RATIO = 0.5, 2.0


def accept_refinement(original: str, refined: str) -> str:
    refined = " ".join(refined.split())
    if not refined:
        return original
    ratio = len(refined) / max(len(original.strip()), 1)
    return refined if MIN_RATIO <= ratio <= MAX_RATIO else original
