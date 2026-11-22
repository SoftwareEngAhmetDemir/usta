import logging
from collections.abc import Sequence
from pathlib import Path
from typing import Annotated, Literal

from pydantic import BaseModel, StringConstraints
from sqlalchemy import ColumnElement, and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.interfaces import Translator
from app.auth.models import Role, User
from app.context import AppContext
from app.core import storage
from app.core.languages import lang_name, localized
from app.core.schemas import LocalizedText, PersonRef, UtcDateTime
from app.documents.extract import BY_EXTENSION, SUPPORTED
from app.documents.models import Document, DocumentType, SummaryStatus
from app.documents.service import JOB_KIND as DOCUMENT_JOB
from app.jobs.queue import Payload, Progress
from app.machines.models import Machine
from app.questions.models import Question, QuestionStatus
from app.search.service import ChunkIn, Owner, embed_and_store
from app.translations.service import AUTO_DETECT, Localizer, translate, translate_everywhere

log = logging.getLogger(__name__)

QuestionText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=1000)]


class AskIn(BaseModel):
    question: QuestionText


class QuestionSent(BaseModel):
    id: int
    status: Literal["open"]
    recipients: list[PersonRef]


class AnswerSent(BaseModel):
    id: int
    status: Literal["answered"]


class QaEntry(BaseModel):
    id: int
    machine_id: int
    machine_name: str
    question: LocalizedText
    answer: LocalizedText | None
    original_question: LocalizedText | None
    original_answer: LocalizedText | None
    answer_video_id: int | None
    answer_file_url: str | None
    usta: PersonRef
    answered_at: UtcDateTime


class MyQuestion(BaseModel):
    id: int
    machine_id: int
    machine_name: str
    question: LocalizedText
    status: QuestionStatus
    created_at: UtcDateTime
    answer: LocalizedText | None
    answer_video_id: int | None
    answer_file_url: str | None
    usta: PersonRef | None


class InboxQuestion(BaseModel):
    id: int
    machine_id: int
    machine_name: str
    question: LocalizedText
    original_question: LocalizedText | None
    worker_name: str
    worker_language_name: str
    created_at: UtcDateTime


def person(user: User) -> PersonRef:
    return PersonRef(id=user.id, name=user.name)


def _texts(questions: Sequence[Question]) -> list[tuple[str, str]]:
    items = [(q.text, q.language) for q in questions]
    return items + [(q.answer_text, q.answer_language or q.language) for q in questions if q.answer_text]


async def localizer(db: AsyncSession, questions: Sequence[Question], lang: str) -> Localizer:
    return await Localizer.load(db, _texts(questions), lang)


def qa_entry(q: Question, loc: Localizer) -> QaEntry:
    question, original_question = loc.show(q.text, q.language)
    answer, original_answer = (
        loc.show(q.answer_text, q.answer_language or q.language) if q.answer_text else (None, None)
    )
    return QaEntry(
        id=q.id,
        machine_id=q.machine_id,
        machine_name=q.machine.name,
        question=question,
        answer=answer,
        original_question=original_question,
        original_answer=original_answer,
        answer_video_id=q.answer_video_id,
        answer_file_url=storage.url(q.answer_file),
        usta=person(q.answered_by) if q.answered_by else PersonRef(id=0, name=""),
        answered_at=q.answered_at or q.created_at,
    )


def my_question(q: Question, loc: Localizer) -> MyQuestion:
    answer = loc.show(q.answer_text, q.answer_language or q.language)[0] if q.answer_text else None
    return MyQuestion(
        id=q.id,
        machine_id=q.machine_id,
        machine_name=q.machine.name,
        question=loc.show(q.text, q.language)[0],
        status=q.status,
        created_at=q.created_at,
        answer=answer,
        answer_video_id=q.answer_video_id,
        answer_file_url=storage.url(q.answer_file),
        usta=person(q.answered_by) if q.answered_by else None,
    )


def inbox_question(q: Question, loc: Localizer) -> InboxQuestion:
    question, original = loc.show(q.text, q.language)
    return InboxQuestion(
        id=q.id,
        machine_id=q.machine_id,
        machine_name=q.machine.name,
        question=question,
        original_question=original,
        worker_name=q.asked_by.name,
        worker_language_name=lang_name(q.language),
        created_at=q.created_at,
    )


async def inbox_question_in(db: AsyncSession, translator: Translator, q: Question, lang: str) -> InboxQuestion:
    """The question machine-translated into `lang`. Its language is detected, not taken from the asker's profile: a
    Turkish-profile worker may type English."""
    text = (await translate(db, translator, [q.text], AUTO_DETECT, lang))[0]
    same = text.strip() == q.text.strip()
    out = inbox_question(q, Localizer({}, q.language))
    out.question = localized(text, lang)
    out.original_question = None if same else localized(q.text, q.language)
    return out


def answerable_by(user: User) -> ColumnElement[bool]:
    """SQL condition: questions this user should answer (see permissions.can_answer); never their own."""
    not_mine = Question.asked_by_id != user.id
    if user.role == Role.patron:
        return not_mine
    return and_(Machine.ustas.any(User.id == user.id), not_mine)


async def recipients(db: AsyncSession, machine: Machine, asker: User) -> list[User]:
    """Who gets an "Ustaya sor" question: the machine's ustas, else the patrons; never the asker themselves."""
    ustas = [u for u in machine.ustas if u.id != asker.id]
    if ustas:
        return ustas
    return list(await db.scalars(select(User).where(User.role == Role.patron, User.id != asker.id)))


async def answered_on(db: AsyncSession, machine_id: int | None = None, usta_id: int | None = None) -> list[Question]:
    query = select(Question).where(Question.status == QuestionStatus.answered)
    if machine_id is not None:
        query = query.where(Question.machine_id == machine_id)
    if usta_id is not None:
        query = query.where(Question.answered_by_id == usta_id)
    return list(await db.scalars(query.order_by(Question.answered_at.desc(), Question.id.desc())))


async def translate_question(ctx: AppContext, payload: Payload, progress: Progress) -> None:
    """Job "question_translate" {"question_id"}: the question in every language, for ustas reading other languages."""
    async with ctx.sessionmaker() as db:
        q = await db.get(Question, int(payload["question_id"]))
        items = [(q.text, q.language)] if q else []
    await translate_everywhere(ctx, items)


async def translate_all(ctx: AppContext, lang: str) -> None:
    """Every question and answer into `lang` (a user just chose that language)."""
    async with ctx.sessionmaker() as db:
        items = _texts(list(await db.scalars(select(Question))))
    await translate_everywhere(ctx, items, [lang])


async def after_answer(ctx: AppContext, payload: Payload, progress: Progress) -> None:
    """Job "answer_index" {"question_id"}: translate the Q&A into every language and make the answer searchable
    for "Makineye sor": the text as a chunk, an attached document through the document pipeline (an answer video
    already goes through the video pipeline)."""
    async with ctx.sessionmaker() as db:
        q = await db.get(Question, int(payload["question_id"]))
        if q is None:
            return
        items = _texts([q])
        question_id, machine_id, question_text, answer_text = q.id, q.machine_id, q.text, q.answer_text
        language, answer_file, usta_id = q.answer_language or q.language, q.answer_file, q.answered_by_id
        title = f"Usta cevabı: {q.text[:180]}"
    await translate_everywhere(ctx, items)
    async with ctx.sessionmaker() as db:
        if answer_text:
            chunk = ChunkIn(text=f"{question_text}\n{answer_text}", language=language, title=title)
            await embed_and_store(db, ctx.ai, machine_id, Owner(question_id=question_id), [chunk])
        mime = BY_EXTENSION.get(Path(answer_file).suffix.lower()) if answer_file else None
        if answer_file and mime in SUPPORTED:
            doc = Document(
                machine_id=machine_id, title=title, type=DocumentType.technical_info, file=answer_file,
                file_name=Path(answer_file).name, mime_type=mime, language=language, uploaded_by_id=usta_id,
                summary_status=SummaryStatus.preparing,
            )  # fmt: skip
            db.add(doc)
            await db.commit()
            await ctx.jobs.enqueue(DOCUMENT_JOB, {"document_id": doc.id})
