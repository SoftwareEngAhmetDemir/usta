from collections import defaultdict

from fastapi import WebSocket
from pydantic import BaseModel


class AlertHub:
    """Open alert WebSockets per user, in this process. shortcut: single server process only; a second
    uvicorn worker would need a shared channel (not wanted: CLAUDE.md, no caching layer)."""

    def __init__(self) -> None:
        self._sockets: defaultdict[int, set[WebSocket]] = defaultdict(set)

    def add(self, user_id: int, ws: WebSocket) -> None:
        self._sockets[user_id].add(ws)

    def remove(self, user_id: int, ws: WebSocket) -> None:
        self._sockets[user_id].discard(ws)

    async def push(self, user_id: int, message: BaseModel) -> None:
        for ws in list(self._sockets[user_id]):
            try:
                await ws.send_text(message.model_dump_json())
            except (RuntimeError, OSError):  # closed under us
                self.remove(user_id, ws)
