import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.admin import views as admin_views
from app.admin.router import router as admin_router
from app.ai import factory
from app.ai.interfaces import AIServices
from app.alerts.hub import AlertHub
from app.alerts.router import router as alerts_router
from app.ask.router import router as ask_router
from app.auth.router import me_router
from app.auth.router import router as auth_router
from app.config import get_settings
from app.context import AppContext
from app.db import make_engine, make_sessionmaker
from app.documents.router import router as documents_router
from app.health.router import router as health_router
from app.jobs.queue import JobQueue
from app.jobs.registry import register_jobs
from app.jobs.router import router as jobs_router
from app.machines.router import router as machines_router
from app.maintenance.router import router as maintenance_router
from app.questions.router import router as questions_router
from app.search.jobs import REEMBED_JOB
from app.search.models import Chunk
from app.translations.router import router as translations_router
from app.uploads_router import router as uploads_router
from app.videos.router import router as videos_router

log = logging.getLogger(__name__)

API_ROUTERS = (
    health_router, auth_router, me_router, machines_router, videos_router, documents_router, questions_router,
    ask_router, maintenance_router, alerts_router, admin_router, jobs_router, translations_router,
)  # fmt: skip


async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    """422 as {detail: "<Turkish message>"}: the frontend's errorMessage() shows `detail` strings as-is."""
    errors = exc.errors()
    cause = errors[0].get("ctx", {}).get("error") if errors else None
    message = str(cause) if isinstance(cause, ValueError) else "Girilen bilgiler geçersiz."
    return JSONResponse(status_code=422, content={"detail": message})


async def startup(ctx: AppContext) -> None:
    """Jobs a restart cut off run again; chunks embedded with another model are re-embedded (texts kept)."""
    await ctx.jobs.requeue_interrupted()
    async with ctx.sessionmaker() as db:
        stale = await db.scalar(
            select(Chunk.id).where(Chunk.embedding_model_version != ctx.ai.embedder.model_version).limit(1)
        )
    if stale is not None:
        await ctx.jobs.enqueue(REEMBED_JOB, {})
    ctx.jobs.start(ctx)
    task = asyncio.create_task(_warm_up(ctx), name="warm-up")
    _background.add(task)
    task.add_done_callback(_background.discard)


_background: set[asyncio.Task[None]] = set()


async def _warm_up(ctx: AppContext) -> None:
    """Load the search models now, so the first "Makineye sor" does not wait ~10 s for them."""
    try:
        await asyncio.to_thread(ctx.ai.embedder.embed_query, "ısınma")
        await asyncio.to_thread(ctx.ai.reranker.score, "ısınma", ["ısınma"])
    except Exception:  # a missing model is reported when it is really needed
        log.exception("model warm-up failed")


def create_app(database_url: str | None = None, ai: AIServices | None = None, background: bool = True) -> FastAPI:
    """database_url / ai override the settings (tests point them at usta_test and fake engines). With background,
    the job worker runs inside this process (tests run jobs with ctx.jobs.drain instead)."""
    settings = get_settings()
    engine = make_engine(database_url or settings.database_url)
    sessionmaker = make_sessionmaker(engine)
    ctx = AppContext(
        settings=settings, sessionmaker=sessionmaker, ai=ai or factory.build(settings), jobs=JobQueue(sessionmaker),
        hub=AlertHub(),
    )  # fmt: skip
    register_jobs(ctx.jobs)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        if background:
            await startup(ctx)
        yield
        await ctx.jobs.stop()
        await engine.dispose()

    app = FastAPI(title="Usta Hafızası", lifespan=lifespan)
    app.state.ctx = ctx
    app.exception_handler(RequestValidationError)(validation_error)
    # API routes live under /api: Vite proxies /api to this server without rewriting the path.
    for router in API_ROUTERS:
        app.include_router(router, prefix="/api")
    app.include_router(uploads_router)
    admin_views.mount(app, ctx, settings.secret_key.get_secret_value())
    return app


app = create_app()
