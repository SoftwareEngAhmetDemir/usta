"""Keyframes per topic segment: one near the start and the sharpest frame from the middle, skipping blurry
frames. Frames come from ffmpeg; sharpness is the variance of the Laplacian, computed with numpy (no OpenCV: its
bundled FFmpeg libraries clash with PyAV's in one process on macOS)."""

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.typing import NDArray

from app.videos import media


@dataclass(frozen=True)
class SnapshotFrame:
    time_sec: float
    path: Path
    sharpness: float


def sharpness(gray: NDArray[np.uint8]) -> float:
    """Variance of the 4-neighbour Laplacian: edges make it high, motion blur and out-of-focus make it low."""
    g = gray.astype(np.float64)
    if g.shape[0] < 3 or g.shape[1] < 3:
        return 0.0
    lap = g[:-2, 1:-1] + g[2:, 1:-1] + g[1:-1, :-2] + g[1:-1, 2:] - 4 * g[1:-1, 1:-1]
    return float(lap.var())


async def _scored(video: Path, at_sec: float) -> float | None:
    frame = await media.gray_frame(video, at_sec)
    return None if frame is None else sharpness(frame)


async def extract_snapshots(
    video: Path, start: float, end: float, out_dir: Path, prefix: str, min_sharpness: float, samples: int = 7
) -> list[SnapshotFrame]:
    """Up to 2 keyframes for the stretch start..end: the first sharp frame shortly after the start, and the
    sharpest of `samples` frames across the middle half (unless it is almost the same moment)."""
    length = max(end - start, 0.0)
    chosen: list[tuple[float, float]] = []
    for t in (start + min(1.0, length / 4), start + min(2.0, length / 3), start + min(3.0, length / 2)):
        if (s := await _scored(video, t)) is not None and s >= min_sharpness:
            chosen.append((t, s))
            break
    best: tuple[float, float] | None = None
    for i in range(samples):
        t = start + length * (0.25 + 0.5 * i / max(samples - 1, 1))
        if (s := await _scored(video, t)) is not None and s >= min_sharpness and (best is None or s > best[1]):
            best = (t, s)
    if best and not (chosen and abs(best[0] - chosen[0][0]) < 2.0):
        chosen.append(best)
    out = []
    for n, (t, s) in enumerate(chosen):
        path = out_dir / f"{prefix}_{n}.jpg"
        await media.save_frame(video, t, path)
        out.append(SnapshotFrame(round(t, 2), path, round(s, 1)))
    return out
