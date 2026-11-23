"""Video pipelines (KAN-37, 48, 50, 53, 55, 58), run step by step by the job worker. Step state lives in
video_steps so the app can show progress and a failed step can be retried; no step uses an LLM.

- "upload": transcode → 16 kHz audio → Whisper (sentences, speaking rate) → LLM correction of misheard words →
  topics → snapshots → search index.
- "<lang>" on demand: machine translation → subtitles (.vtt/.srt) → speech per sentence → timing + mix (dubbed MP4
  with the original audio as a second track). Cached per (video, language) in dubbed_versions."""

import asyncio
import logging
import shutil
from collections.abc import Awaitable, Callable
from pathlib import Path

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.interfaces import AIUnavailableError
from app.alerts.service import notify
from app.context import AppContext
from app.core import storage
from app.core.languages import VOICED
from app.jobs.queue import JobFailedError, Payload, Progress
from app.machines.models import Machine
from app.search.chunking import TimedText, chunk_video
from app.search.service import ChunkIn, Owner, embed_and_store
from app.translations.service import translate
from app.videos import dubbing, media
from app.videos.models import (
    UPLOAD_PIPELINE,
    DubbedVersion,
    Snapshot,
    StepStatus,
    TopicSegment,
    TranscriptSegment,
    Video,
    VideoStatus,
    VideoStep,
)  # fmt: skip
from app.videos.refine import accept_refinement
from app.videos.snapshots import extract_snapshots
from app.videos.timeline import Sentence, build_sentence_timeline, compute_speaking_rate, transcript_lines
from app.videos.topics import detect_topic_boundaries

log = logging.getLogger(__name__)

UPLOAD_STEPS = [
    ("upload", "Yüklendi"),
    ("transcode", "Sıkıştırılıyor (H.264)"),
    ("audio", "Ses ayrıştırılıyor"),
    ("transcribe", "Konuşma metne dönüştürülüyor"),
    ("refine", "Metin düzeltiliyor"),
    ("topics", "Konulara ayrılıyor"),
    ("snapshots", "Kareler seçiliyor"),
    ("index", "Aramaya ekleniyor"),
]
LANGUAGE_STEPS = [
    ("translate", "Çeviri"),
    ("subtitles", "Altyazı"),
    ("voice", "Seslendirme"),
    ("mix", "Zamanlama ve miksaj"),
]
JOB_KIND = "video_pipeline"


def video_dir(video_id: int) -> str:
    return f"videos/{video_id}"


def subtitle_rel(video_id: int, lang: str, ext: str = "vtt") -> str:
    return f"{video_dir(video_id)}/{lang}.{ext}"


def dubbed_rel(video_id: int, lang: str) -> str:
    return f"{video_dir(video_id)}/{lang}.mp4"


def _audio16k(video: Video) -> Path:
    return storage.abs_path(f"{video_dir(video.id)}/audio16k.wav")


async def create_steps(
    db: AsyncSession, video_id: int, pipeline: str, requested_by_id: int | None, *, first_done: bool = False
) -> list[VideoStep]:
    if pipeline == UPLOAD_PIPELINE:
        defs = UPLOAD_STEPS
    else:  # a language Google's free endpoint can't speak gets subtitles only
        defs = (
            LANGUAGE_STEPS if pipeline in VOICED else [s for s in LANGUAGE_STEPS if s[0] in ("translate", "subtitles")]
        )
    steps = [
        VideoStep(
            video_id=video_id, pipeline=pipeline, position=i, key=key, label=label, requested_by_id=requested_by_id,
            status=StepStatus.done if first_done and i == 0 else StepStatus.waiting,
        )
        for i, (key, label) in enumerate(defs)
    ]  # fmt: skip
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


async def _write_subtitles(db: AsyncSession, video_id: int, lang: str) -> None:
    cues = [(s.start_sec, s.end_sec, s.text) for s in await segments(db, video_id, lang)]
    storage.abs_path(subtitle_rel(video_id, lang)).write_text(dubbing.vtt(cues), encoding="utf-8")
    storage.abs_path(subtitle_rel(video_id, lang, "srt")).write_text(dubbing.srt(cues), encoding="utf-8")


# ---- upload pipeline ----


async def _transcode(ctx: AppContext, db: AsyncSession, video: Video, _: str) -> None:
    src = storage.abs_path(video.original)
    stream, thumb = f"{video_dir(video.id)}/stream.mp4", f"{video_dir(video.id)}/thumb.jpg"
    try:
        await media.transcode(src, storage.abs_path(stream))
        seconds = await media.duration(storage.abs_path(stream))
        await media.thumbnail(storage.abs_path(stream), storage.abs_path(thumb), min(1.0, seconds / 2))
    except media.MediaError:
        video.status = VideoStatus.failed
        await db.commit()
        raise
    video.stream, video.thumbnail, video.duration_sec = stream, thumb, round(seconds)
    video.status = VideoStatus.ready  # playable from here on; the next steps add subtitles and search
    await db.commit()


async def _audio(ctx: AppContext, db: AsyncSession, video: Video, _: str) -> None:
    await media.extract_audio(storage.abs_path(video.stream or video.original), _audio16k(video))


async def _transcribe(ctx: AppContext, db: AsyncSession, video: Video, _: str) -> None:
    result = await asyncio.to_thread(ctx.ai.transcriber.transcribe, _audio16k(video), video.language_hint)
    sentences = build_sentence_timeline(result.segments)
    rate = compute_speaking_rate(sentences, float(video.duration_sec) or None)
    language = (result.language or video.language).lower()[:2]
    # A new transcript makes every translation, dub and topic of this video stale.
    await db.execute(delete(TranscriptSegment).where(TranscriptSegment.video_id == video.id))
    await db.execute(delete(VideoStep).where(VideoStep.video_id == video.id, VideoStep.pipeline != UPLOAD_PIPELINE))
    await db.execute(delete(DubbedVersion).where(DubbedVersion.video_id == video.id))
    db.add_all(
        TranscriptSegment(
            video_id=video.id, language=language, position=i, start_sec=s.start, end_sec=s.end, text=s.text,
            avg_logprob=s.avg_logprob, words=[w.model_dump() for w in s.words], duration=s.duration,
            word_count=s.word_count, words_per_sec=s.words_per_sec, chars_per_sec=s.chars_per_sec,
            pause_before=s.pause_before, pause_after=s.pause_after,
        )
        for i, s in enumerate(sentences)
    )  # fmt: skip
    video.language, video.speaking_rate = language, rate.model_dump()
    await db.commit()
    await _write_transcript_files(db, video)


async def _write_transcript_files(db: AsyncSession, video: Video) -> None:
    """Subtitles (.vtt/.srt) and the readable "M:SS  sentence" transcript in the spoken language."""
    await _write_subtitles(db, video.id, video.language)
    sents = await segments(db, video.id, video.language)
    lines = transcript_lines(
        [Sentence(start=s.start_sec, end=s.end_sec, text=s.text) for s in sents], float(video.duration_sec)
    )
    storage.abs_path(f"{video_dir(video.id)}/transcript.txt").write_text(lines + "\n", encoding="utf-8")


async def _refine(ctx: AppContext, db: AsyncSession, video: Video, _: str) -> None:
    """The LLM corrects misheard words, sentence by sentence (times unchanged). Optional: without the LLM, or when a
    correction looks wrong, Whisper's text stays. Whisper's own words are kept in raw_text."""
    sents = await segments(db, video.id, video.language)
    if not sents:
        return
    machine = await db.get(Machine, video.machine_id)
    context = ", ".join(
        x
        for x in (
            machine and machine.name,
            machine and machine.type,
            machine and machine.model,
            f'video "{video.title}"',
        )
        if x
    )
    try:
        fixed = await ctx.ai.llm.refine_transcript([s.text for s in sents], video.language, context)
    except AIUnavailableError as e:
        log.warning("video %s transcript not corrected: %s", video.id, e)
        return
    for s, new in zip(sents, fixed, strict=True):
        text = accept_refinement(s.raw_text or s.text, new)
        if text != s.text:
            s.raw_text = s.raw_text or s.text
            s.text = text
    await db.commit()
    await _write_transcript_files(db, video)


async def _topics(ctx: AppContext, db: AsyncSession, video: Video, _: str) -> None:
    sents = await segments(db, video.id, video.language)
    await db.execute(delete(TopicSegment).where(TopicSegment.video_id == video.id))  # snapshots cascade
    shutil.rmtree(storage.abs_path(f"{video_dir(video.id)}/snapshots"), ignore_errors=True)
    if not sents:
        await db.commit()
        return
    vectors = await asyncio.to_thread(ctx.ai.embedder.embed_documents, [s.text for s in sents])
    s = ctx.settings
    spans = detect_topic_boundaries(
        [x.start_sec for x in sents], [x.end_sec for x in sents], vectors, [x.text for x in sents],
        window=s.topic_window, depth_sd=s.topic_depth_sd, min_sec=s.topic_min_sec, max_sec=s.topic_max_sec,
    )  # fmt: skip
    db.add_all(
        TopicSegment(
            video_id=video.id, position=i, start_sec=sents[span.first].start_sec, end_sec=sents[span.last].end_sec,
            first_sentence=sents[span.first].position, last_sentence=sents[span.last].position,
            text=" ".join(x.text for x in sents[span.first : span.last + 1]),
        )
        for i, span in enumerate(spans)
    )  # fmt: skip
    await db.commit()


async def _topic_rows(db: AsyncSession, video_id: int) -> list[TopicSegment]:
    rows = await db.scalars(
        select(TopicSegment).where(TopicSegment.video_id == video_id).order_by(TopicSegment.position)
    )
    return list(rows)


async def _snapshots(ctx: AppContext, db: AsyncSession, video: Video, _: str) -> None:
    await db.execute(delete(Snapshot).where(Snapshot.video_id == video.id))
    folder = f"{video_dir(video.id)}/snapshots"
    src = storage.abs_path(video.stream or video.original)
    for topic in await _topic_rows(db, video.id):
        frames = await extract_snapshots(
            src, topic.start_sec, topic.end_sec, storage.abs_path(folder), f"t{topic.position}",
            ctx.settings.snapshot_min_sharpness,
        )  # fmt: skip
        db.add_all(
            Snapshot(video_id=video.id, topic_segment_id=topic.id, time_sec=f.time_sec,
                     path=f"{folder}/{f.path.name}", sharpness=f.sharpness)
            for f in frames
        )  # fmt: skip
    await db.commit()


async def _index(ctx: AppContext, db: AsyncSession, video: Video, _: str) -> None:
    sents = await segments(db, video.id, video.language)
    topics = await _topic_rows(db, video.id)
    shots = list(await db.scalars(select(Snapshot).where(Snapshot.video_id == video.id).order_by(Snapshot.time_sec)))
    grouped = [
        [TimedText(x.start_sec, x.end_sec, x.text) for x in sents if t.first_sentence <= x.position <= t.last_sentence]
        for t in topics
    ]
    chunks = [
        ChunkIn(
            text=c.text, language=video.language, title=video.title, start_sec=c.start, end_sec=c.end,
            topic_segment_id=topics[c.topic_index].id,
            snapshot_paths=[s.path for s in shots if s.topic_segment_id == topics[c.topic_index].id],
        )
        for c in chunk_video(grouped)
    ]  # fmt: skip
    await embed_and_store(db, ctx.ai, video.machine_id, Owner(video_id=video.id), chunks)
    _audio16k(video).unlink(missing_ok=True)


# ---- language pipeline (dubbing) ----


async def _translate(ctx: AppContext, db: AsyncSession, video: Video, lang: str) -> None:
    original = await segments(db, video.id, video.language)
    texts = await translate(db, ctx.ai.translator, [s.text for s in original], video.language, lang)
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
    await _write_subtitles(db, video.id, lang)


def _clips_dir(video: Video, lang: str) -> Path:
    return storage.abs_path(f"{video_dir(video.id)}/dub-{lang}")


async def _voice(ctx: AppContext, db: AsyncSession, video: Video, lang: str) -> None:
    folder = _clips_dir(video, lang)
    folder.mkdir(parents=True, exist_ok=True)
    for seg in await segments(db, video.id, lang):
        clip = folder / f"{seg.position}.wav"
        if seg.text.strip() and not clip.exists():  # a retry keeps clips already made
            clip.write_bytes(await ctx.ai.tts.synthesize(seg.text, lang))


async def _mix(ctx: AppContext, db: AsyncSession, video: Video, lang: str) -> None:
    original = {s.position: s for s in await segments(db, video.id, video.language)}
    folder = _clips_dir(video, lang)
    items = [(original[s.position], folder / f"{s.position}.wav") for s in await segments(db, video.id, lang)]
    items = [(o, clip) for o, clip in items if clip.exists()]
    slots = [dubbing.Slot(o.start_sec, o.end_sec, o.pause_after or 0.0) for o, _ in items]
    plan = dubbing.plan_dub(slots, [media.wav_seconds(clip) for _, clip in items])
    placed: list[tuple[float, Path]] = []
    for (_, clip), p in zip(items, plan, strict=True):
        timed = clip.with_suffix(".fit.wav")
        await media.retime(clip, timed, p.tempo)
        placed.append((p.start, timed))
    voice, audio = folder / "voice.wav", f"{video_dir(video.id)}/{lang}.m4a"
    total = max([float(video.duration_sec), *(p.end for p in plan)])
    await asyncio.to_thread(media.place_clips, placed, total, voice)
    src = storage.abs_path(video.stream or video.original)
    await media.dub_track(voice, storage.abs_path(audio))
    await media.mux_dub(
        src, storage.abs_path(audio), storage.abs_path(dubbed_rel(video.id, lang)), lang, video.language
    )
    await db.execute(delete(DubbedVersion).where(DubbedVersion.video_id == video.id, DubbedVersion.language == lang))
    db.add(DubbedVersion(
        video_id=video.id, language=lang, status="ready", audio_path=audio, video_path=dubbed_rel(video.id, lang),
        subtitle_vtt=subtitle_rel(video.id, lang), subtitle_srt=subtitle_rel(video.id, lang, "srt"),
        late_clips=sum(1 for i, p in enumerate(plan) if p.borrowed > _next_pause(slots, i)),
    ))  # fmt: skip
    await db.commit()
    shutil.rmtree(folder, ignore_errors=True)


def _next_pause(slots: list[dubbing.Slot], i: int) -> float:
    return slots[i + 1].pause_after if i + 1 < len(slots) else 0.0


Handler = Callable[[AppContext, AsyncSession, Video, str], Awaitable[None]]


async def _noop(*_: object) -> None:
    return None


HANDLERS: dict[str, Handler] = {
    "upload": _noop, "transcode": _transcode, "audio": _audio, "transcribe": _transcribe, "refine": _refine,
    "topics": _topics,
    "snapshots": _snapshots, "index": _index, "translate": _translate, "subtitles": _subtitles, "voice": _voice,
    "mix": _mix,
}  # fmt: skip


async def run(ctx: AppContext, video_id: int, pipeline: str, progress: Progress) -> None:
    """Run the pipeline's remaining steps in order; stop at the first failure (a retry resumes there)."""
    async with ctx.sessionmaker() as db:
        while True:
            video = await db.get(Video, video_id)
            steps = list(
                await db.scalars(
                    select(VideoStep)
                    .where(VideoStep.video_id == video_id, VideoStep.pipeline == pipeline)
                    .order_by(VideoStep.position)
                )
            )
            step = next((s for s in steps if s.status != StepStatus.done), None)
            if video is None or step is None or step.status == StepStatus.failed:
                break
            await progress(round(100 * step.position / len(steps)), step.label)
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
                message = str(e)[:300] if known else "Beklenmeyen bir hata oluştu."
                await _set(db, step_id, StepStatus.failed, message)
                video = await db.get(Video, video_id, populate_existing=True)
                if video is not None:
                    await _finished(ctx, db, video, pipeline, requested_by, ok=False)
                raise JobFailedError(message) from e
            await _set(db, step_id, StepStatus.done, None)
        if video is not None and step is None:
            requested_by = await db.scalar(
                select(VideoStep.requested_by_id).where(VideoStep.video_id == video_id, VideoStep.pipeline == pipeline)
            )
            await _finished(ctx, db, video, pipeline, requested_by, ok=True)


async def job(ctx: AppContext, payload: Payload, progress: Progress) -> None:
    """Job handler (kind "video_pipeline"): {"video_id": int, "pipeline": "upload" | "<lang>"}."""
    await run(ctx, int(payload["video_id"]), str(payload["pipeline"]), progress)


async def _set(db: AsyncSession, step_id: int, status: StepStatus, error: str | None) -> None:
    await db.execute(update(VideoStep).where(VideoStep.id == step_id).values(status=status, error=error))
    await db.commit()


async def _finished(
    ctx: AppContext, db: AsyncSession, video: Video, pipeline: str, user_id: int | None, *, ok: bool
) -> None:
    # Only the uploader hears about their own upload. A language preparation sends nothing: the player starts it
    # by itself when a video is opened in a new language and switches when it is ready (user's decision 2026-11-23).
    if user_id is None or pipeline != UPLOAD_PIPELINE:
        return
    text = f"“{video.title}” videosu hazır." if ok else f"“{video.title}” videosu işlenirken bir adım başarısız oldu."
    await notify(db, ctx.hub, [user_id], text, f"/videos/{video.id}")


async def start(ctx: AppContext, video_id: int, pipeline: str) -> int:
    """Queue the pipeline; returns the job id (for GET /jobs/{id} and WS /ws/jobs/{id})."""
    return await ctx.jobs.enqueue(JOB_KIND, {"video_id": video_id, "pipeline": pipeline})


async def reset_for_reprocess(db: AsyncSession) -> list[int]:
    """Make every playable video run its upload pipeline again from the audio step (after a Whisper/topic change,
    or for videos processed by an older pipeline). Returns their ids; translations/dubs are redone on demand."""
    ids = list(await db.scalars(select(Video.id).where(Video.stream.is_not(None))))
    for video_id in ids:
        author = await db.scalar(select(Video.author_id).where(Video.id == video_id))
        await db.execute(delete(VideoStep).where(VideoStep.video_id == video_id, VideoStep.pipeline == UPLOAD_PIPELINE))
        steps = await create_steps(db, video_id, UPLOAD_PIPELINE, author, first_done=True)
        steps[1].status = StepStatus.done  # transcode: the stream already exists
        await db.commit()
    return ids
