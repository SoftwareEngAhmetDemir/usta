from datetime import datetime
from enum import StrEnum

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
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
    language_hint: Mapped[str | None] = mapped_column(String(8), default=None)  # given at upload; None = detect
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    # app.videos.timeline.RateSummary: average/median words and characters per second (used for dubbing)
    speaking_rate: Mapped[dict[str, float] | None] = mapped_column(JSON, default=None)

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
    """One sentence of the transcript. Rows in the spoken language carry Whisper's confidence, word timings and the
    speaking-rate figures; rows in other languages are their translations at the same times."""

    __tablename__ = "transcript_segments"
    __table_args__ = (Index("ix_transcript_video_lang", "video_id", "language"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey("videos.id", ondelete="CASCADE"))
    language: Mapped[str] = mapped_column(String(8))
    position: Mapped[int] = mapped_column(Integer)
    start_sec: Mapped[float] = mapped_column(Float)
    end_sec: Mapped[float] = mapped_column(Float)
    text: Mapped[str] = mapped_column(Text)
    raw_text: Mapped[str | None] = mapped_column(Text, default=None)  # Whisper's own words when the LLM corrected them
    avg_logprob: Mapped[float | None] = mapped_column(Float, default=None)
    words: Mapped[list[dict[str, float | str]] | None] = mapped_column(
        JSON, default=None
    )  # [{start,end,text,probability}]
    duration: Mapped[float | None] = mapped_column(Float, default=None)
    word_count: Mapped[int | None] = mapped_column(Integer, default=None)
    words_per_sec: Mapped[float | None] = mapped_column(Float, default=None)
    chars_per_sec: Mapped[float | None] = mapped_column(Float, default=None)
    pause_before: Mapped[float | None] = mapped_column(Float, default=None)
    pause_after: Mapped[float | None] = mapped_column(Float, default=None)


class TopicSegment(Base):
    """A stretch of a video about one topic (app/videos/topics.py); one search chunk per topic."""

    __tablename__ = "topic_segments"

    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey("videos.id", ondelete="CASCADE"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    start_sec: Mapped[float] = mapped_column(Float)
    end_sec: Mapped[float] = mapped_column(Float)
    first_sentence: Mapped[int] = mapped_column(Integer)  # TranscriptSegment.position
    last_sentence: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)


class Snapshot(Base):
    """A keyframe of a topic segment, shown next to answers that cite it. File: uploads/videos/<id>/snapshots/."""

    __tablename__ = "snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey("videos.id", ondelete="CASCADE"), index=True)
    topic_segment_id: Mapped[int] = mapped_column(ForeignKey("topic_segments.id", ondelete="CASCADE"), index=True)
    time_sec: Mapped[float] = mapped_column(Float)
    path: Mapped[str] = mapped_column(String(255))
    sharpness: Mapped[float] = mapped_column(Float)  # Laplacian variance; higher = sharper


class DubbedVersion(Base):
    """Cache of one language's dub: generated once per (video, language) (KAN-53, 55)."""

    __tablename__ = "dubbed_versions"
    __table_args__ = (UniqueConstraint("video_id", "language"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    video_id: Mapped[int] = mapped_column(ForeignKey("videos.id", ondelete="CASCADE"))
    language: Mapped[str] = mapped_column(String(8))
    status: Mapped[str] = mapped_column(String(20), default="preparing")  # preparing | ready | failed
    audio_path: Mapped[str | None] = mapped_column(String(255), default=None)  # dub track (m4a)
    video_path: Mapped[str | None] = mapped_column(String(255), default=None)  # mp4: dub track + original track
    subtitle_vtt: Mapped[str | None] = mapped_column(String(255), default=None)
    subtitle_srt: Mapped[str | None] = mapped_column(String(255), default=None)
    late_clips: Mapped[int] = mapped_column(Integer, default=0)  # clips that overran their slot (dub drifted)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
