from datetime import datetime
from enum import StrEnum

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.schemas import utcnow
from app.db import Base


class DocumentType(StrEnum):
    user_manual = "user_manual"
    operating_instructions = "operating_instructions"
    catalog = "catalog"
    technical_info = "technical_info"


class SummaryStatus(StrEnum):
    ready = "ready"
    preparing = "preparing"
    none = "none"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[int] = mapped_column(ForeignKey("machines.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    type: Mapped[DocumentType] = mapped_column(Enum(DocumentType, length=30))
    file: Mapped[str] = mapped_column(String(255))  # path under uploads/
    mime_type: Mapped[str] = mapped_column(String(100))
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    summary_status: Mapped[SummaryStatus] = mapped_column(
        Enum(SummaryStatus, length=20), default=SummaryStatus.preparing
    )
    uploaded_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    def __str__(self) -> str:
        return self.title


class DocumentPage(Base):
    """Extracted text per page: the source for summaries and "Makineye sor"."""

    __tablename__ = "document_pages"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    page: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)


class DocumentSummaryText(Base):
    """AI summary of a document, one row per language."""

    __tablename__ = "document_summaries"

    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    lang: Mapped[str] = mapped_column(String(8), primary_key=True)
    points: Mapped[list[str]] = mapped_column(JSON)
