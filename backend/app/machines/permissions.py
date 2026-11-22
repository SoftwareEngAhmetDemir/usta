from pydantic import BaseModel

from app.auth.models import Role, User
from app.machines.models import Machine


class MachineActions(BaseModel):
    """What the viewer may do on a machine page; the frontend only shows/hides buttons from this."""

    ask: bool
    record_video: bool
    upload_document: bool
    record_maintenance: bool
    archive: bool
    qr: bool  # QR image + printable sticker: its ustas and the patron


def is_usta_of(user: User, machine: Machine) -> bool:
    return user.role == Role.usta and any(u.id == user.id for u in machine.ustas)


def actions(user: User, machine: Machine) -> MachineActions:
    patron = user.role == Role.patron
    return MachineActions(
        ask=True,
        record_video=patron or is_usta_of(user, machine),
        upload_document=patron or is_usta_of(user, machine),
        record_maintenance=patron or user.role == Role.technician,
        archive=machine.archived_at is None and (patron or is_usta_of(user, machine)),
        qr=patron or is_usta_of(user, machine),
    )


def can_answer(user: User, machine: Machine) -> bool:
    """The machine's ustas answer its questions; the patron may answer any question."""
    return is_usta_of(user, machine) or user.role == Role.patron
