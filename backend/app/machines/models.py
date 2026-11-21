from datetime import datetime
from enum import StrEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.auth.models import User
from app.core.schemas import utcnow
from app.db import Base

# Which ustas know which machine (KAN-28). Edited by the patron in SQLAdmin.
machine_ustas = Table(
    "machine_ustas",
    Base.metadata,
    Column("machine_id", ForeignKey("machines.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class Machine(Base):
    __tablename__ = "machines"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)  # printed under the QR, typed on the scan page
    name: Mapped[str] = mapped_column(String(120))
    type: Mapped[str] = mapped_column(String(120), default="")
    model: Mapped[str] = mapped_column(String(120), default="")
    serial: Mapped[str] = mapped_column(String(120), default="")
    location: Mapped[str] = mapped_column(String(200), default="")
    photo: Mapped[str | None] = mapped_column(String(255), default=None)  # path under uploads/
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    ustas: Mapped[list[User]] = relationship(secondary=machine_ustas, lazy="selectin", order_by=User.name)

    def __str__(self) -> str:
        return f"{self.code} · {self.name}"


class ExternalSource(StrEnum):
    manufacturer = "manufacturer"
    service_company = "service_company"
    other = "other"


class ExternalVideo(Base):
    """A link to a video hosted elsewhere (manufacturer, service company), KAN-34."""

    __tablename__ = "external_videos"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    url: Mapped[str] = mapped_column(String(500))
    embed_url: Mapped[str | None] = mapped_column(String(500), default=None)
    source: Mapped[ExternalSource] = mapped_column(Enum(ExternalSource, length=20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    machine: Mapped[Machine] = relationship(lazy="selectin")  # SQLAdmin form select
