"""Background jobs with the MySQL `jobs` table as the queue (no Redis/Celery). One worker loop claims the oldest
queued job (FOR UPDATE SKIP LOCKED), runs its handler, and records progress/errors on the row.

The loop runs inside the API process: ChromaDB's persistent mode and the live-alert WebSocket hub are
single-process, so a second process writing vectors would corrupt the API's view of them (checked 2026-11-22).
Heavy work (Whisper, embeddings, OCR, ffmpeg) runs in threads/subprocesses, so the API stays responsive."""

import asyncio
import contextlib
import logging
from collections.abc import Awaitable, Callable
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.schemas import utcnow
from app.jobs.models import Job, JobStatus

if TYPE_CHECKING:
    from app.context import AppContext

log = logging.getLogger(__name__)

Payload = dict[str, str | int]
Progress = Callable[[int, str], Awaitable[None]]  # (percent 0-100, Turkish step label)
Handler = Callable[["AppContext", Payload, Progress], Awaitable[None]]


class JobFailedError(Exception):
    """A handler's expected failure: the message (Turkish) is stored on the job for the user."""


class JobQueue:
    def __init__(self, sessionmaker: async_sessionmaker[AsyncSession]) -> None:
        self._sessionmaker = sessionmaker
        self._handlers: dict[str, Handler] = {}
        self._wake = asyncio.Event()
        self._task: asyncio.Task[None] | None = None

    def register(self, kind: str, handler: Handler) -> None:
        self._handlers[kind] = handler

    async def enqueue(self, kind: str, payload: Payload) -> int:
        if kind not in self._handlers:
            raise KeyError(f"unknown job kind {kind}")
        async with self._sessionmaker() as db:
            job = Job(kind=kind, payload=payload)
            db.add(job)
            await db.commit()
            job_id = job.id
        self._wake.set()
        return job_id

    async def _claim(self) -> Job | None:
        async with self._sessionmaker() as db:
            job = await db.scalar(
                select(Job)
                .where(Job.status == JobStatus.queued)
                .order_by(Job.id)
                .limit(1)
                .with_for_update(skip_locked=True)
            )
            if job is None:
                return None
            job.status, job.started_at, job.attempts = JobStatus.processing, utcnow(), job.attempts + 1
            await db.commit()
            return job

    async def _update(self, job_id: int, **values: str | int | datetime | JobStatus | None) -> None:
        async with self._sessionmaker() as db:
            await db.execute(update(Job).where(Job.id == job_id).values(**values))
            await db.commit()

    async def run_one(self, ctx: "AppContext") -> bool:
        """Run the oldest queued job; False when the queue is empty."""
        job = await self._claim()
        if job is None:
            return False

        async def progress(percent: int, step: str) -> None:
            await self._update(job.id, progress=max(0, min(percent, 100)), step=step[:100])

        try:
            await self._handlers[job.kind](ctx, job.payload, progress)
        except Exception as e:
            known = isinstance(e, JobFailedError)
            if not known:
                log.exception("job %s (%s) crashed", job.id, job.kind)
            message = str(e)[:500] if known else "Beklenmeyen bir hata oluştu."
            await self._update(job.id, status=JobStatus.failed, error=message, finished_at=utcnow())
            return True
        await self._update(job.id, status=JobStatus.done, progress=100, finished_at=utcnow())
        return True

    async def drain(self, ctx: "AppContext") -> None:
        """Run queued jobs until none is left, including jobs enqueued by jobs (tests, scripts)."""
        while await self.run_one(ctx):
            pass

    async def requeue_interrupted(self) -> None:
        """At startup: jobs a crash or restart cut off run again."""
        async with self._sessionmaker() as db:
            await db.execute(update(Job).where(Job.status == JobStatus.processing).values(status=JobStatus.queued))
            await db.commit()

    def start(self, ctx: "AppContext") -> None:
        self._task = asyncio.create_task(self._loop(ctx), name="job-worker")

    async def _loop(self, ctx: "AppContext") -> None:
        while True:
            try:
                ran = await self.run_one(ctx)
            except Exception:  # the database went away for a moment: keep the worker alive
                log.exception("job worker error")
                ran = False
            if not ran:
                self._wake.clear()
                with contextlib.suppress(TimeoutError):
                    await asyncio.wait_for(self._wake.wait(), timeout=5)

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
            self._task = None
