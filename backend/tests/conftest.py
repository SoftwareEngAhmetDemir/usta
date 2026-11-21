import os
import subprocess
import tempfile
from collections.abc import AsyncIterator, Awaitable, Callable
from pathlib import Path

# Before app imports: uploads go to a throwaway folder, never ../uploads.
os.environ["UPLOADS_DIR"] = tempfile.mkdtemp(prefix="usta-test-uploads-")

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service as auth_service
from app.auth.deps import SESSION_COOKIE
from app.auth.models import Role, User
from app.config import BACKEND_DIR, get_settings
from app.context import AppContext
from app.db import Base, make_engine, make_sessionmaker
from app.machines.models import Machine
from app.main import create_app
from tests.fakes import FakeAI


@pytest.fixture(scope="session", autouse=True)
def migrated_test_db() -> None:
    """Bring usta_test to the latest migration once per run, so tests also prove the migrations apply."""
    cfg = Config(BACKEND_DIR / "alembic.ini")
    cfg.attributes["url"] = get_settings().test_database_url
    cfg.attributes["configure_logger"] = False  # keep pytest's log capture
    command.upgrade(cfg, "head")


async def _empty_tables() -> None:
    engine = make_engine(get_settings().test_database_url)
    async with engine.begin() as conn:
        await conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        for table in Base.metadata.sorted_tables:
            await conn.execute(text(f"DELETE FROM `{table.name}`"))  # noqa: S608  # names come from our own models
        await conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
    await engine.dispose()


@pytest.fixture(autouse=True)
async def clean_tables() -> AsyncIterator[None]:
    """Every test starts with empty tables."""
    yield
    await _empty_tables()


@pytest.fixture
async def db() -> AsyncIterator[AsyncSession]:
    engine = make_engine(get_settings().test_database_url)
    async with make_sessionmaker(engine)() as session:
        yield session
    await engine.dispose()


@pytest.fixture
def ai() -> FakeAI:
    return FakeAI()


@pytest.fixture
async def app(ai: FakeAI) -> AsyncIterator[FastAPI]:
    app = create_app(database_url=get_settings().test_database_url, ai=ai, resume_jobs=False)
    async with app.router.lifespan_context(app):
        yield app
        await ctx_of(app).jobs.drain()


def ctx_of(app: FastAPI) -> AppContext:
    ctx: AppContext = app.state.ctx
    return ctx


@pytest.fixture
def ctx(app: FastAPI) -> AppContext:
    return ctx_of(app)


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


ClientAs = Callable[[User], Awaitable[AsyncClient]]


@pytest.fixture
async def client_as(app: FastAPI, db: AsyncSession) -> AsyncIterator[ClientAs]:
    """A logged-in client per user: `worker = await client_as(user)`."""
    opened: list[AsyncClient] = []

    async def make(user: User) -> AsyncClient:
        c = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
        c.cookies.set(SESSION_COOKIE, await auth_service.start_session(db, user))
        opened.append(c)
        return c

    yield make
    for c in opened:
        await c.aclose()


@pytest.fixture
async def make_user(db: AsyncSession) -> Callable[..., Awaitable[User]]:
    counter = iter(range(1, 10_000))

    async def make(role: Role = Role.worker, name: str | None = None, language: str = "tr") -> User:
        n = next(counter)
        user = await auth_service.create_user(
            db, name=name or f"{role.value} {n}", login=f"0532000{n:04d}", password="gizli-sifre", role=role
        )
        user.language = language
        await db.commit()
        return user

    return make


@pytest.fixture
async def make_machine(db: AsyncSession) -> Callable[..., Awaitable[Machine]]:
    counter = iter(range(1, 10_000))

    async def make(ustas: list[User] | None = None, name: str = "Plazma Kesim Makinesi") -> Machine:
        n = next(counter)
        machine = Machine(code=f"PK-{n:03d}", name=name, type="Plazma kesim", model="PK-105", serial=f"S{n}",
                          location="Atölye A")  # fmt: skip
        machine.ustas = list(ustas or [])
        db.add(machine)
        await db.commit()
        return machine

    return make


@pytest.fixture(scope="session")
def sample_video() -> Path:
    """A 3-second MP4 with a tone, made once with ffmpeg."""
    path = Path(tempfile.mkdtemp(prefix="usta-test-media-")) / "clip.mp4"
    subprocess.run(  # noqa: S603
        ["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=size=320x240:rate=15:duration=3",  # noqa: S607
         "-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-shortest", "-c:v", "libx264", "-c:a", "aac",
         str(path)],
        check=True,
    )  # fmt: skip
    return path
