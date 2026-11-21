from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select

from app.alerts.service import notify
from app.auth.deps import CurrentUser
from app.auth.models import Role, User
from app.core import storage
from app.core.schemas import utcnow
from app.deps import CtxDep, SessionDep, not_found
from app.machines.models import Machine
from app.machines.permissions import can_answer
from app.questions import service
from app.questions.models import Question, QuestionStatus
from app.questions.service import AnswerSent, AskIn, InboxQuestion, MyQuestion, QaEntry, QuestionSent, person
from app.translations.service import translate_everywhere
from app.videos.router import create_video

router = APIRouter(tags=["questions"])


@router.post("/machines/{machine_id}/questions", response_model=QuestionSent)
async def ask_usta(machine_id: int, body: AskIn, user: CurrentUser, db: SessionDep, ctx: CtxDep) -> QuestionSent:
    """ "Ustaya sor" (KAN-62): save the question and alert the machine's ustas (the patron if it has none)."""
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    q = Question(machine_id=machine.id, asked_by_id=user.id, text=body.question, language=user.language)
    db.add(q)
    await db.commit()
    recipients = machine.ustas or list(await db.scalars(select(User).where(User.role == Role.patron)))
    preview = body.question if len(body.question) <= 80 else body.question[:77] + "…"
    await notify(
        db, ctx.hub, [u.id for u in recipients], f"Yeni soru · {machine.name}: “{preview}”", f"/usta/questions/{q.id}"
    )
    ctx.jobs.spawn(translate_everywhere(ctx, [(q.text, q.language)]), name=f"question-{q.id}-translate")
    return QuestionSent(id=q.id, status="open", recipients=[person(u) for u in recipients])


@router.get("/me/questions", response_model=list[MyQuestion])
async def my_questions(user: CurrentUser, db: SessionDep) -> list[MyQuestion]:
    rows = list(
        await db.scalars(
            select(Question)
            .where(Question.asked_by_id == user.id)
            .order_by(Question.created_at.desc(), Question.id.desc())
        )
    )
    loc = await service.localizer(db, rows, user.language)
    return [service.my_question(q, loc) for q in rows]


@router.get("/me/inbox", response_model=list[InboxQuestion])
async def inbox(user: CurrentUser, db: SessionDep) -> list[InboxQuestion]:
    """Open questions on the machines this usta knows (KAN-63)."""
    rows = list(
        await db.scalars(
            select(Question)
            .join(Machine)
            .where(Question.status == QuestionStatus.open, service.answerable_by(user))
            .order_by(Question.created_at.desc(), Question.id.desc())
        )
    )
    loc = await service.localizer(db, rows, user.language)
    return [service.inbox_question(q, loc) for q in rows]


async def _open_question(db: SessionDep, question_id: int, user: User) -> Question:
    q = await db.get(Question, question_id)
    if q is None or q.status != QuestionStatus.open or not can_answer(user, q.machine):
        raise not_found("Soru")
    return q


@router.get("/questions/{question_id}", response_model=InboxQuestion)
async def get_question(question_id: int, user: CurrentUser, db: SessionDep) -> InboxQuestion:
    q = await _open_question(db, question_id, user)
    return service.inbox_question(q, await service.localizer(db, [q], user.language))


@router.post("/questions/{question_id}/answer", response_model=AnswerSent)
async def answer(
    question_id: int,
    user: CurrentUser,
    db: SessionDep,
    ctx: CtxDep,
    text: Annotated[str | None, Form(max_length=5000)] = None,
    video: Annotated[UploadFile | None, File()] = None,
    file: Annotated[UploadFile | None, File()] = None,
) -> AnswerSent:
    """KAN-63: answer with text, a video (goes through the video pipeline) and/or a file."""
    q = await _open_question(db, question_id, user)
    text = (text or "").strip()
    has_video, has_file = storage.has_content(video), storage.has_content(file)
    if not (text or has_video or has_file):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Bir cevap yazın veya video/dosya ekleyin.")
    if video is not None and has_video:
        title = f"Cevap: {q.text[:180]}"
        q.answer_video_id = (await create_video(ctx, db, q.machine, user, title, video)).id
    if file is not None and has_file:
        q.answer_file = storage.save_upload(file, f"answers/{q.id}")
    q.answer_text = text or None
    q.answer_language = user.language
    q.answered_by_id = user.id
    q.answered_at = utcnow()
    q.status = QuestionStatus.answered
    await db.commit()
    preview = q.text if len(q.text) <= 80 else q.text[:77] + "…"
    await notify(db, ctx.hub, [q.asked_by_id], f"{user.name} sorunu cevapladı: “{preview}”", "/my-questions")
    ctx.jobs.spawn(service.after_answer(ctx, q.id), name=f"question-{q.id}-answered")
    return AnswerSent(id=q.id, status="answered")


class MachineRef(BaseModel):
    id: int
    code: str
    name: str


class UstaProfile(BaseModel):
    id: int
    name: str
    machines: list[MachineRef]
    answered: list[QaEntry]


@router.get("/ustas/{usta_id}", response_model=UstaProfile)
async def usta_profile(usta_id: int, user: CurrentUser, db: SessionDep) -> UstaProfile:
    """KAN-65: an usta's machines and the questions they answered."""
    usta = await db.get(User, usta_id)
    if usta is None or usta.role != Role.usta:
        raise not_found("Usta")
    machines = await db.scalars(select(Machine).where(Machine.ustas.any(User.id == usta.id)).order_by(Machine.name))
    answered = await service.answered_on(db, usta_id=usta.id)
    loc = await service.localizer(db, answered, user.language)
    return UstaProfile(
        id=usta.id,
        name=usta.name,
        machines=[MachineRef(id=m.id, code=m.code, name=m.name) for m in machines],
        answered=[service.qa_entry(q, loc) for q in answered],
    )
