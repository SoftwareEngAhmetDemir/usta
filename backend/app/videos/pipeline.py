"""Video pipelines run as background jobs, one step at a time, state in video_steps so a page can poll
progress and a failed step can be retried (KAN-37, 55, 74).

- "upload": after an usta uploads: transcode → transcribe → index for "Makineye sor".
- "<lang>": on demand per viewer language: translate → subtitles → audio → dub → mix (dubbed MP4)."""

import logging
from collections.abc import Awaitable, Callable
from pathlib import Path

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.protocol import AIUnavailableError, DisabledAI
from app.alerts.service import notify
from app.context import AppContext
from app.core import storage
from app.core.languages import lang_name
from app.search.service import replace_chunks, transcript_chunks
from app.translations.service import translate
from app.videos import media
from app.videos.models import UPLOAD_PIPELINE, StepStatus, TranscriptSegment, Video, VideoStatus, VideoStep

log = logging.getLogger(__name__)

UPLOAD_STEPS = [
    ("upload", "Yüklendi"),
    ("transcode", "Sıkıştırılıyor (H.264)"),
    ("transcribe", "Konuşma metne dönüştürülüyor"),
    ("index", "Aramaya ekleniyor"),
]
LANGUAGE_STEPS = [
    ("translate", "Çeviri"),
    ("subtitles", "Altyazı"),
    ("audio", "Ses ayrıştırma"),
    ("dub", "Dublaj"),
    ("mix", "Zamanlama ve miksaj"),
]


def video_dir(video_id: int) -> str:
    return f"videos/{video_id}"


def subtitle_rel(video_id: int, lang: str) -> str:
    return f"{video_dir(video_id)}/{lang}.vtt"


def dubbed_rel(video_id: int, lang: str) -> str:
    return f"{video_dir(video_id)}/{lang}.mp4"


async def create_steps(
    db: AsyncSession, video_id: int, pipeline: str, requested_by_id: int | None, *, first_done: bool = False
) -> list[VideoStep]:
    defs = UPLOAD_STEPS if pipeline == UPLOAD_PIPELINE else LANGUAGE_STEPS
    steps = [
        VideoStep(
            video_id=video_id,
            pipeline=pipeline,
            position=i,
            key=key,
            label=label,
            status=StepStatus.done if first_done and i == 0 else StepStatus.waiting,
            requested_by_id=requested_by_id,
        )
        for i, (key, label) in enumerate(defs)
    ]
    db.add_all(steps)
    await db.commit()
    return steps


async def segments(db: AsyncSession, video_id: int, lang: str) -> list[TranscriptSegment]:
    rows = await db.scalars(
        select(TranscriptSegment)
        .where(TranscriptSegment.video_id == video_id, TranscriptSegment.language == lang)
        .order_by(TranscriptSegment.position)
    )
    return list(rows)


async def _write_vtt(db: AsyncSession, video_id: int, lang: str) -> None:
    segs = await segments(db, video_id, lang)
    path = storage.abs_path(subtitle_rel(video_id, lang))
    path.write_text(media.vtt([(s.start_sec, s.end_sec, s.text) for s in segs]), encoding="utf-8")


# ---- upload pipeline ----


async def _transcode(ctx: AppContext, db: AsyncSession, video: Video, _: str) -> None:
    src = storage.abs_path(video.original)
    stream = f"{video_dir(video.id)}/stream.mp4"
    thumb = f"{video_dir(video.id)}/thumb.jpg"
    try:
        await media.transcode(src, storage.abs_path(stream))
        seconds = await media.duration(storage.abs_path(stream))
        await media.thumbnail(storage.abs_path(stream), storage.abs_path(thumb), min(1.0, seconds / 2))
    except media.MediaError:
        video.status = VideoStatus.failed
        await db.commit()
        raise
    video.stream, video.thumbnail, video.duration_sec = stream, thumb, round(seconds)
    video.status = VideoStatus.ready  # playable from here on; the AI steps add subtitles and search
    await db.commit()


async def _transcribe(ctx: AppContext, db: AsyncSession, video: Video, _: str) -> None:
    audio = storage.abs_path(f"{video_dir(video.id)}/speech.mp3")
    await media.speech_audio(storage.abs_path(video.stream or video.original), audio)
    transcript = await ctx.ai.transcribe(audio)
    language = transcript.language.lower()[:2] or video.language
    await db.execute(delete(TranscriptSegment).where(TranscriptSegment.video_id == video.id))
    db.add_all(
        TranscriptSegment(
            video_id=video.id, language=language, position=i, start_sec=s.start_sec, end_sec=s.end_sec, text=s.text
        )
        for i, s in enumerate(transcript.segments)
    )
    video.language = language
    await db.commit()
    await _write_vtt(db, video.id, language)
    audio.unlink(missing_ok=True)


async def _index(ctx: AppContext, db: AsyncSession, video: Video, _: str) -> None:
    segs = await segments(db, video.id, video.language)
    chunks = transcript_chunks([(s.start_sec, s.text) for s in segs])
    await replace_chunks(db, ctx.ai, video.machine_id, "video", chunks, video_id=video.id)


# ---- language pipeline ----


async def _translate(ctx: AppContext, db: AsyncSession, video: Video, lang: str) -> None:
    original = await segments(db, video.id, video.language)
    texts = await translate(db, ctx.ai, [s.text for s in original], video.language, lang)
    await db.execute(
        delete(TranscriptSegment).where(TranscriptSegment.video_id == video.id, TranscriptSegment.language == lang)
    )
    db.add_all(
        TranscriptSegment(
            video_id=video.id, language=lang, position=s.position, start_sec=s.start_sec, end_sec=s.end_sec, text=t
        )
        for s, t in zip(original, texts, strict=True)
    )
    await db.commit()


async def _subtitles(ctx: AppContext, db: AsyncSession, video: Video, lang: str) -> None:
    await _write_vtt(db, video.id, lang)


def _background(video: Video) -> Path:
    return storage.abs_path(f"{video_dir(video.id)}/background.wav")


async def _audio(ctx: AppContext, db: AsyncSession, video: Video, lang: str) -> None:
    if not _background(video).exists():  # shared by every language
        await media.background_audio(storage.abs_path(video.stream or video.original), _background(video))


def _clips_dir(video: Video, lang: str) -> Path:
    return storage.abs_path(f"{video_dir(video.id)}/dub-{lang}")


async def _dub(ctx: AppContext, db: AsyncSession, video: Video, lang: str) -> None:
    folder = _clips_dir(video, lang)
    folder.mkdir(parents=True, exist_ok=True)
    for seg in await segments(db, video.id, lang):
        clip = folder / f"{seg.position}.wav"
        if seg.text.strip() and not clip.exists():  # a retry keeps clips already made
            clip.write_bytes(await ctx.ai.speak(seg.text, lang))


async def _mix(ctx: AppContext, db: AsyncSession, video: Video, lang: str) -> None:
    segs = await segments(db, video.id, lang)
    folder = _clips_dir(video, lang)
    clips: list[tuple[float, float, Path]] = []
    for i, seg in enumerate(segs):
        clip = folder / f"{seg.position}.wav"
        if clip.exists():
            slot_end = segs[i + 1].start_sec if i + 1 < len(segs) else seg.end_sec + 2
            clips.append((seg.start_sec, slot_end, clip))
    await media.mix_dub(
        storage.abs_path(video.stream or video.original),
        _background(video),
        clips,
        storage.abs_path(dubbed_rel(video.id, lang)),
    )
    for clip in folder.glob("*.wav"):
        clip.unlink()
    folder.rmdir()


Handler = Callable[[AppContext, AsyncSession, Video, str], Awaitable[None]]
HANDLERS: dict[str, Handler] = {
    "upload": lambda *_: _noop(),
    "transcode": _transcode,
    "transcribe": _transcribe,
    "index": _index,
    "translate": _translate,
    "subtitles": _subtitles,
    "audio": _audio,
    "dub": _dub,
    "mix": _mix,
}


async def _noop() -> None:
    return None


async def run(ctx: AppContext, video_id: int, pipeline: str) -> None:
    """Job: run the pipeline's remaining steps in order; stop at the first failure (retry resumes there)."""
    async with ctx.sessionmaker() as db:
        while True:
            video = await db.get(Video, video_id)
            step = await db.scalar(
                select(VideoStep)
                .where(
                    VideoStep.video_id == video_id, VideoStep.pipeline == pipeline, VideoStep.status != StepStatus.done
                )
                .order_by(VideoStep.position)
            )
            if video is None or step is None or step.status == StepStatus.failed:
                break
            step.status, step.error = StepStatus.running, None
            await db.commit()
            # Plain values: a rollback below expires ORM objects, and async sessions can't lazy-load them.
            step_id, key, requested_by = step.id, step.key, step.requested_by_id
            try:
                await HANDLERS[key](ctx, db, video, pipeline)
            except Exception as e:
                known = isinstance(e, AIUnavailableError | media.MediaError | OSError)
                if not known:
                    log.exception("video %s step %s crashed", video_id, key)
                await db.rollback()
                await _set(db, step_id, StepStatus.failed, str(e)[:300] if known else "Beklenmeyen bir hata oluştu.")
                video = await db.get(Video, video_id, populate_existing=True)
                if video is not None:
                    await _finished(ctx, db, video, pipeline, requested_by, ok=False)
                return
            await _set(db, step_id, StepStatus.done, None)
        if video is not None and step is None:
            requested_by = await db.scalar(
                select(VideoStep.requested_by_id).where(VideoStep.video_id == video_id, VideoStep.pipeline == pipeline)
            )
            await _finished(ctx, db, video, pipeline, requested_by, ok=True)


async def _set(db: AsyncSession, step_id: int, status: StepStatus, error: str | None) -> None:
    await db.execute(update(VideoStep).where(VideoStep.id == step_id).values(status=status, error=error))
    await db.commit()


async def _finished(
    ctx: AppContext, db: AsyncSession, video: Video, pipeline: str, user_id: int | None, *, ok: bool
) -> None:
    if user_id is None:
        return
    path = f"/videos/{video.id}"
    if pipeline == UPLOAD_PIPELINE:
        text = (
            f"“{video.title}” videosu hazır." if ok else f"“{video.title}” videosu işlenirken bir adım başarısız oldu."
        )
    else:
        name = lang_name(pipeline)
        text = f"“{video.title}” videosu artık {name} hazır." if ok else f"“{video.title}” {name} hazırlanamadı."
    await notify(db, ctx.hub, [user_id], text, path)


def start(ctx: AppContext, video_id: int, pipeline: str) -> None:
    ctx.jobs.spawn(run(ctx, video_id, pipeline), name=f"video-{video_id}-{pipeline}")


async def resume_unfinished(ctx: AppContext) -> None:
    """At startup: steps cut off by a restart run again. With AI configured, failed upload steps
    (e.g. transcription before GEMINI_API_KEY was set) are retried once too."""
    async with ctx.sessionmaker() as db:
        await db.execute(
            update(VideoStep).where(VideoStep.status == StepStatus.running).values(status=StepStatus.waiting)
        )
        if not isinstance(ctx.ai, DisabledAI):
            await db.execute(
                update(VideoStep)
                .where(
                    VideoStep.pipeline == UPLOAD_PIPELINE,
                    VideoStep.status == StepStatus.failed,
                    VideoStep.key != "transcode",
                )
                .values(status=StepStatus.waiting, error=None)
            )
        await db.commit()
        pending = await db.execute(
            select(VideoStep.video_id, VideoStep.pipeline).where(VideoStep.status == StepStatus.waiting).distinct()
        )
        for video_id, pipeline in pending:
            start(ctx, video_id, pipeline)
