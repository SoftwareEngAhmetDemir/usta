from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.deps import SessionDep

router = APIRouter(tags=["health"])


class Health(BaseModel):
    status: Literal["ok"]


@router.get("/health", response_model=Health)
async def health(session: SessionDep) -> Health:
    """Liveness + DB check; Playwright's webServer waits on this URL."""
    await session.execute(text("SELECT 1"))
    return Health(status="ok")
