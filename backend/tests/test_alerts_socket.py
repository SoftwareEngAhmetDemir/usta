"""Live alerts over the WebSocket (KAN-66). Sync TestClient: httpx has no WebSocket client."""

import pytest
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.auth import service as auth_service
from app.auth.deps import SESSION_COOKIE
from app.auth.models import Role
from app.config import get_settings
from app.context import AppContext
from app.machines.models import Machine
from app.main import create_app
from tests.fakes import FakeAI


async def _setup(ctx: AppContext) -> tuple[str, str, int]:
    async with ctx.sessionmaker() as db:
        usta = await auth_service.create_user(
            db, name="Usta", login="05321110001", password="gizli-sifre", role=Role.usta
        )
        worker = await auth_service.create_user(db, name="İşçi", login="05321110002", password="gizli-sifre")
        machine = Machine(code="WS-1", name="Pres", ustas=[usta])
        db.add(machine)
        await db.commit()
        return await auth_service.start_session(db, usta), await auth_service.start_session(db, worker), machine.id


def test_new_question_is_pushed_to_the_usta_live() -> None:
    app = create_app(database_url=get_settings().test_database_url, ai=FakeAI(), resume_jobs=False)
    with TestClient(app) as tc:
        portal = tc.portal
        assert portal is not None
        usta_token, worker_token, machine_id = portal.call(_setup, app.state.ctx)
        with tc.websocket_connect("/api/ws/alerts", headers={"cookie": f"{SESSION_COOKIE}={usta_token}"}) as ws:
            tc.cookies.set(SESSION_COOKIE, worker_token)
            res = tc.post(f"/api/machines/{machine_id}/questions", json={"question": "Pres neden durdu?"})
            assert res.status_code == 200
            alert = ws.receive_json()
            assert alert["path"] == f"/usta/questions/{res.json()['id']}"
            assert alert["read"] is False and "Pres neden durdu?" in alert["text"]
        portal.call(app.state.ctx.jobs.drain)


def test_socket_without_session_is_refused() -> None:
    app = create_app(database_url=get_settings().test_database_url, ai=FakeAI(), resume_jobs=False)
    with TestClient(app) as tc, pytest.raises(WebSocketDisconnect) as closed, tc.websocket_connect("/api/ws/alerts"):
        pass
    assert closed.value.code == 1008
