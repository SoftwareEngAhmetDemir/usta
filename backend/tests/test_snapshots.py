import numpy as np

from app.videos.media import _pgm
from app.videos.snapshots import sharpness


def test_sharp_edges_score_higher_than_blur() -> None:
    sharp = np.zeros((40, 40), dtype=np.uint8)
    sharp[:, ::2] = 255  # hard stripes
    blurred = np.tile(np.linspace(0, 255, 40, dtype=np.uint8), (40, 1))  # smooth gradient
    flat = np.full((40, 40), 128, dtype=np.uint8)
    assert sharpness(sharp) > 1000 > sharpness(blurred) and sharpness(flat) == 0.0
    assert sharpness(np.zeros((2, 2), dtype=np.uint8)) == 0.0


def test_pgm_parsing() -> None:
    pixels = bytes(range(6))
    parsed = _pgm(b"P5\n3 2\n255\n" + pixels)
    assert parsed is not None and parsed.tolist() == [[0, 1, 2], [3, 4, 5]]
    assert _pgm(b"") is None and _pgm(b"P5\n3 2\n255\n" + b"\x00") is None
