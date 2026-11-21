from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select

from app.alerts.service import notify
from app.auth.deps import CurrentUser
from app.auth.models import Role, User
from app.core import storage
from app.core.schemas import PersonRef
from app.deps import CtxDep, SessionDep, forbidden, not_found
from app.machines.models import Machine
from app.machines.permissions import actions
from app.maintenance.models import MaintenanceAttachment, MaintenanceRecord
from app.maintenance.service import MaintenanceRecordOut, record_out

router = APIRouter(tags=["maintenance"])


class FormMachine(BaseModel):
    id: int
    code: str
    name: str
    model: str
    serial: str
    location: str


class MaintenanceFormOptions(BaseModel):
    machine: FormMachine
    openers: list[PersonRef]


async def _openers(db: SessionDep, machine: Machine, me: User) -> list[User]:
    """Who can have asked for the job: the machine's ustas, the patrons and the other technicians."""
    others = await db.scalars(select(User).where(User.role.in_([Role.patron, Role.technician])))
    people = {u.id: u for u in [*machine.ustas, *others] if u.id != me.id}
    return sorted(people.values(), key=lambda u: u.name)


async def _machine_for_maintenance(db: SessionDep, machine_id: int, user: User) -> Machine:
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    if not actions(user, machine).record_maintenance:
        raise forbidden()
    return machine


@router.get("/machines/{machine_id}/maintenance-form", response_model=MaintenanceFormOptions)
async def maintenance_form(machine_id: int, user: CurrentUser, db: SessionDep) -> MaintenanceFormOptions:
    machine = await _machine_for_maintenance(db, machine_id, user)
    return MaintenanceFormOptions(
        machine=FormMachine.model_validate(machine, from_attributes=True),
        openers=[PersonRef(id=u.id, name=u.name) for u in await _openers(db, machine, user)],
    )


@router.post("/machines/{machine_id}/maintenance", response_model=MaintenanceRecordOut)
async def create_maintenance(
    machine_id: int,
    description: Annotated[str, Form(min_length=1, max_length=5000)],
    opened_by_id: Annotated[int, Form()],
    user: CurrentUser,
    db: SessionDep,
    ctx: CtxDep,
    attachment: Annotated[UploadFile | None, File()] = None,
) -> MaintenanceRecordOut:
    """KAN-39: who did it and when come from the session; the form only says what and who asked."""
    machine = await _machine_for_maintenance(db, machine_id, user)
    if opened_by_id not in {u.id for u in await _openers(db, machine, user)}:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "İşi açan kişiyi listeden seçin.")
    kind = None
    if attachment is not None and storage.has_content(attachment):
        mime = attachment.content_type or ""
        kind = "photo" if mime.startswith("image/") else "video" if mime.startswith("video/") else None
        if kind is None:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Ek yalnızca fotoğraf veya video olabilir.")
    record = MaintenanceRecord(
        machine_id=machine.id, description=description.strip(), done_by_id=user.id, opened_by_id=opened_by_id
    )
    db.add(record)
    await db.flush()
    if attachment is not None and kind is not None:
        db.add(
            MaintenanceAttachment(
                record_id=record.id, kind=kind, file=storage.save_upload(attachment, f"maintenance/{record.id}")
            )
        )
    await db.commit()
    await db.refresh(record, ["machine", "done_by", "opened_by", "attachments"])
    patrons = await db.scalars(select(User.id).where(User.role == Role.patron, User.id != user.id))
    text = f"Bakım kaydı · {machine.name}: {record.description[:80]} ({user.name})"
    await notify(db, ctx.hub, [*patrons, opened_by_id], text, f"/m/{machine.id}")
    return record_out(record)


@router.get("/me/maintenance", response_model=list[MaintenanceRecordOut])
async def my_maintenance(user: CurrentUser, db: SessionDep) -> list[MaintenanceRecordOut]:
    rows = await db.scalars(
        select(MaintenanceRecord)
        .where(MaintenanceRecord.done_by_id == user.id)
        .order_by(MaintenanceRecord.created_at.desc(), MaintenanceRecord.id.desc())
    )
    return [record_out(r) for r in rows]
