from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.auth.models import User
from app.core.schemas import utcnow
from app.db import Base
from app.machines.models import Machine


class MaintenanceRecord(Base):
    """KAN-39. done_by and created_at come from the session, never from the form."""

    __tablename__ = "maintenance_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    description: Mapped[str] = mapped_column(Text)
    done_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    opened_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    machine: Mapped[Machine] = relationship(lazy="selectin")
    done_by: Mapped[User] = relationship(foreign_keys=[done_by_id], lazy="selectin")
    opened_by: Mapped[User] = relationship(foreign_keys=[opened_by_id], lazy="selectin")
    attachments: Mapped[list["MaintenanceAttachment"]] = relationship(lazy="selectin", cascade="all, delete-orphan")


class MaintenanceAttachment(Base):
    __tablename__ = "maintenance_attachments"

    id: Mapped[int] = mapped_column(primary_key=True)
    record_id: Mapped[int] = mapped_column(ForeignKey("maintenance_records.id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(String(8))  # photo | video
    file: Mapped[str] = mapped_column(String(255))
