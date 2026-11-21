"""Machine documents (KAN-33, 43, 45): text per page for "Makineye sor", and an AI summary in each language."""

import asyncio
import logging
from pathlib import Path

from pydantic import BaseModel
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.protocol import AIUnavailableError
from app.context import AppContext
from app.core import storage
from app.core.languages import DEFAULT_LANGUAGE, LANGUAGES, lang_dir, lang_name, localized
from app.core.schemas import Dir, LocalizedText
from app.documents.models import Document, DocumentPage, DocumentSummaryText, DocumentType, SummaryStatus
from app.search.service import page_chunks, replace_chunks
from app.translations.service import translate

log = logging.getLogger(__name__)

ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}


class DocumentSummaryOut(BaseModel):
    id: int
    title: str
    type: DocumentType
    page_count: int
    summary_status: SummaryStatus
    summary_preview: LocalizedText | None


class SummaryOut(BaseModel):
    points: list[str]
    lang: str
    dir: Dir
    language_name: str


class DocumentDetail(BaseModel):
    id: int
    machine_id: int
    machine_name: str
    title: str
    type: DocumentType
    page_count: int
    file_url: str
    mime_type: str
    summary_status: SummaryStatus
    summary: SummaryOut | None


def _pdf_pages(path: Path) -> list[str]:
    return [page.extract_text() or "" for page in PdfReader(path).pages]


async def _pages(ctx: AppContext, doc: Document) -> list[str]:
    path = storage.abs_path(doc.file)
    if doc.mime_type == "application/pdf":
        # shortcut: scanned PDFs without a text layer give empty pages; per-page OCR needs rendering pages to images.
        return await asyncio.to_thread(_pdf_pages, path)
    try:
        return [await ctx.ai.read_image(path, doc.mime_type)]
    except AIUnavailableError:
        return [""]


async def process(ctx: AppContext, document_id: int) -> None:
    """Job: extract page texts, index them for search, write the summary in every language."""
    async with ctx.sessionmaker() as db:
        doc = await db.get(Document, document_id)
        if doc is None:
            return
        try:
            pages = await _pages(ctx, doc)
        except (PdfReadError, OSError, ValueError) as e:
            log.warning("document %s unreadable: %s", document_id, e)
            pages = []
        await db.execute(delete(DocumentPage).where(DocumentPage.document_id == doc.id))
        db.add_all(DocumentPage(document_id=doc.id, page=i, text=t) for i, t in enumerate(pages, start=1))
        doc.page_count = len(pages)
        await db.commit()
        if not any(p.strip() for p in pages):
            doc.summary_status = SummaryStatus.none
            await db.commit()
            return
        try:
            await replace_chunks(db, ctx.ai, doc.machine_id, "document", page_chunks(pages), document_id=doc.id)
            points = await ctx.ai.summarize(pages, DEFAULT_LANGUAGE)
            await _store_summaries(db, ctx, doc.id, points)
            doc.summary_status = SummaryStatus.ready
            await db.commit()
        except AIUnavailableError as e:
            log.warning("document %s summary skipped: %s", document_id, e)
            await db.rollback()  # expires `doc`: update by id instead of touching it
            await db.execute(
                update(Document).where(Document.id == document_id).values(summary_status=SummaryStatus.none)
            )
            await db.commit()


async def _store_summaries(db: AsyncSession, ctx: AppContext, doc_id: int, points: list[str]) -> None:
    await db.execute(delete(DocumentSummaryText).where(DocumentSummaryText.document_id == doc_id))
    for lang in LANGUAGES:
        translated = await translate(db, ctx.ai, points, DEFAULT_LANGUAGE, lang)
        db.add(DocumentSummaryText(document_id=doc_id, lang=lang, points=translated))
    await db.commit()


async def summaries(db: AsyncSession, doc_ids: list[int], lang: str) -> dict[int, DocumentSummaryText]:
    """Per document: the summary in `lang`, else the Turkish one."""
    if not doc_ids:
        return {}
    rows = await db.scalars(
        select(DocumentSummaryText).where(
            DocumentSummaryText.document_id.in_(doc_ids), DocumentSummaryText.lang.in_({lang, DEFAULT_LANGUAGE})
        )
    )
    out: dict[int, DocumentSummaryText] = {}
    for row in rows:
        if row.document_id not in out or row.lang == lang:
            out[row.document_id] = row
    return out


def summary_out(doc: Document, found: DocumentSummaryText | None) -> DocumentSummaryOut:
    preview = localized(found.points[0], found.lang) if found and found.points else None
    return DocumentSummaryOut(
        id=doc.id,
        title=doc.title,
        type=doc.type,
        page_count=doc.page_count,
        summary_status=doc.summary_status,
        summary_preview=preview,
    )


def detail_out(doc: Document, machine_name: str, found: DocumentSummaryText | None) -> DocumentDetail:
    summary = (
        SummaryOut(points=found.points, lang=found.lang, dir=lang_dir(found.lang), language_name=lang_name(found.lang))
        if found and doc.summary_status == SummaryStatus.ready
        else None
    )
    return DocumentDetail(
        id=doc.id,
        machine_id=doc.machine_id,
        machine_name=machine_name,
        title=doc.title,
        type=doc.type,
        page_count=doc.page_count,
        file_url=storage.url(doc.file) or "",
        mime_type=doc.mime_type,
        summary_status=doc.summary_status,
        summary=summary,
    )
