from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, false, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Role(StrEnum):
    worker = "worker"
    usta = "usta"
    technician = "technician"
    patron = "patron"


# Who may add machines (KAN-27, user's decision 2026-11-21): the endpoint checks it, `Me` tells the frontend.
MACHINE_ADDERS = (Role.usta, Role.patron)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    login: Mapped[str] = mapped_column(String(255), unique=True)  # normalized phone or e-mail
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(
        Enum(Role, native_enum=True, length=20), default=Role.worker, server_default=Role.worker.value
    )
    language: Mapped[str] = mapped_column(String(8), default="tr", server_default="tr")
    authorized: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    authorization_note: Mapped[str | None] = mapped_column(String(500), default=None)
    authorization_document: Mapped[str | None] = mapped_column(String(255), default=None)  # path under uploads/
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    def __str__(self) -> str:  # SQLAdmin select boxes
        return f"{self.name} ({self.role})"


class AuthSession(Base):
    """One row per logged-in device. The cookie holds a random token; only its SHA-256 is stored."""

    __tablename__ = "auth_sessions"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)  # naive UTC
