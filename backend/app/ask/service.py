""" "Makineye sor" (KAN-60, 76, 77, 78): hybrid search → rerank → confidence gate → one LLM call.
Answers come only from this machine's video topics, document sections and earlier usta answers. Anything uncertain
becomes "not found" (→ "Ustaya sor"): on dangerous machines no answer beats a wrong one."""

import logging
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.interfaces import AIUnavailableError
from app.ask.models import AskLog
from app.auth.models import User
from app.context import AppContext
from app.core import storage
from app.core.languages import localized
from app.core.schemas import LocalizedText, PersonRef, UtcDateTime
from app.documents.models import Document
from app.machines.models import Machine
from app.questions.models import Question
from app.questions.service import person
from app.search.models import Chunk
from app.search.service import Candidate, hybrid_search, rerank
from app.translations.service import AUTO_DETECT, translate
from app.videos.models import Video
from app.videos.timeline import format_timestamp

log = logging.getLogger(__name__)


class VideoSource(BaseModel):
    kind: Literal["video"] = "video"
    video_id: int
    title: str
    usta_name: str
    start_sec: int  # the player opens here
    end_sec: int
    timestamp_label: str  # "1:05"
    snapshot_urls: list[str]


class DocumentSource(BaseModel):
    kind: Literal["document"] = "document"
    document_id: int
    title: str
    file_name: str
    page: int
    section_heading: str | None


class UstaAnswerSource(BaseModel):
    kind: Literal["usta_answer"] = "usta_answer"
    question_id: int
    usta_name: str
    answered_at: UtcDateTime


AnswerSource = Annotated[VideoSource | DocumentSource | UstaAnswerSource, Field(discriminator="kind")]


class Answered(BaseModel):
    status: Literal["answered"] = "answered"
    answer: LocalizedText
    sources: list[AnswerSource]
    confidence: float  # rerank score (0..1) of the best cited source
    ask_id: int  # for feedback


class NotFound(BaseModel):
    status: Literal["not_found"] = "not_found"
    ustas: list[PersonRef]
    ask_id: int


AskResult = Annotated[Answered | NotFound, Field(discriminator="status")]


def _date(value: datetime | None) -> str:
    return value.date().isoformat() if value else "?"


async def _describe(db: AsyncSession, chunk: Chunk) -> tuple[str, AnswerSource | None]:
    """The text the LLM sees for a chunk (with type, place and date, so it can prefer newer sources), and the
    source shown to the worker. Built from our own records, never from LLM output."""
    if chunk.source_type == "video" and chunk.video_id is not None:
        video = await db.get(Video, chunk.video_id)
        if video:
            start, end = chunk.start_sec or 0.0, chunk.end_sec or chunk.start_sec or 0.0
            hours = video.duration_sec >= 3600
            label = format_timestamp(start, hours)
            span = f"{label}–{format_timestamp(end, hours)}"
            header = f'(usta video "{video.title}", {span}, recorded {_date(video.created_at)})'
            video_source = VideoSource(
                video_id=video.id, title=video.title, usta_name=video.author.name if video.author else "",
                start_sec=int(start), end_sec=int(end), timestamp_label=label,
                snapshot_urls=[u for p in chunk.snapshot_paths if (u := storage.url(p))],
            )  # fmt: skip
            return f"{header}\n{chunk.text}", video_source
    if chunk.source_type == "document" and chunk.document_id is not None:
        doc = await db.get(Document, chunk.document_id)
        if doc:
            section = f', section "{chunk.section_heading}"' if chunk.section_heading else ""
            header = f'(document "{doc.title}", page {chunk.page or 1}{section}, added {_date(doc.created_at)})'
            source = DocumentSource(
                document_id=doc.id, title=doc.title, file_name=doc.file_name or doc.title, page=chunk.page or 1,
                section_heading=chunk.section_heading,
            )  # fmt: skip
            return f"{header}\n{chunk.text}", source
    if chunk.source_type == "usta_answer" and chunk.question_id is not None:
        q = await db.get(Question, chunk.question_id)
        if q and q.answered_by and q.answered_at:
            header = f"(earlier usta answer by {q.answered_by.name}, {_date(q.answered_at)})"
            return f"{header}\n{chunk.text}", UstaAnswerSource(
                question_id=q.id, usta_name=q.answered_by.name, answered_at=q.answered_at
            )
    return chunk.text, None


async def _translated(ctx: AppContext, db: AsyncSession, machine_id: int, question: str) -> list[str]:
    """The question machine-translated (MT, cached; not an LLM) into each language this machine's knowledge is in,
    so an Arabic question finds Turkish videos by their own words too ("الفوهة" → "nozul"). The question's language
    is detected ("auto"), not taken from the profile: a Turkish-profile worker may type English. Retrieval only: the
    LLM still gets the worker's own question. Skipped when translation is unavailable."""
    languages = await db.scalars(select(Chunk.language).where(Chunk.machine_id == machine_id).distinct())
    out: list[str] = []
    for target in languages:
        try:
            out += await translate(db, ctx.ai.translator, [question], AUTO_DETECT, target)
        except AIUnavailableError as e:
            log.info("question not translated to %s for search: %s", target, e)
    return [q for q in dict.fromkeys(out) if q != question]


def _retrieved(candidates: list[Candidate]) -> list[dict[str, float | int | None]]:
    return [
        {"chunk_id": c.chunk.id, "vector_rank": c.vector_rank, "keyword_rank": c.keyword_rank,
         "rrf": round(c.rrf, 5), "rerank": round(c.rerank, 4)}
        for c in candidates
    ]  # fmt: skip


async def answer_question(
    ctx: AppContext, db: AsyncSession, machine: Machine, question: str, asker: User
) -> Answered | NotFound:
    settings, language = ctx.settings, asker.language
    entry = AskLog(machine_id=machine.id, user_id=asker.id, question=question, language=language)
    db.add(entry)
    await db.flush()
    not_found = NotFound(ustas=[person(u) for u in machine.ustas if u.id != asker.id], ask_id=entry.id)
    try:
        queries = [question, *await _translated(ctx, db, machine.id, question)]
        candidates = await hybrid_search(db, ctx.ai, machine.id, queries, settings.ask_candidates)
        top = await rerank(ctx.ai, queries, candidates, settings.ask_top_k) if candidates else []
    except Exception:  # a local model failed to load/run: say "not found", never guess
        log.exception("ask machine %s: retrieval failed", machine.id)
        await db.commit()
        return not_found
    entry.retrieved = _retrieved(top)
    entry.top_score = top[0].rerank if top else None
    if not top or top[0].rerank < settings.ask_min_score:  # confidence gate: the LLM is not called
        await db.commit()
        return not_found

    described = [await _describe(db, c.chunk) for c in top]
    entry.llm_called = True
    try:
        draft = await ctx.ai.llm.answer(question, language, [text for text, _ in described])
    except AIUnavailableError as e:
        log.warning("ask machine %s: %s", machine.id, e)
        await db.commit()
        return not_found
    used = [i - 1 for i in dict.fromkeys(draft.source_ids) if 1 <= i <= len(top)]
    sources = [s for i in used if (s := described[i][1]) is not None]
    if not draft.found or not draft.answer.strip() or not sources:  # an answer citing none of the sources is dropped
        await db.commit()
        return not_found
    confidence = round(max(top[i].rerank for i in used), 3)
    entry.found, entry.answer, entry.confidence = True, draft.answer.strip(), confidence
    entry.cited_chunk_ids = [top[i].chunk.id for i in used]
    await db.commit()
    return Answered(
        answer=localized(draft.answer.strip(), language), sources=sources, confidence=confidence, ask_id=entry.id
    )
