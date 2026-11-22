from fastapi import APIRouter

from app.ask.service import AskResult, ask
from app.auth.deps import CurrentUser
from app.deps import CtxDep, SessionDep, not_found
from app.machines.models import Machine
from app.questions.service import AskIn

router = APIRouter(tags=["ask"])


@router.post("/machines/{machine_id}/ask", response_model=AskResult)
async def ask_machine(machine_id: int, body: AskIn, user: CurrentUser, db: SessionDep, ctx: CtxDep) -> AskResult:
    machine = await db.get(Machine, machine_id)
    if machine is None:
        raise not_found("Makine")
    return await ask(ctx, db, machine, body.question, user)
