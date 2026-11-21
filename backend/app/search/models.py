from sqlalchemy import JSON, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class SearchChunk(Base):
    """A piece of a machine's knowledge for "Makineye sor" (KAN-60): a stretch of an usta video transcript,
    a document page, or an earlier usta answer, with its embedding vector."""

    __tablename__ = "search_chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(16))  # video | document | usta_answer
    video_id: Mapped[int | None] = mapped_column(ForeignKey("videos.id", ondelete="CASCADE"), default=None)
    start_sec: Mapped[float | None] = mapped_column(Float, default=None)
    document_id: Mapped[int | None] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), default=None)
    page: Mapped[int | None] = mapped_column(Integer, default=None)
    question_id: Mapped[int | None] = mapped_column(ForeignKey("questions.id", ondelete="CASCADE"), default=None)
    text: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(JSON)
