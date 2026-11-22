from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from sqlalchemy import update

from app.auth.deps import CurrentUser
from app.auth.models import User
from app.context import AppContext
from app.core import storage
from app.core.languages import LANGUAGES
from app.deps import CtxDep, SessionDep, forbidden, not_found
from app.machines.models import Machine
from app.machines.permissions import actions
from app.videos import pipeline
from app.videos.cleanup import remove_video
from app.videos.models import UPLOAD_PIPELINE, StepStatus, Video, VideoStep
from app.videos.service import Preparation, VideoDetail, VideoProcessing, detail, load_steps, preparation, processing

router = APIRouter(tags=["videos"])

Title = Annotated[str, Form(min_length=1, max_length=200)]


async def _video(db: SessionDep, video_id: int) -> Video:
    video = await db.get(Video, video_id)
    if video is None:
        raise not_found("Video")
    return video


async def create_video(
    ctx: AppContext,
    db: SessionDep,
    machine: Machine,
    author: User,
    title: str,
    file: UploadFile,
    language_hint: str | None = None,
) -> tuple[Video, int]:
    """Save an uploaded clip and queue the upload pipeline; returns the video and its job id. Also used for usta
    answers with a video."""
    if not (file.content_type or "").startswith("video/"):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Lütfen bir video dosyası seçin.")
    if language_hint is not None and language_hint not in LANGUAGES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Bu dil desteklenmiyor.")
    video = Video(
        machine_id=machine.id, author_id=author.id, title=title.strip(), original="",
        language=language_hint or author.language, language_hint=language_hint,
    )  # fmt: skip
    db.add(video)
    await db.flush()
    ext = Path(file.filename or "").suffix.lower()[:6] or ".mp4"
    video.original = storage.save_upload(file, pipeline.video_dir(video.id), f"original{ext}")
    await db.commit()
    await pipeline.create_steps(db, video.id, UPLOAD_PIPELINE, author.id, first_done=True)
    return video, await pipeline.start(ctx, video.id, UPLOAD_PIPELINE)


@router.post("/machines/{machine_id}/videos", response_model=VideoProcessing)
async def upload_video(
    machine_id: int,
    title: Title,
    file: Annotated[UploadFile, File()],
    user: CurrentUser,
    db: SessionDep,
    ctx: CtxDep,
    language: Annotated[str | None, Form()] = None,
) -> VideoProcessing:
    """KAN-35/36/74: an usta's clip (optional spoken-language hint); returns the steps and the job id to follow."""
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    if not actions(user, machine).record_video:
        raise forbidden()
    video, job_id = await create_video(ctx, db, machine, user, title, file, language or None)
    return processing(video, (await load_steps(db, [video.id]))[video.id]).model_copy(update={"job_id": job_id})


@router.get("/videos/{video_id}/processing", response_model=VideoProcessing)
async def video_processing(video_id: int, _: CurrentUser, db: SessionDep) -> VideoProcessing:
    video = await _video(db, video_id)
    return processing(video, (await load_steps(db, [video.id]))[video.id])


@router.get("/videos/{video_id}", response_model=VideoDetail)
async def get_video(video_id: int, user: CurrentUser, db: SessionDep) -> VideoDetail:
    video = await _video(db, video_id)
    machine = await db.get(Machine, video.machine_id)
    return await detail(db, video, machine.name if machine else "", user.language)


@router.post("/videos/{video_id}/languages/{lang}", response_model=Preparation)
async def prepare_language(video_id: int, lang: str, user: CurrentUser, db: SessionDep, ctx: CtxDep) -> Preparation:
    """KAN-55: prepare subtitles + dubbed audio for `lang`. Never twice: a second call returns the same steps."""
    video = await _video(db, video_id)
    if lang not in LANGUAGES or lang == video.language:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Bu dil için hazırlık gerekmiyor.")
    steps = (await load_steps(db, [video.id]))[video.id]
    if steps.get(lang):
        return preparation(lang, steps[lang])
    if not any(s.key == "transcribe" and s.status == StepStatus.done for s in steps.get(UPLOAD_PIPELINE, [])):
        raise HTTPException(status.HTTP_409_CONFLICT, "Videonun konuşma metni henüz hazır değil.")
    created = await pipeline.create_steps(db, video.id, lang, user.id)
    await pipeline.start(ctx, video.id, lang)
    return preparation(lang, created)


@router.post("/videos/{video_id}/languages/{lang}/steps/{step}/retry", response_model=Preparation)
async def retry_step(video_id: int, lang: str, step: str, _: CurrentUser, db: SessionDep, ctx: CtxDep) -> Preparation:
    video = await _video(db, video_id)
    lang_steps = (await load_steps(db, [video.id]))[video.id].get(lang, [])
    failed = next((s for s in lang_steps if s.key == step and s.status == StepStatus.failed), None)
    if failed is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu adım tekrar denenemez.")
    await db.execute(
        update(VideoStep)
        .where(VideoStep.video_id == video.id, VideoStep.pipeline == lang, VideoStep.position >= failed.position)
        .values(status=StepStatus.waiting, error=None)
    )
    await db.commit()
    await pipeline.start(ctx, video.id, lang)
    return preparation(lang, (await load_steps(db, [video.id]))[video.id][lang])


@router.delete("/videos/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(video_id: int, user: CurrentUser, db: SessionDep, ctx: CtxDep) -> None:
    """Delete a video with everything made from it: chunks and vectors, topics, snapshots, subtitles, dubs."""
    video = await _video(db, video_id)
    machine = await db.get(Machine, video.machine_id)
    if machine is None or not actions(user, machine).record_video:
        raise forbidden()
    await remove_video(ctx, db, video)
