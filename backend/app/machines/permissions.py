from pydantic import BaseModel

from app.auth.models import Role, User
from app.machines.models import Machine


class MachineActions(BaseModel):
    """What the viewer may do on a machine page; the frontend only shows/hides buttons from this."""

    ask: bool
    record_video: bool
    upload_document: bool
    record_maintenance: bool


def is_usta_of(user: User, machine: Machine) -> bool:
    return user.role == Role.usta and any(u.id == user.id for u in machine.ustas)


def actions(user: User, machine: Machine) -> MachineActions:
    patron = user.role == Role.patron
    return MachineActions(
        ask=True,
        record_video=patron or is_usta_of(user, machine),
        upload_document=patron,
        record_maintenance=patron or user.role == Role.technician,
    )


def can_answer(user: User, machine: Machine) -> bool:
    """The machine's ustas answer its questions; the patron covers machines that have no usta yet."""
    return is_usta_of(user, machine) or (user.role == Role.patron and not machine.ustas)
