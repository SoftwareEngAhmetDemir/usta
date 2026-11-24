import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import AnyHttpUrl, BaseModel, StringConstraints, model_validator
from sqlalchemy import or_, select

from app.auth.deps import CurrentUser, PatronUser, require_role
from app.auth.models import MACHINE_ADDERS, Role, User
from app.core.schemas import utcnow
from app.deps import PublicUrl, SessionDep, forbidden, not_found
from app.machines import qr
from app.machines.models import ExternalSource, ExternalVideo, Machine
from app.machines.permissions import actions
from app.machines.service import ExternalVideoOut, MachinePage, embed_url, machine_page, search_condition

router = APIRouter(tags=["machines"])


class MachineId(BaseModel):
    id: int


class MachineRef(BaseModel):
    id: int
    code: str
    name: str


class MachineHit(MachineRef):
    location: str


Text = Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)]
MachineAdder = Annotated[User, Depends(require_role(*MACHINE_ADDERS))]


QrText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class MachineIn(BaseModel):
    # Ignored when `qr_text` is given: the code then comes from the QR (`qr.code_for_qr`), as the form shows it.
    code: Annotated[str, StringConstraints(strip_whitespace=True, to_upper=True, max_length=40)] = ""
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
    type: Text = ""
    model: Text = ""
    serial: Text = ""
    location: Annotated[str, StringConstraints(strip_whitespace=True, max_length=200)] = ""
    # The scanned QR that belongs to no machine yet (scan page → "add it?"); later scans find the machine by it.
    qr_text: QrText | None = None

    @model_validator(mode="after")
    def _code(self) -> "MachineIn":
        if self.qr_text:
            self.code = qr.code_for_qr(self.qr_text)
        elif not self.code:
            raise ValueError("Makine kodu gerekli.")
        return self


class QrIn(BaseModel):
    qr_text: QrText


class MachineCode(BaseModel):
    code: str


class ExternalVideoIn(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    url: AnyHttpUrl
    source: ExternalSource


MACHINE_LINK = re.compile(r"/m/(\d+)/?$")


# Declared before /machines/{machine_id} so "lookup" is not read as an id.
@router.get("/machines/lookup", response_model=MachineId)
async def lookup(
    code: Annotated[str, Query(min_length=1, max_length=500)], _: CurrentUser, db: SessionDep
) -> MachineId:
    """The QR text read by the in-page scanner (`<PUBLIC_URL>/m/<id>`, any host, so old stickers keep working;
    or a QR that was on the machine when it was added by scanning), or the code printed under the QR (KAN-29)."""
    text = code.strip()
    link = MACHINE_LINK.search(text)
    found = or_(Machine.code == text, Machine.qr_text == text, *([Machine.id == int(link[1])] if link else []))
    machine = await db.scalar(select(Machine).where(found, Machine.archived_at.is_(None)).limit(1))
    if machine is None:
        raise not_found("Bu kodla makine")
    return MachineId(id=machine.id)


@router.get("/machines", response_model=list[MachineHit])
async def search_machines(
    _: MachineAdder, db: SessionDep, q: Annotated[str, Query(max_length=100)] = ""
) -> list[MachineHit]:
    """Ustas and the patron find any machine by code, name, serial or location (empty `q` = all)."""
    query = select(Machine).where(Machine.archived_at.is_(None)).order_by(Machine.name).limit(50)
    if q.strip():
        query = query.where(search_condition(q.strip()))
    return [MachineHit(id=m.id, code=m.code, name=m.name, location=m.location) for m in await db.scalars(query)]


@router.post("/machines", response_model=MachineId, status_code=status.HTTP_201_CREATED)
async def create_machine(body: MachineIn, user: MachineAdder, db: SessionDep) -> MachineId:
    """KAN-27: an usta or the patron adds a machine; an usta becomes the new machine's usta."""
    # The QR first: its code comes from it, so a QR added twice would otherwise read as "code taken".
    if body.qr_text and await db.scalar(select(Machine.id).where(Machine.qr_text == body.qr_text)) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu QR zaten bir makineye bağlı (arşivlenmiş olabilir).")
    if await db.scalar(select(Machine.id).where(Machine.code == body.code)) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu kodla bir makine zaten var.")
    machine = Machine(**body.model_dump(), ustas=[user] if user.role == Role.usta else [])
    db.add(machine)
    await db.commit()
    return MachineId(id=machine.id)


@router.post("/machines/code-for-qr", response_model=MachineCode)
async def code_for_qr(body: QrIn, _: MachineAdder) -> MachineCode:
    """The code a machine added with this scanned QR gets, shown locked in the form (POST: QR text stays out of
    URLs and access logs)."""
    return MachineCode(code=qr.code_for_qr(body.qr_text))


@router.post("/machines/{machine_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive_machine(machine_id: int, user: CurrentUser, db: SessionDep) -> None:
    """KAN-27 "remove": the machine's ustas or the patron archive it; videos, documents and history stay."""
    machine = await db.get(Machine, machine_id)
    if machine is None or machine.archived_at is not None:
        raise not_found("Makine")
    if not actions(user, machine).archive:
        raise forbidden()
    machine.archived_at = utcnow()
    await db.commit()


@router.get("/machines/{machine_id}", response_model=MachinePage)
async def get_machine(machine_id: int, user: CurrentUser, db: SessionDep) -> MachinePage:
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    return await machine_page(db, machine, user)


@router.get("/me/machines", response_model=list[MachineRef])
async def my_machines(user: CurrentUser, db: SessionDep) -> list[MachineRef]:
    """Machines the recorder offers: an usta's own machines; everyone else sees all."""
    query = select(Machine).where(Machine.archived_at.is_(None)).order_by(Machine.name)
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


async def _qr_machine(db: SessionDep, machine_id: int, user: User) -> Machine:
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    if not actions(user, machine).qr:
        raise forbidden()
    return machine


@router.get("/machines/{machine_id}/qr.svg")
async def machine_qr(machine_id: int, user: CurrentUser, db: SessionDep, base: PublicUrl) -> Response:
    machine = await _qr_machine(db, machine_id, user)
    return Response(qr.svg(qr.machine_url(base, machine.id)), media_type="image/svg+xml")


@router.get("/machines/{machine_id}/sticker.pdf")
async def machine_sticker(machine_id: int, user: CurrentUser, db: SessionDep, base: PublicUrl) -> Response:
    """One printable sticker for this machine, e.g. right after an usta adds it (KAN-29, KAN-30)."""
    machine = await _qr_machine(db, machine_id, user)
    return Response(
        qr.sticker_sheet([machine], base),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="qr-{machine.id}.pdf"'},
    )
