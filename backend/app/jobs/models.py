from datetime import datetime
from enum import StrEnum

from sqlalchemy import JSON, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.schemas import utcnow
from app.db import Base


class JobStatus(StrEnum):
    queued = "queued"
    processing = "processing"
    done = "done"
    failed = "failed"


class Job(Base):
    """Background work, run by app.jobs.worker. The row is the queue: no Redis or Celery."""

    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(40))  # app.jobs.handlers.HANDLERS key
    payload: Mapped[dict[str, str | int]] = mapped_column(JSON)
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus, length=20), default=JobStatus.queued, index=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)  # 0-100
    step: Mapped[str | None] = mapped_column(String(100), default=None)  # what it is doing now (Turkish label)
    error: Mapped[str | None] = mapped_column(String(500), default=None)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)
