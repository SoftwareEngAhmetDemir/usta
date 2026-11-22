import logging
from collections.abc import Sequence
from typing import Annotated, Literal

from pydantic import BaseModel, StringConstraints
from sqlalchemy import ColumnElement, select, true
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.protocol import AIUnavailableError
from app.auth.models import Role, User
from app.context import AppContext
from app.core import storage
from app.core.languages import lang_name
from app.core.schemas import LocalizedText, PersonRef, UtcDateTime
from app.machines.models import Machine
from app.questions.models import Question, QuestionStatus
from app.search.service import ChunkIn, replace_chunks
from app.translations.service import Localizer, translate_everywhere

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


def answerable_by(user: User) -> ColumnElement[bool]:
    """SQL condition: questions this user should answer (see permissions.can_answer)."""
    if user.role == Role.patron:
        return true()
    return Machine.ustas.any(User.id == user.id)


async def answered_on(db: AsyncSession, machine_id: int | None = None, usta_id: int | None = None) -> list[Question]:
    query = select(Question).where(Question.status == QuestionStatus.answered)
    if machine_id is not None:
        query = query.where(Question.machine_id == machine_id)
    if usta_id is not None:
        query = query.where(Question.answered_by_id == usta_id)
    return list(await db.scalars(query.order_by(Question.answered_at.desc(), Question.id.desc())))


async def after_answer(ctx: AppContext, question_id: int) -> None:
    """Job: translate the Q&A into every language and index the answer for "Makineye sor"."""
    async with ctx.sessionmaker() as db:
        q = await db.get(Question, question_id)
        if q is None:
            return
        items = _texts([q])
        question_text, answer_text = q.text, q.answer_text
        machine_id = q.machine_id
    await translate_everywhere(ctx, items)
    if answer_text:
        async with ctx.sessionmaker() as db:
            try:
                chunk = ChunkIn(text=f"{question_text}\n{answer_text}")
                await replace_chunks(db, ctx.ai, machine_id, "usta_answer", [chunk], question_id=question_id)
            except AIUnavailableError as e:  # the answer is saved; it is just not searchable yet
                log.warning("answer %s not indexed: %s", question_id, e)
