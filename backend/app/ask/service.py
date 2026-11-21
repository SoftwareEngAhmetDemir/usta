""" "Makineye sor" (KAN-60). Answers come only from this machine's usta videos, document pages and earlier usta
answers. Anything uncertain becomes "not found": on dangerous machines no answer beats a wrong one."""

import logging
from typing import Annotated, Literal

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.protocol import AIUnavailableError
from app.context import AppContext
from app.core.languages import localized
from app.core.schemas import LocalizedText, PersonRef, UtcDateTime
from app.documents.models import Document
from app.machines.models import Machine
from app.questions.models import Question
from app.questions.service import person
from app.search.models import SearchChunk
from app.search.service import nearest
from app.videos.models import Video

log = logging.getLogger(__name__)


class VideoSource(BaseModel):
    kind: Literal["video"] = "video"
    video_id: int
    title: str
    usta_name: str
    start_sec: int


class DocumentSource(BaseModel):
    kind: Literal["document"] = "document"
    document_id: int
    title: str
    page: int


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


class NotFound(BaseModel):
    status: Literal["not_found"] = "not_found"
    ustas: list[PersonRef]


AskResult = Annotated[Answered | NotFound, Field(discriminator="status")]


async def _source(db: AsyncSession, chunk: SearchChunk) -> AnswerSource | None:
    if chunk.kind == "video" and chunk.video_id is not None:
        video = await db.get(Video, chunk.video_id)
        if video:
            name = video.author.name if video.author else ""
            return VideoSource(
                video_id=video.id, title=video.title, usta_name=name, start_sec=int(chunk.start_sec or 0)
            )
    if chunk.kind == "document" and chunk.document_id is not None:
        doc = await db.get(Document, chunk.document_id)
        if doc:
            return DocumentSource(document_id=doc.id, title=doc.title, page=chunk.page or 1)
    if chunk.kind == "usta_answer" and chunk.question_id is not None:
        q = await db.get(Question, chunk.question_id)
        if q and q.answered_by and q.answered_at:
            return UstaAnswerSource(question_id=q.id, usta_name=q.answered_by.name, answered_at=q.answered_at)
    return None


async def ask(ctx: AppContext, db: AsyncSession, machine: Machine, question: str, language: str) -> Answered | NotFound:
    not_found = NotFound(ustas=[person(u) for u in machine.ustas])
    try:
        query = (await ctx.ai.embed([question], "query"))[0]
        hits = await nearest(db, machine.id, query, ctx.settings.ask_min_score)
        if not hits:
            return not_found
        draft = await ctx.ai.answer(question, language, [chunk.text for chunk, _ in hits])
    except AIUnavailableError as e:
        log.warning("ask machine %s: %s", machine.id, e)
        return not_found
    used = [hits[i - 1][0] for i in dict.fromkeys(draft.source_ids) if 1 <= i <= len(hits)]
    if not draft.found or not draft.answer.strip() or not used:
        return not_found  # an answer that cites none of the given sources is not trusted
    sources = [s for chunk in used if (s := await _source(db, chunk)) is not None]
    if not sources:
        return not_found
    return Answered(answer=localized(draft.answer.strip(), language), sources=sources)
