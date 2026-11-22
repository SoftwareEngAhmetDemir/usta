"""Read side of videos: what the player and the machine page show for a viewer's language (KAN-38, 50, 55, 56)."""

from collections import defaultdict
from typing import Literal

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.core.languages import LANGUAGES, VOICED, lang_dir, lang_name, lang_tr_name
from app.core.schemas import Dir, UtcDateTime
from app.videos.models import UPLOAD_PIPELINE, StepStatus, Video, VideoStep
from app.videos.pipeline import dubbed_rel, segments, subtitle_rel

TrackStatus = Literal["ready", "preparing", "none", "failed", "unavailable"]  # unavailable: no voice for it
Availability = Literal["original", "dubbed", "subtitles", "preparing", "on_demand"]


class PipelineStepOut(BaseModel):
    key: str
    label: str
    status: StepStatus


class VideoSummary(BaseModel):
    id: int
    title: str
    author_name: str
    created_at: UtcDateTime
    duration_sec: int
    thumbnail_url: str | None
    status: str
    availability: Availability


class VideoLanguageTrack(BaseModel):
    language: str
    language_name: str
    language_tr_name: str  # for searching the language menus in Turkish
    dir: Dir
    is_original: bool
    subtitles: TrackStatus
    subtitle_url: str | None
    audio: TrackStatus
    stream_url: str | None


class Preparation(BaseModel):
    language: str
    language_name: str
    steps: list[PipelineStepOut]


class TranscriptSegmentOut(BaseModel):
    start_sec: float
    end_sec: float
    text: str


class VideoDetail(BaseModel):
    id: int
    machine_id: int
    machine_name: str
    title: str
    author_name: str
    created_at: UtcDateTime
    duration_sec: int
    status: str
    tracks: list[VideoLanguageTrack]
    default_subtitle_language: str | None
    default_audio_language: str
    preparation: Preparation | None
    transcript: list[TranscriptSegmentOut]
    transcript_language: str
    transcript_dir: Dir


class VideoProcessing(BaseModel):
    id: int
    status: str
    steps: list[PipelineStepOut]
    job_id: int | None = None  # set on upload: follow it at GET /jobs/{id} or WS /ws/jobs/{id}


StepsByPipeline = dict[str, list[VideoStep]]


async def load_steps(db: AsyncSession, video_ids: list[int]) -> dict[int, StepsByPipeline]:
    out: dict[int, StepsByPipeline] = defaultdict(lambda: defaultdict(list))
    if video_ids:
        rows = await db.scalars(select(VideoStep).where(VideoStep.video_id.in_(video_ids)).order_by(VideoStep.position))
        for step in rows:
            out[step.video_id][step.pipeline].append(step)
    return out


def _done(steps: list[VideoStep], key: str) -> bool:
    return any(s.key == key and s.status == StepStatus.done for s in steps)


def _status(steps: list[VideoStep], key: str) -> TrackStatus:
    """Status of what step `key` produces: ready once done; failed if the pipeline stopped before it."""
    if not steps:
        return "none"
    if _done(steps, key):
        return "ready"
    return "failed" if any(s.status == StepStatus.failed for s in steps) else "preparing"


def tracks(video: Video, steps: StepsByPipeline) -> list[VideoLanguageTrack]:
    upload = steps.get(UPLOAD_PIPELINE, [])
    original = VideoLanguageTrack(
        language=video.language,
        language_name=lang_name(video.language),
        language_tr_name=lang_tr_name(video.language),
        dir=lang_dir(video.language),
        is_original=True,
        subtitles=_status(upload, "transcribe"),
        subtitle_url=storage.url(subtitle_rel(video.id, video.language)) if _done(upload, "transcribe") else None,
        audio="ready" if video.stream else _status(upload, "transcode"),
        stream_url=storage.url(video.stream),
    )
    others = []
    for code in LANGUAGES:
        if code == video.language:
            continue
        lang_steps = steps.get(code, [])
        subtitles = _status(lang_steps, "subtitles")
        audio: TrackStatus = _status(lang_steps, "mix") if code in VOICED else "unavailable"
        others.append(
            VideoLanguageTrack(
                language=code,
                language_name=lang_name(code),
                language_tr_name=lang_tr_name(code),
                dir=lang_dir(code),
                is_original=False,
                subtitles=subtitles,
                subtitle_url=storage.url(subtitle_rel(video.id, code)) if subtitles == "ready" else None,
                audio=audio,
                stream_url=storage.url(dubbed_rel(video.id, code)) if audio == "ready" else None,
            )
        )
    return [original, *others]


def availability(video: Video, steps: StepsByPipeline, lang: str) -> Availability:
    if lang == video.language:
        return "original"
    lang_steps = steps.get(lang, [])
    if _done(lang_steps, "mix"):
        return "dubbed"
    if _done(lang_steps, "subtitles"):
        return "subtitles"
    if lang_steps and not any(s.status == StepStatus.failed for s in lang_steps):
        return "preparing"
    return "on_demand"


def step_list(steps: list[VideoStep]) -> list[PipelineStepOut]:
    return [PipelineStepOut(key=s.key, label=s.label, status=s.status) for s in steps]


def preparation(lang: str, steps: list[VideoStep]) -> Preparation:
    return Preparation(language=lang, language_name=lang_name(lang), steps=step_list(steps))


def summary(video: Video, steps: StepsByPipeline, viewer_lang: str) -> VideoSummary:
    return VideoSummary(
        id=video.id,
        title=video.title,
        author_name=video.author.name if video.author else "",
        created_at=video.created_at,
        duration_sec=video.duration_sec,
        thumbnail_url=storage.url(video.thumbnail),
        status=video.status,
        availability=availability(video, steps, viewer_lang),
    )


def processing(video: Video, steps: StepsByPipeline) -> VideoProcessing:
    upload = steps.get(UPLOAD_PIPELINE, [])
    stopped = any(s.status == StepStatus.failed for s in upload)  # later steps stay "waiting" until a retry
    running = not stopped and any(s.status in (StepStatus.waiting, StepStatus.running) for s in upload)
    return VideoProcessing(id=video.id, status="processing" if running else video.status, steps=step_list(upload))


async def detail(db: AsyncSession, video: Video, machine_name: str, viewer_lang: str) -> VideoDetail:
    steps = (await load_steps(db, [video.id]))[video.id]
    track_list = tracks(video, steps)
    mine = next((t for t in track_list if t.language == viewer_lang), None)
    original = track_list[0]
    if mine and mine.subtitles == "ready":
        default_subtitles: str | None = viewer_lang
    else:
        default_subtitles = original.language if original.subtitles == "ready" else None
    viewer_steps = steps.get(viewer_lang, []) if viewer_lang != video.language else []
    preparing = bool(viewer_steps) and not all(s.status == StepStatus.done for s in viewer_steps)
    transcript_lang = viewer_lang if _done(viewer_steps, "translate") else video.language
    return VideoDetail(
        id=video.id,
        machine_id=video.machine_id,
        machine_name=machine_name,
        title=video.title,
        author_name=video.author.name if video.author else "",
        created_at=video.created_at,
        duration_sec=video.duration_sec,
        status=video.status,
        tracks=track_list,
        default_subtitle_language=default_subtitles,
        default_audio_language=viewer_lang if mine and mine.audio == "ready" else video.language,
        preparation=preparation(viewer_lang, viewer_steps) if preparing else None,
        transcript=[
            TranscriptSegmentOut(start_sec=s.start_sec, end_sec=s.end_sec, text=s.text)
            for s in await segments(db, video.id, transcript_lang)
        ],
        transcript_language=transcript_lang,
        transcript_dir=lang_dir(transcript_lang),
    )
