"""Job status: GET for one look, a WebSocket that pushes progress until the job finishes."""

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.auth import service as auth_service
from app.auth.deps import SESSION_COOKIE, CurrentUser
from app.deps import SessionDep, not_found
from app.jobs.models import Job, JobStatus

router = APIRouter(tags=["jobs"])


class JobOut(BaseModel):
    id: int
    kind: str
    status: JobStatus
    progress: int
    step: str | None
    error: str | None


def job_out(job: Job) -> JobOut:
    return JobOut(id=job.id, kind=job.kind, status=job.status, progress=job.progress, step=job.step, error=job.error)


@router.get("/jobs/{job_id}", response_model=JobOut)
async def get_job(job_id: int, _: CurrentUser, db: SessionDep) -> JobOut:
    job = await db.get(Job, job_id)
    if job is None:
        raise not_found("İş")
    return job_out(job)


@router.websocket("/ws/jobs/{job_id}")
async def job_socket(websocket: WebSocket, job_id: int) -> None:
    """Sends the job's state whenever it changes (checked every second) and closes when it is done or failed."""
    ctx = websocket.app.state.ctx
    token = websocket.cookies.get(SESSION_COOKIE)
    async with ctx.sessionmaker() as db:
        user = await auth_service.user_for_token(db, token) if token else None
    if user is None:
        await websocket.close(code=4401)
        return
    await websocket.accept()
    last: JobOut | None = None
    try:
        while True:
            async with ctx.sessionmaker() as db:
                job = await db.get(Job, job_id)
            if job is None:
                await websocket.close(code=4404)
                return
            state = job_out(job)
            if state != last:
                await websocket.send_json(state.model_dump(mode="json"))
                last = state
            if state.status in (JobStatus.done, JobStatus.failed):
                await websocket.close()
                return
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return
