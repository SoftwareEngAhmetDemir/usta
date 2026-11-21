"""In-process background work (video pipelines, summaries, translations). No queue server: see CLAUDE.md."""

import asyncio
import logging
from collections.abc import Coroutine

log = logging.getLogger(__name__)


class JobRunner:
    def __init__(self) -> None:
        self._tasks: set[asyncio.Task[None]] = set()

    def spawn(self, job: Coroutine[object, object, None], name: str) -> None:
        task = asyncio.create_task(job, name=name)
        self._tasks.add(task)
        task.add_done_callback(self._finished)

    def _finished(self, task: asyncio.Task[None]) -> None:
        self._tasks.discard(task)
        if not task.cancelled() and (error := task.exception()) is not None:
            log.error("job %s failed", task.get_name(), exc_info=error)

    async def drain(self) -> None:
        """Wait until no job is running, including jobs started by other jobs (tests, shutdown)."""
        while self._tasks:
            await asyncio.gather(*list(self._tasks), return_exceptions=True)
