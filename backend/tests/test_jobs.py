import pytest

from app.context import AppContext
from app.jobs.models import Job, JobStatus
from app.jobs.queue import JobFailedError, Payload, Progress


async def test_jobs_run_in_order_record_progress_and_failures(ctx: AppContext) -> None:
    seen: list[int] = []

    async def ok(_: AppContext, payload: Payload, progress: Progress) -> None:
        await progress(50, "Yarısı")
        seen.append(int(payload["n"]))

    async def known(_: AppContext, payload: Payload, progress: Progress) -> None:
        raise JobFailedError("Video okunamadı.")

    async def crash(_: AppContext, payload: Payload, progress: Progress) -> None:
        raise RuntimeError("secret internals")

    ctx.jobs.register("ok", ok)
    ctx.jobs.register("known", known)
    ctx.jobs.register("crash", crash)
    ids = [await ctx.jobs.enqueue("ok", {"n": 1}), await ctx.jobs.enqueue("known", {}),
           await ctx.jobs.enqueue("crash", {}), await ctx.jobs.enqueue("ok", {"n": 2})]  # fmt: skip
    await ctx.jobs.drain(ctx)
    assert seen == [1, 2]
    async with ctx.sessionmaker() as db:
        jobs = [await db.get(Job, i) for i in ids]
    assert [(j.status, j.progress, j.error) for j in jobs if j] == [
        (JobStatus.done, 100, None),
        (JobStatus.failed, 0, "Video okunamadı."),
        (JobStatus.failed, 0, "Beklenmeyen bir hata oluştu."),  # internals are not shown to users
        (JobStatus.done, 100, None),
    ]
    with pytest.raises(KeyError):
        await ctx.jobs.enqueue("unknown", {})
