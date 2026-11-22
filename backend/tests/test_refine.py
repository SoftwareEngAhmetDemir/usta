from app.videos.refine import accept_refinement


def test_corrections_of_similar_length_are_taken() -> None:
    assert (
        accept_refinement("Ben Bilgisayar Mahendisiyim.", "Ben bilgisayar mühendisiyim.")
        == "Ben bilgisayar mühendisiyim."
    )
    assert (
        accept_refinement("basın çaltı bar olmalıdır.", "  basınç  altı bar olmalıdır. ")
        == "basınç altı bar olmalıdır."
    )


def test_empty_or_rewritten_corrections_keep_whisper_text() -> None:
    original = "Nozul her 8 saatte bir değiştirilmelidir."
    assert accept_refinement(original, "") == original
    assert accept_refinement(original, "Nozul.") == original  # far shorter: content dropped
    assert accept_refinement(original, original * 3) == original  # far longer: content added
