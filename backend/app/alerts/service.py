from collections.abc import Iterable

from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.alerts.hub import AlertHub
from app.alerts.models import Alert
from app.core.schemas import UtcDateTime


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    created_at: UtcDateTime
    read: bool
    path: str


class AlertList(BaseModel):
    unread_count: int
    items: list[AlertOut]


async def notify(db: AsyncSession, hub: AlertHub, user_ids: Iterable[int], text: str, path: str) -> None:
    """Store an alert for each user and push it to their open WebSockets."""
    alerts = [Alert(user_id=uid, text=text[:500], path=path) for uid in dict.fromkeys(user_ids)]
    if not alerts:
        return
    db.add_all(alerts)
    await db.commit()
    for alert in alerts:
        await hub.push(alert.user_id, AlertOut.model_validate(alert))


async def alert_list(db: AsyncSession, user_id: int, limit: int = 50) -> AlertList:
    rows = await db.scalars(
        select(Alert).where(Alert.user_id == user_id).order_by(Alert.created_at.desc(), Alert.id.desc()).limit(limit)
    )
    unread = await db.scalar(select(func.count()).where(Alert.user_id == user_id, Alert.read.is_(False)))
    return AlertList(unread_count=unread or 0, items=[AlertOut.model_validate(a) for a in rows])
