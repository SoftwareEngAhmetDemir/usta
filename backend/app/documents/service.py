"""Machine documents (KAN-33, 43, 44, 45, 59): structured text and search chunks for "Makineye sor", and a
summary (LLM) in each language (machine-translated)."""

import asyncio
import logging
import shutil

from pydantic import BaseModel
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.interfaces import AIUnavailableError
from app.context import AppContext
from app.core import storage
from app.core.languages import DEFAULT_LANGUAGE, LANGUAGES, lang_dir, lang_name, localized
from app.core.schemas import Dir, LocalizedText
from app.documents.extract import Extracted, extract
from app.documents.models import Document, DocumentPage, DocumentSummaryText, DocumentType, SummaryStatus
from app.jobs.queue import Payload, Progress
from app.search.chunking import chunk_document, with_heading
from app.search.service import ChunkIn, Owner, delete_chunks, embed_and_store
from app.translations.service import translate

log = logging.getLogger(__name__)

JOB_KIND = "document_ingest"


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


async def process(ctx: AppContext, document_id: int) -> None:
    """Job: extract structured text (OCR for scans/photos), index it for search, write the summary in every language."""
    async with ctx.sessionmaker() as db:
        doc = await db.get(Document, document_id)
        if doc is None:
            return
        try:
            found = await asyncio.to_thread(
                extract, storage.abs_path(doc.file), doc.mime_type, ctx.ai.ocr_languages, ctx.ai.tessdata_dir
            )
        except Exception as e:  # any parser error on an uploaded file: an empty document, not a crashed job
            log.warning("document %s unreadable: %s", document_id, e)
            found = Extracted([], 0)
        pages = found.page_texts()
        await db.execute(delete(DocumentPage).where(DocumentPage.document_id == doc.id))
        db.add_all(DocumentPage(document_id=doc.id, page=i, text=t) for i, t in enumerate(pages, start=1))
        doc.page_count = found.page_count
        await db.commit()
        chunks = [
            ChunkIn(text=with_heading(c), language=doc.language, title=doc.file_name or doc.title, page=c.page,
                    section_heading=c.heading or None)
            for c in chunk_document(found.blocks)
        ]  # fmt: skip
        await embed_and_store(db, ctx.ai, doc.machine_id, Owner(document_id=doc.id), chunks)
        if not any(p.strip() for p in pages):
            doc.summary_status = SummaryStatus.none
            await db.commit()
            return
        try:
            points = await ctx.ai.llm.summarize(pages, DEFAULT_LANGUAGE)
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


async def remove_document(ctx: AppContext, db: AsyncSession, doc: Document) -> None:
    """Rows cascade (pages, summaries, chunks); vectors and the file folder are removed here."""
    await delete_chunks(db, ctx.ai, Owner(document_id=doc.id))
    folder = storage.abs_path(f"docs/{doc.id}")
    await db.delete(doc)
    await db.commit()
    await asyncio.to_thread(shutil.rmtree, folder, True)


async def job(ctx: AppContext, payload: Payload, progress: Progress) -> None:
    """Job handler (kind "document_ingest"): {"document_id": int}."""
    await progress(10, "Doküman okunuyor")
    await process(ctx, int(payload["document_id"]))


async def _store_summaries(db: AsyncSession, ctx: AppContext, doc_id: int, points: list[str]) -> None:
    await db.execute(delete(DocumentSummaryText).where(DocumentSummaryText.document_id == doc_id))
    for lang in LANGUAGES:
        try:
            translated = await translate(db, ctx.ai.translator, points, DEFAULT_LANGUAGE, lang)
        except AIUnavailableError as e:  # that language falls back to the Turkish summary
            log.warning("summary of document %s not translated to %s: %s", doc_id, lang, e)
            continue
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
