from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.schemas import utcnow
from app.db import Base


class AskLog(Base):
    """Every "Makineye sor" question with what retrieval found, what was answered and the worker's feedback,
    for evaluating and tuning the thresholds later."""

    __tablename__ = "ask_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), default=None)
    question: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(8))
    # [{chunk_id, vector_rank, keyword_rank, rrf, rerank}] best first
    retrieved: Mapped[list[dict[str, float | int | None]]] = mapped_column(JSON, default=list)
    top_score: Mapped[float | None] = mapped_column(Float, default=None)  # best rerank score
    llm_called: Mapped[bool] = mapped_column(Boolean, default=False)
    found: Mapped[bool] = mapped_column(Boolean, default=False)
    answer: Mapped[str | None] = mapped_column(Text, default=None)
    cited_chunk_ids: Mapped[list[int]] = mapped_column(JSON, default=list)
    confidence: Mapped[float | None] = mapped_column(Float, default=None)
    feedback: Mapped[str | None] = mapped_column(String(20), default=None)  # helpful | not_helpful
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    feedback_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)
