from typing import Literal

from pydantic import BaseModel

from app.auth.models import User
from app.core import storage
from app.core.schemas import AuthorizedPerson, PersonRef, UtcDateTime
from app.maintenance.models import MaintenanceRecord


class AttachmentOut(BaseModel):
    id: int
    kind: Literal["photo", "video"]
    url: str


class MaintenanceRecordOut(BaseModel):
    id: int
    machine_id: int
    machine_name: str
    description: str
    created_at: UtcDateTime
    done_by: AuthorizedPerson
    opened_by: PersonRef
    attachments: list[AttachmentOut]


def authorized_person(user: User) -> AuthorizedPerson:
    return AuthorizedPerson(
        id=user.id,
        name=user.name,
        authorized=user.authorized,
        authorization_document_url=storage.url(user.authorization_document),
    )


def record_out(r: MaintenanceRecord) -> MaintenanceRecordOut:
    return MaintenanceRecordOut(
        id=r.id,
        machine_id=r.machine_id,
        machine_name=r.machine.name,
        description=r.description,
        created_at=r.created_at,
        done_by=authorized_person(r.done_by),
        opened_by=PersonRef(id=r.opened_by.id, name=r.opened_by.name),
        attachments=[
            AttachmentOut(id=a.id, kind="video" if a.kind == "video" else "photo", url=storage.url(a.file) or "")
            for a in r.attachments
        ],
    )
