import re

from pydantic import BaseModel, ConfigDict
from sqlalchemy import ColumnElement, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core import storage
from app.core.schemas import PersonRef
from app.documents.models import Document
from app.documents.service import DocumentSummaryOut, summaries, summary_out
from app.machines.models import ExternalSource, ExternalVideo, Machine
from app.machines.permissions import MachineActions, actions
from app.maintenance.models import MaintenanceRecord
from app.maintenance.service import MaintenanceRecordOut, record_out
from app.questions.service import QaEntry, answered_on, localizer, person, qa_entry
from app.videos.models import Video, VideoStatus
from app.videos.service import VideoSummary, load_steps
from app.videos.service import summary as video_summary


class MachineOut(BaseModel):
    id: int
    code: str
    name: str
    type: str
    model: str
    serial: str
    location: str
    photo_url: str | None


class ExternalVideoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    url: str
    embed_url: str | None
    source: ExternalSource


class MachinePage(BaseModel):
    machine: MachineOut
    ustas: list[PersonRef]
    videos: list[VideoSummary]
    external_videos: list[ExternalVideoOut]
    documents: list[DocumentSummaryOut]
    maintenance: list[MaintenanceRecordOut]
    questions: list[QaEntry]
    actions: MachineActions


def search_condition(q: str) -> ColumnElement[bool]:
    """`q` anywhere in code, name, serial or location (`%`/`_` typed by the user are literal)."""
    pattern = "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
    return or_(*(col.like(pattern) for col in (Machine.code, Machine.name, Machine.serial, Machine.location)))


def machine_out(m: Machine) -> MachineOut:
    return MachineOut(
        id=m.id, code=m.code, name=m.name, type=m.type, model=m.model, serial=m.serial, location=m.location,
        photo_url=storage.url(m.photo),
    )  # fmt: skip


_YOUTUBE = re.compile(r"(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/)|youtu\.be/)([A-Za-z0-9_-]{11})")
_VIMEO = re.compile(r"vimeo\.com/(?:video/)?(\d+)")


def embed_url(url: str) -> str | None:
    """Player URL for sources that allow embedding; others open in a new tab (KAN-34)."""
    if m := _YOUTUBE.search(url):
        return f"https://www.youtube-nocookie.com/embed/{m.group(1)}"
    if m := _VIMEO.search(url):
        return f"https://player.vimeo.com/video/{m.group(1)}"
    return None


async def machine_page(db: AsyncSession, machine: Machine, viewer: User) -> MachinePage:
    """Everything on the machine page, in the viewer's language where a translation exists (KAN-70/71)."""
    lang = viewer.language
    videos = list(
        await db.scalars(
            select(Video)
            .where(Video.machine_id == machine.id, Video.status != VideoStatus.failed)
            .order_by(Video.created_at.desc(), Video.id.desc())
        )
    )
    steps = await load_steps(db, [v.id for v in videos])
    external = await db.scalars(
        select(ExternalVideo).where(ExternalVideo.machine_id == machine.id).order_by(ExternalVideo.id)
    )
    docs = list(await db.scalars(select(Document).where(Document.machine_id == machine.id).order_by(Document.id)))
    found = await summaries(db, [d.id for d in docs], lang)
    maintenance = await db.scalars(
        select(MaintenanceRecord)
        .where(MaintenanceRecord.machine_id == machine.id)
        .order_by(MaintenanceRecord.created_at.desc(), MaintenanceRecord.id.desc())
    )
    questions = await answered_on(db, machine_id=machine.id)
    loc = await localizer(db, questions, lang)
    return MachinePage(
        machine=machine_out(machine),
        ustas=[person(u) for u in machine.ustas],
        videos=[video_summary(v, steps[v.id], lang) for v in videos],
        external_videos=[ExternalVideoOut.model_validate(e) for e in external],
        documents=[summary_out(d, found.get(d.id)) for d in docs],
        maintenance=[record_out(r) for r in maintenance],
        questions=[qa_entry(q, loc) for q in questions],
        actions=actions(viewer, machine),
    )
