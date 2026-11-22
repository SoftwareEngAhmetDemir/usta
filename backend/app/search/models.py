from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.schemas import utcnow
from app.db import Base


class Chunk(Base):
    """A searchable piece of one machine's knowledge (KAN-58, 59, 60): a video topic, a document section, or an
    earlier usta answer. Text + metadata live here; the vector lives in the VectorStore under the same id."""

    __tablename__ = "chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    source_type: Mapped[str] = mapped_column(String(16))  # video | document | usta_answer
    video_id: Mapped[int | None] = mapped_column(ForeignKey("videos.id", ondelete="CASCADE"), default=None, index=True)
    document_id: Mapped[int | None] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), default=None, index=True
    )
    question_id: Mapped[int | None] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), default=None, index=True
    )
    topic_segment_id: Mapped[int | None] = mapped_column(
        ForeignKey("topic_segments.id", ondelete="SET NULL"), default=None
    )
    title: Mapped[str] = mapped_column(String(255), default="")  # video title / document file name
    start_sec: Mapped[float | None] = mapped_column(Float, default=None)
    end_sec: Mapped[float | None] = mapped_column(Float, default=None)
    page: Mapped[int | None] = mapped_column(Integer, default=None)
    section_heading: Mapped[str | None] = mapped_column(String(255), default=None)
    language: Mapped[str] = mapped_column(String(8))
    snapshot_paths: Mapped[list[str]] = mapped_column(JSON, default=list)
    text: Mapped[str] = mapped_column(Text)
    embedding_model_version: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
