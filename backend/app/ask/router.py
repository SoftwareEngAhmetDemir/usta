from typing import Literal

from fastapi import APIRouter, status
from pydantic import BaseModel

from app.ask.models import AskLog
from app.ask.service import AskResult, answer_question
from app.auth.deps import CurrentUser
from app.core.schemas import utcnow
from app.deps import CtxDep, SessionDep, not_found
from app.machines.models import Machine
from app.questions.service import AskIn

router = APIRouter(tags=["ask"])


class FeedbackIn(BaseModel):
    feedback: Literal["helpful", "not_helpful"]


@router.post("/machines/{machine_id}/ask", response_model=AskResult)
async def ask_machine(machine_id: int, body: AskIn, user: CurrentUser, db: SessionDep, ctx: CtxDep) -> AskResult:
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    return await answer_question(ctx, db, machine, body.question, user)


@router.post("/ask/{ask_id}/feedback", status_code=status.HTTP_204_NO_CONTENT)
async def ask_feedback(ask_id: int, body: FeedbackIn, user: CurrentUser, db: SessionDep) -> None:
    """The worker rates an answer (helpful / not helpful), for evaluating retrieval later."""
    entry = await db.get(AskLog, ask_id)
    if entry is None or entry.user_id != user.id:
        raise not_found("Soru")
    entry.feedback, entry.feedback_at = body.feedback, utcnow()
    await db.commit()
