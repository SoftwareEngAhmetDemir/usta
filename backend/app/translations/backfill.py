"""Job "language_backfill" {"language"}: when a user chooses a language, translate what was written before into it
(questions, answers, document summaries), so their pages show it. Stored translations are reused, so running it
again for a language costs only lookups."""

from app.context import AppContext
from app.documents.service import translate_summaries
from app.jobs.queue import Payload, Progress
from app.questions.service import translate_all


async def backfill(ctx: AppContext, payload: Payload, progress: Progress) -> None:
    lang = str(payload["language"])
    await progress(10, "Sorular çevriliyor")
    await translate_all(ctx, lang)
    await progress(60, "Doküman özetleri çevriliyor")
    await translate_summaries(ctx, lang)
