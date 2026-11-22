"""Queue maintenance jobs; the running backend (./dev.sh) executes them. This process never opens the vector store
(ChromaDB is owned by the backend process).

cd backend
.venv/bin/python -m app.jobs.cli reprocess   # every video (from Whisper on), document and usta answer again
.venv/bin/python -m app.jobs.cli reembed     # only re-embed chunks (after changing EMBEDDING_MODEL)
"""

import argparse
import asyncio

from sqlalchemy import select

from app.config import get_settings
from app.db import make_engine, make_sessionmaker
from app.documents.models import Document
from app.documents.service import JOB_KIND as DOCUMENT_JOB
from app.jobs.queue import JobQueue
from app.jobs.registry import register_jobs
from app.questions.models import Question, QuestionStatus
from app.search.jobs import REEMBED_JOB
from app.videos import pipeline
from app.videos.models import UPLOAD_PIPELINE


async def run(command: str) -> str:
    engine = make_engine(get_settings().database_url)
    sessionmaker = make_sessionmaker(engine)
    jobs = JobQueue(sessionmaker)
    register_jobs(jobs)
    try:
        if command == "reembed":
            await jobs.enqueue(REEMBED_JOB, {})
            return "Queued: re-embed stale chunks."
        async with sessionmaker() as db:
            videos = await pipeline.reset_for_reprocess(db)
            documents = list(await db.scalars(select(Document.id)))
            answers = list(await db.scalars(select(Question.id).where(Question.status == QuestionStatus.answered)))
        for video_id in videos:
            await jobs.enqueue(pipeline.JOB_KIND, {"video_id": video_id, "pipeline": UPLOAD_PIPELINE})
        for doc_id in documents:
            await jobs.enqueue(DOCUMENT_JOB, {"document_id": doc_id})
        for question_id in answers:
            await jobs.enqueue("answer_index", {"question_id": question_id})
        return f"Queued: {len(videos)} videos, {len(documents)} documents, {len(answers)} usta answers."
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.jobs.cli")
    parser.add_argument("command", choices=["reprocess", "reembed"])
    print(asyncio.run(run(parser.parse_args().command)))


if __name__ == "__main__":
    main()
