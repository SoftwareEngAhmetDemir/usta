from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.ai.protocol import AI
from app.alerts.hub import AlertHub
from app.config import Settings
from app.core.jobs import JobRunner


@dataclass
class AppContext:
    """Long-lived services, built once in create_app and reached through deps.CtxDep (or passed to jobs)."""

    settings: Settings
    sessionmaker: async_sessionmaker[AsyncSession]
    ai: AI
    jobs: JobRunner
    hub: AlertHub
