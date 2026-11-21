from typing import Annotated

from fastapi import APIRouter, Query, Response
from pydantic import AnyHttpUrl, BaseModel, StringConstraints
from sqlalchemy import select

from app.auth.deps import CurrentUser, PatronUser
from app.auth.models import Role, User
from app.deps import CtxDep, SessionDep, not_found
from app.machines import qr
from app.machines.models import ExternalSource, ExternalVideo, Machine
from app.machines.service import ExternalVideoOut, MachinePage, embed_url, machine_page

router = APIRouter(tags=["machines"])


class MachineId(BaseModel):
    id: int


class MachineRef(BaseModel):
    id: int
    code: str
    name: str


class ExternalVideoIn(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    url: AnyHttpUrl
    source: ExternalSource


# Declared before /machines/{machine_id} so "lookup" is not read as an id.
@router.get("/machines/lookup", response_model=MachineId)
async def lookup(code: Annotated[str, Query(min_length=1, max_length=40)], _: CurrentUser, db: SessionDep) -> MachineId:
    """The code printed under the QR, for when the camera can't read it (KAN-29)."""
    machine = await db.scalar(select(Machine).where(Machine.code == code.strip()))
    if machine is None:
        raise not_found("Bu kodla makine")
    return MachineId(id=machine.id)


@router.get("/machines/{machine_id}", response_model=MachinePage)
async def get_machine(machine_id: int, user: CurrentUser, db: SessionDep) -> MachinePage:
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    return await machine_page(db, machine, user)


@router.get("/me/machines", response_model=list[MachineRef])
async def my_machines(user: CurrentUser, db: SessionDep) -> list[MachineRef]:
    """Machines the recorder offers: an usta's own machines; everyone else sees all."""
    query = select(Machine).order_by(Machine.name)
    if user.role == Role.usta:
        query = query.where(Machine.ustas.any(User.id == user.id))
    return [MachineRef(id=m.id, code=m.code, name=m.name) for m in await db.scalars(query)]


@router.post("/machines/{machine_id}/external-videos", response_model=ExternalVideoOut)
async def add_external_video(machine_id: int, body: ExternalVideoIn, _: PatronUser, db: SessionDep) -> ExternalVideoOut:
    """KAN-34: a manufacturer / service company video link."""
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    url = str(body.url)
    video = ExternalVideo(
        machine_id=machine.id, title=body.title, url=url, embed_url=embed_url(url), source=body.source
    )
    db.add(video)
    await db.commit()
    return ExternalVideoOut.model_validate(video)


@router.get("/machines/{machine_id}/qr.svg")
async def machine_qr(machine_id: int, _: PatronUser, db: SessionDep, ctx: CtxDep) -> Response:
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    return Response(qr.svg(qr.machine_url(ctx.settings.public_url, machine.id)), media_type="image/svg+xml")
