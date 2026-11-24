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


def public_url(request: Request, ctx: CtxDep) -> str:
    """PUBLIC_URL, else the address the browser used: Vite's proxy passes X-Forwarded-Host/-Proto (first entry =
    the outermost hop, e.g. the VS Code tunnel), so QR stickers printed from the forwarded URL open on a phone."""
    if ctx.settings.public_url:
        return ctx.settings.public_url

    def first(name: str) -> str:
        return request.headers.get(name, "").split(",")[0].strip()

    host = first("x-forwarded-host") or request.headers.get("host", "")
    return f"{first('x-forwarded-proto') or request.url.scheme}://{host}"


PublicUrl = Annotated[str, Depends(public_url)]


def not_found(what: str) -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, f"{what} bulunamadı.")


def forbidden() -> HTTPException:
    return HTTPException(status.HTTP_403_FORBIDDEN, "Bu işlem için yetkiniz yok.")
