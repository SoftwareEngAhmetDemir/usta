"""Every job kind and its handler. Kept apart from app.main so scripts can queue jobs without building the app
(which would open the vector store in a second process)."""

from app.documents import service as documents_service
from app.jobs.queue import JobQueue
from app.questions import service as questions_service
from app.search.jobs import REEMBED_JOB, reembed_job
from app.translations import backfill
from app.translations.service import BACKFILL_JOB
from app.videos import pipeline


def register_jobs(jobs: JobQueue) -> None:
    jobs.register(pipeline.JOB_KIND, pipeline.job)
    jobs.register(documents_service.JOB_KIND, documents_service.job)
    jobs.register("question_translate", questions_service.translate_question)
    jobs.register("answer_index", questions_service.after_answer)
    jobs.register(REEMBED_JOB, reembed_job)
    jobs.register(BACKFILL_JOB, backfill.backfill)
