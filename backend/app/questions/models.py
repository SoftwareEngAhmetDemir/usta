from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.auth.models import User
from app.core.schemas import utcnow
from app.db import Base
from app.machines.models import Machine


class QuestionStatus(StrEnum):
    open = "open"
    answered = "answered"


class Question(Base):
    """ "Ustaya sor" (KAN-62) and its answer (KAN-63). Texts are stored in the language they were written in."""

    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    asked_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    text: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(8))
    status: Mapped[QuestionStatus] = mapped_column(Enum(QuestionStatus, length=20), default=QuestionStatus.open)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    answered_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), default=None)
    answer_text: Mapped[str | None] = mapped_column(Text, default=None)
    answer_language: Mapped[str | None] = mapped_column(String(8), default=None)
    answer_video_id: Mapped[int | None] = mapped_column(ForeignKey("videos.id", ondelete="SET NULL"), default=None)
    answer_file: Mapped[str | None] = mapped_column(String(255), default=None)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)

    machine: Mapped[Machine] = relationship(lazy="selectin")
    asked_by: Mapped[User] = relationship(foreign_keys=[asked_by_id], lazy="selectin")
    answered_by: Mapped[User | None] = relationship(foreign_keys=[answered_by_id], lazy="selectin")

    def __str__(self) -> str:
        return self.text[:60]
