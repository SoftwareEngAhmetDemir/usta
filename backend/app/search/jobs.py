from app.context import AppContext
from app.jobs.queue import Payload, Progress
from app.search.service import reembed_stale

REEMBED_JOB = "reembed"


async def reembed_job(ctx: AppContext, payload: Payload, progress: Progress) -> None:
    """Job "reembed": re-embed chunks made with a different embedding model (after EMBEDDING_MODEL changed)."""
    await progress(0, "Arama dizini yeniden hesaplanıyor")
    async with ctx.sessionmaker() as db:
        await reembed_stale(db, ctx.ai)
