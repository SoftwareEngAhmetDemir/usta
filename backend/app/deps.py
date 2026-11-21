from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.context import AppContext


def get_ctx(request: Request) -> AppContext:
    ctx: AppContext = request.app.state.ctx
    return ctx


CtxDep = Annotated[AppContext, Depends(get_ctx)]


async def get_session(ctx: CtxDep) -> AsyncIterator[AsyncSession]:
    async with ctx.sessionmaker() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]


def not_found(what: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, f"{what} bulunamadı.")


def forbidden() -> HTTPException:
    return HTTPException(status.HTTP_403_FORBIDDEN, "Bu işlem için yetkiniz yok.")
