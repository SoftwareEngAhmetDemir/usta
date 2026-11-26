"""Patron panel data (KAN-30, 32). Creating/editing records is in SQLAdmin at /admin (admin/views.py)."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Query, Response
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import PatronUser
from app.auth.models import Role, User
from app.core import storage
from app.core.schemas import PersonRef, UtcDateTime
from app.deps import PublicUrl, SessionDep
from app.documents.models import Document
from app.machines import qr
from app.machines.models import Machine
from app.machines.service import search_condition
from app.maintenance.models import MaintenanceRecord
from app.questions.models import Question, QuestionStatus
from app.questions.service import person
from app.videos.models import Video

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminStats(BaseModel):
    machines: int
    videos: int
    documents: int
    answered_questions: int
    maintenance_records: int


class LastMaintenance(BaseModel):
    date: UtcDateTime
    by_name: str


class AdminMachineRow(BaseModel):
    id: int
    code: str
    name: str
    serial: str
    location: str
    ustas: list[PersonRef]
    last_maintenance: LastMaintenance | None
    video_count: int
    document_count: int


class AdminMachineList(BaseModel):
    stats: AdminStats
    machines: list[AdminMachineRow]


class AdminUser(BaseModel):
    id: int
    name: str
    role: Role
    authorized: bool
    authorization_note: str | None
    authorization_document_url: str | None
    machines: list[PersonRef]


async def _count(db: AsyncSession, model: type[Video] | type[Document] | type[MaintenanceRecord]) -> int:
    return await db.scalar(select(func.count()).select_from(model)) or 0


async def _counts(db: AsyncSession, column: "type[Video] | type[Document]") -> dict[int, int]:
    rows = await db.execute(select(column.machine_id, func.count()).group_by(column.machine_id))
    return {machine_id: n for machine_id, n in rows}


async def _last_maintenance(db: AsyncSession) -> dict[int, tuple[datetime, str]]:
    latest = (
        select(MaintenanceRecord.machine_id, func.max(MaintenanceRecord.id).label("id"))
        .group_by(MaintenanceRecord.machine_id)
        .subquery()
    )
    rows = await db.execute(
        select(MaintenanceRecord.machine_id, MaintenanceRecord.created_at, User.name)
        .join(latest, MaintenanceRecord.id == latest.c.id)
        .join(User, User.id == MaintenanceRecord.done_by_id)
    )
    return {machine_id: (at, name) for machine_id, at, name in rows}


@router.get("/machines", response_model=AdminMachineList)
async def admin_machines(
    _: PatronUser, db: SessionDep, q: Annotated[str, Query(max_length=100)] = ""
) -> AdminMachineList:
    """Stats + machine table; `q` searches code, name, serial and location."""
    query = select(Machine).where(Machine.archived_at.is_(None)).order_by(Machine.name)
    if q.strip():
        query = query.where(search_condition(q.strip()))
    machines = await db.scalars(query)
    videos, documents, last = await _counts(db, Video), await _counts(db, Document), await _last_maintenance(db)
    answered = await db.scalar(select(func.count()).where(Question.status == QuestionStatus.answered)) or 0
    stats = AdminStats(
        machines=await db.scalar(select(func.count()).where(Machine.archived_at.is_(None))) or 0,
        videos=await _count(db, Video),
        documents=await _count(db, Document),
        answered_questions=answered,
        maintenance_records=await _count(db, MaintenanceRecord),
    )
    rows = [
        AdminMachineRow(
            id=m.id,
            code=m.code,
            name=m.name,
            serial=m.serial,
            location=m.location,
            ustas=[person(u) for u in m.ustas],
            last_maintenance=LastMaintenance(date=last[m.id][0], by_name=last[m.id][1]) if m.id in last else None,
            video_count=videos.get(m.id, 0),
            document_count=documents.get(m.id, 0),
        )
        for m in machines
    ]
    return AdminMachineList(stats=stats, machines=rows)


@router.get("/users", response_model=list[AdminUser])
async def admin_users(_: PatronUser, db: SessionDep, role: Role | None = None) -> list[AdminUser]:
    """Every user, or one role's (`?role=usta`: the panel's role tabs)."""
    query = select(User).order_by(User.name)
    users = await db.scalars(query.where(User.role == role) if role else query)
    machines = await db.scalars(select(Machine).where(Machine.archived_at.is_(None)).order_by(Machine.name))
    by_usta: dict[int, list[PersonRef]] = {}
    for m in machines:
        for u in m.ustas:
            by_usta.setdefault(u.id, []).append(PersonRef(id=m.id, name=m.name))
    return [
        AdminUser(
            id=u.id,
            name=u.name,
            role=u.role,
            authorized=u.authorized,
            authorization_note=u.authorization_note,
            authorization_document_url=storage.url(u.authorization_document),
            machines=by_usta.get(u.id, []),
        )
        for u in users
    ]


@router.get("/qr-stickers.pdf")
async def sticker_pdf(
    _: PatronUser, db: SessionDep, base: PublicUrl, ids: Annotated[list[int] | None, Query()] = None
) -> Response:
    """Stickers for the machines the patron picked (`?ids=1&ids=2`), or for every machine (KAN-30)."""
    query = select(Machine).where(Machine.archived_at.is_(None)).order_by(Machine.code)
    if ids:
        query = query.where(Machine.id.in_(ids))
    machines = list(await db.scalars(query))
    return Response(
        qr.sticker_sheet(machines, base),
        media_type="application/pdf",
        headers={"Content-Disposition": 'inline; filename="qr-etiketleri.pdf"'},
    )
