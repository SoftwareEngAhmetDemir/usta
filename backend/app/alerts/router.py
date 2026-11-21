from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import update

from app.alerts.models import Alert
from app.alerts.service import AlertList, alert_list
from app.auth import service as auth_service
from app.auth.deps import SESSION_COOKIE, CurrentUser
from app.context import AppContext
from app.deps import SessionDep

router = APIRouter(tags=["alerts"])


@router.get("/alerts", response_model=AlertList)
async def list_alerts(user: CurrentUser, db: SessionDep) -> AlertList:
    return await alert_list(db, user.id)


@router.post("/alerts/{alert_id}/read", response_model=AlertList)
async def mark_read(alert_id: int, user: CurrentUser, db: SessionDep) -> AlertList:
    await db.execute(update(Alert).where(Alert.id == alert_id, Alert.user_id == user.id).values(read=True))
    await db.commit()
    return await alert_list(db, user.id)


@router.websocket("/ws/alerts")
async def alerts_socket(ws: WebSocket) -> None:
    """Pushes each new Alert as JSON. Authenticated with the same session cookie as the API."""
    ctx: AppContext = ws.app.state.ctx
    token = ws.cookies.get(SESSION_COOKIE)
    async with ctx.sessionmaker() as db:
        user = await auth_service.user_for_token(db, token) if token else None
    if user is None:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    await ws.accept()
    ctx.hub.add(user.id, ws)
    try:
        while True:
            await ws.receive_text()  # the client sends nothing; this just waits for the disconnect
    except WebSocketDisconnect:
        pass
    finally:
        ctx.hub.remove(user.id, ws)
