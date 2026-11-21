from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.admin import views as admin_views
from app.admin.router import router as admin_router
from app.ai.gemini import GeminiAI
from app.ai.protocol import AI, DisabledAI
from app.alerts.hub import AlertHub
from app.alerts.router import router as alerts_router
from app.ask.router import router as ask_router
from app.auth.router import me_router
from app.auth.router import router as auth_router
from app.config import Settings, get_settings
from app.context import AppContext
from app.core.jobs import JobRunner
from app.db import make_engine, make_sessionmaker
from app.documents import service as documents_service
from app.documents.models import Document, SummaryStatus
from app.documents.router import router as documents_router
from app.health.router import router as health_router
from app.machines.router import router as machines_router
from app.maintenance.router import router as maintenance_router
from app.questions.router import router as questions_router
from app.uploads_router import router as uploads_router
from app.videos import pipeline
from app.videos.router import router as videos_router

API_ROUTERS = (
    health_router, auth_router, me_router, machines_router, videos_router, documents_router, questions_router,
    ask_router, maintenance_router, alerts_router, admin_router,
)  # fmt: skip


async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    """422 as {detail: "<Turkish message>"}: the frontend's errorMessage() shows `detail` strings as-is."""
    errors = exc.errors()
    cause = errors[0].get("ctx", {}).get("error") if errors else None
    message = str(cause) if isinstance(cause, ValueError) else "Girilen bilgiler geçersiz."
    return JSONResponse(status_code=422, content={"detail": message})


def default_ai(settings: Settings) -> AI:
    return GeminiAI(settings) if settings.gemini_api_key else DisabledAI()


async def resume(ctx: AppContext) -> None:
    """Restart background work a previous run left unfinished (videos, document summaries)."""
    await pipeline.resume_unfinished(ctx)
    async with ctx.sessionmaker() as db:
        pending = list(await db.scalars(select(Document.id).where(Document.summary_status == SummaryStatus.preparing)))
    for doc_id in pending:
        ctx.jobs.spawn(documents_service.process(ctx, doc_id), name=f"document-{doc_id}")


def create_app(database_url: str | None = None, ai: AI | None = None, resume_jobs: bool = True) -> FastAPI:
    """database_url / ai override the settings (tests point them at usta_test and a fake AI)."""
    settings = get_settings()
    engine = make_engine(database_url or settings.database_url)
    ctx = AppContext(
        settings=settings,
        sessionmaker=make_sessionmaker(engine),
        ai=ai or default_ai(settings),
        jobs=JobRunner(),
        hub=AlertHub(),
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        if resume_jobs:
            await resume(ctx)
        yield
        await engine.dispose()

    app = FastAPI(title="Usta Hafızası", lifespan=lifespan)
    app.state.ctx = ctx
    app.exception_handler(RequestValidationError)(validation_error)
    # API routes live under /api: Vite proxies /api to this server without rewriting the path.
    for router in API_ROUTERS:
        app.include_router(router, prefix="/api")
    app.include_router(uploads_router)
    admin_views.mount(app, ctx.sessionmaker, settings.secret_key.get_secret_value())
    return app


app = create_app()
