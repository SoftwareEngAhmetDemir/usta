"""Stored machine translations (app.ai.interfaces.Translator, not an LLM). Write paths (after a question/answer/
summary is saved) translate in background jobs; read paths only look up what is stored, so a page never waits."""

import hashlib
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.interfaces import AIUnavailableError, Translator
from app.auth.models import User
from app.context import AppContext
from app.core.languages import DEFAULT_LANGUAGE, LANGUAGES, localized
from app.core.schemas import LocalizedText
from app.translations.models import Translation

log = logging.getLogger(__name__)

BACKFILL_JOB = "language_backfill"  # app.translations.backfill
AUTO_DETECT = "auto"  # translator source language: let it detect what the user typed


def source_hash(text: str, lang: str) -> str:
    return hashlib.sha256(f"{lang}\n{text}".encode()).hexdigest()


async def stored(db: AsyncSession, items: list[tuple[str, str]], target: str) -> dict[str, str]:
    """{source_hash: translated text} for the (text, lang) items already translated to `target`."""
    hashes = {source_hash(t, lang) for t, lang in items if lang != target}
    if not hashes:
        return {}
    rows = await db.scalars(
        select(Translation).where(Translation.source_hash.in_(hashes), Translation.target_lang == target)
    )
    return {r.source_hash: r.text for r in rows}


class Localizer:
    """Shows (text, lang) pairs in the viewer's language: the stored translation, else the original."""

    def __init__(self, found: dict[str, str], target: str) -> None:
        self._found = found
        self._target = target

    @classmethod
    async def load(cls, db: AsyncSession, items: list[tuple[str, str]], target: str) -> "Localizer":
        return cls(await stored(db, items, target), target)

    def show(self, text: str, lang: str) -> tuple[LocalizedText, LocalizedText | None]:
        """(text to show, the original when the shown text is a translation)."""
        if lang != self._target and (hit := self._found.get(source_hash(text, lang))) is not None:
            return localized(hit, self._target), localized(text, lang)
        return localized(text, lang), None


async def translate(db: AsyncSession, translator: Translator, texts: list[str], source: str, target: str) -> list[str]:
    """Translate with the store as cache; raises AIUnavailableError when something new can't be translated."""
    if source == target:
        return list(texts)
    found = await stored(db, [(t, source) for t in texts], target)
    missing = list(dict.fromkeys(t for t in texts if source_hash(t, source) not in found))
    if missing:
        for text, out in zip(missing, await translator.translate(missing, source, target), strict=True):
            h = source_hash(text, source)
            found[h] = out
            await db.merge(Translation(source_hash=h, target_lang=target, text=out))
        await db.commit()
    return [found[source_hash(t, source)] for t in texts]


async def languages_in_use(db: AsyncSession) -> list[str]:
    """Turkish + every language a user has chosen. Content is translated ahead only into these (the free endpoint is
    rate-limited, and most of the ~80 supported languages have no reader); a newly chosen language is filled in by
    the "language_backfill" job."""
    chosen = set(await db.scalars(select(User.language).distinct()))
    return [code for code in LANGUAGES if code == DEFAULT_LANGUAGE or code in chosen]


async def translate_everywhere(ctx: AppContext, items: list[tuple[str, str]], targets: list[str] | None = None) -> None:
    """Job: store translations of each (text, lang) into `targets` (default: the languages in use)."""
    async with ctx.sessionmaker() as db:
        for target in targets if targets is not None else await languages_in_use(db):
            for source in {lang for _, lang in items if lang != target}:
                texts = [t for t, lang in items if lang == source and t]
                try:
                    await translate(db, ctx.ai.translator, texts, source, target)
                except AIUnavailableError as e:
                    log.warning("translation %s→%s skipped: %s", source, target, e)
