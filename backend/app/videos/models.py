from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.auth.models import User
from app.core.schemas import utcnow
from app.db import Base

UPLOAD_PIPELINE = "upload"  # VideoStep.pipeline for the after-upload steps; otherwise a language code


class VideoStatus(StrEnum):
    processing = "processing"
    ready = "ready"
    failed = "failed"


class StepStatus(StrEnum):
    waiting = "waiting"
    running = "running"
    done = "done"
    failed = "failed"


class Video(Base):
    """An usta's own recording. Files in uploads/videos/<id>/: original, stream.mp4, thumb.jpg, <lang>.vtt/.mp4."""

    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), default=None)
    title: Mapped[str] = mapped_column(String(200))
    original: Mapped[str] = mapped_column(String(255))
    stream: Mapped[str | None] = mapped_column(String(255), default=None)
    thumbnail: Mapped[str | None] = mapped_column(String(255), default=None)
    duration_sec: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[VideoStatus] = mapped_column(Enum(VideoStatus, length=20), default=VideoStatus.processing)
    language: Mapped[str] = mapped_column(String(8))  # spoken language (from transcription; author's until then)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    author: Mapped[User | None] = relationship(lazy="selectin")

    def __str__(self) -> str:
        return self.title


class VideoStep(Base):
    """One step of a pipeline: the after-upload processing, or preparing one language on demand (KAN-55)."""

    __tablename__ = "video_steps"
    __table_args__ = (UniqueConstraint("video_id", "pipeline", "key"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey("videos.id", ondelete="CASCADE"))
    pipeline: Mapped[str] = mapped_column(String(8))
    position: Mapped[int] = mapped_column(Integer)
    key: Mapped[str] = mapped_column(String(20))
    label: Mapped[str] = mapped_column(String(60))
    status: Mapped[StepStatus] = mapped_column(Enum(StepStatus, length=20), default=StepStatus.waiting)
    error: Mapped[str | None] = mapped_column(String(300), default=None)
    requested_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), default=None)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"
    __table_args__ = (Index("ix_transcript_video_lang", "video_id", "language"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey("videos.id", ondelete="CASCADE"))
    language: Mapped[str] = mapped_column(String(8))
    position: Mapped[int] = mapped_column(Integer)
    start_sec: Mapped[float] = mapped_column(Float)
    end_sec: Mapped[float] = mapped_column(Float)
    text: Mapped[str] = mapped_column(Text)
