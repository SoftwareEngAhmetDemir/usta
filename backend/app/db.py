from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Parent of every table model (app/<feature>/models.py). Alembic autogenerates from Base.metadata."""


def make_engine(url: str) -> AsyncEngine:
    # pool_pre_ping: MySQL drops idle connections after wait_timeout.
    return create_async_engine(url, pool_pre_ping=True)


def make_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)
