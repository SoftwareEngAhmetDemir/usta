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
    ctx: AppContext, db: SessionDep, machine: Machine, author: User, title: str, file: UploadFile
) -> Video:
    """Save an uploaded clip and start the upload pipeline. Also used for usta answers with a video."""
    if not (file.content_type or "").startswith("video/"):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Lütfen bir video dosyası seçin.")
    video = Video(
        machine_id=machine.id, author_id=author.id, title=title.strip(), original="", language=author.language
    )
    db.add(video)
    await db.flush()
    ext = Path(file.filename or "").suffix.lower()[:6] or ".mp4"
    video.original = storage.save_upload(file, pipeline.video_dir(video.id), f"original{ext}")
    await db.commit()
    await pipeline.create_steps(db, video.id, UPLOAD_PIPELINE, author.id, first_done=True)
    pipeline.start(ctx, video.id, UPLOAD_PIPELINE)
    return video


@router.post("/machines/{machine_id}/videos", response_model=VideoProcessing)
async def upload_video(
    machine_id: int, title: Title, file: Annotated[UploadFile, File()], user: CurrentUser, db: SessionDep, ctx: CtxDep
) -> VideoProcessing:
    """KAN-35/36/74: an usta's clip; returns the processing steps to poll."""
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    if not actions(user, machine).record_video:
        raise forbidden()
    video = await create_video(ctx, db, machine, user, title, file)
    return processing(video, (await load_steps(db, [video.id]))[video.id])


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
    pipeline.start(ctx, video.id, lang)
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
    pipeline.start(ctx, video.id, lang)
    return preparation(lang, (await load_steps(db, [video.id]))[video.id][lang])
