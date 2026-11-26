"""SQLAdmin (/admin) in the signed-in patron's site language, like the app's UI (`POST /ui-texts`).

Every text /admin shows is Turkish at the source: our view labels, and SQLAdmin's own English strings through its
Turkish catalog (the few it lacks stay English). They go through the same stored machine translation as the app
(`ui_texts`), loaded once per request before rendering (`use_language`); templates then look them up synchronously:
`gettext` for SQLAdmin's `_()`, the Jinja `finalize` hook for our labels printed as `{{ value }}`, and `translate`
for form labels. Data (machine names, notes) is never translated: only texts registered here are."""

import gettext as stdlib_gettext
import re
from contextvars import ContextVar
from pathlib import Path

import sqladmin
from jinja2 import Environment
from markupsafe import Markup
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.interfaces import AIUnavailableError, Translator
from app.core.languages import DEFAULT_LANGUAGE, LANGUAGES
from app.translations.service import stored_ui_texts, translate, ui_texts

_SQLADMIN = Path(sqladmin.__file__).parent / "translations"
_TURKISH = stdlib_gettext.translation("admin", localedir=_SQLADMIN, languages=["tr"], fallback=True)
_PLACEHOLDER = re.compile(r"%\(\w+\)[sd]")


def _msgids() -> list[str]:
    """SQLAdmin's English source strings (its .pot; continuation lines joined)."""
    pot = (_SQLADMIN / "admin.pot").read_text(encoding="utf-8")
    found = re.findall(r'^msgid ((?:".*"\n)+)', pot, flags=re.MULTILINE)
    ids = ["".join(re.findall(r'"(.*)"', block)).replace('\\"', '"') for block in found]
    return [i for i in ids if i]


_MSGIDS = _msgids()
_ENGLISH_ONLY = [m for m in _MSGIDS if _TURKISH.gettext(m) == m]  # no Turkish in SQLAdmin's catalog
# Shown while a newly picked language loads (templates/sqladmin/layout.html), in the language picked before.
LOADING_TEXTS = [
    "Dil hazırlanıyor…",
    "Sayfa seçtiğiniz dilde açılacak. İlk kez seçilen bir dil 10–20 saniye sürebilir.",
]
# Shown when the free translator gave up part-way (it throttles after many new languages in a row).
INCOMPLETE_TEXT = (
    "Bu dildeki bazı yazılar şu an çevrilemedi (çeviri servisi meşgul); yerlerinde İngilizcesi gösteriliyor. "
    "Biraz sonra sayfayı yenileyin."
)
_texts: list[str] = [_TURKISH.gettext(m) for m in _MSGIDS if m not in _ENGLISH_ONLY] + [*LOADING_TEXTS, INCOMPLETE_TEXT]
_current: ContextVar[dict[str, str] | None] = ContextVar("admin_texts", default=None)  # source → translation
_language: ContextVar[str] = ContextVar("admin_language", default=DEFAULT_LANGUAGE)
_incomplete: ContextVar[bool] = ContextVar("admin_incomplete", default=False)


def register(texts: list[str]) -> None:
    """Our own Turkish labels (view names, column labels, form labels, messages) that /admin may show."""
    _texts.extend(t for t in texts if t and t not in _texts)


def _same_placeholders(source: str, out: str) -> bool:
    return sorted(_PLACEHOLDER.findall(source)) == sorted(_PLACEHOLDER.findall(out))


async def use_language(db: AsyncSession, translator: Translator, language: str) -> None:
    """Load (and on first use machine-translate and store) every /admin text in `language` for this request."""
    language = language if language in LANGUAGES else DEFAULT_LANGUAGE
    found = await ui_texts(db, translator, _texts, language)
    missing = [t for t in _texts if t not in found] if language != DEFAULT_LANGUAGE else []
    if missing and language != "en":  # English beats Turkish for a foreign reader; stored only, no more calls
        found.update(await stored_ui_texts(db, missing, "en"))
    incomplete = bool(missing)
    if language != "en":
        try:
            english = await translate(db, translator, _ENGLISH_ONLY, "en", language)
            found.update(zip(_ENGLISH_ONLY, english, strict=True))
        except AIUnavailableError:  # these few stay English
            incomplete = True
    _incomplete.set(incomplete)
    _language.set(language)
    _current.set({src: out for src, out in found.items() if _same_placeholders(src, out)})


def translate_text(text: str) -> str:
    """A registered Turkish text (or SQLAdmin English string) in the current language; anything else unchanged."""
    return (_current.get() or {}).get(text, text)


def current_language() -> str:
    return _language.get()


def incomplete() -> bool:
    """Some texts of this page could not be translated now (shown in English or Turkish); a reload retries them."""
    return _incomplete.get()


def _gettext(message: str, **variables: object) -> str:
    """SQLAdmin's `_()`: English → its Turkish catalog → our translation; values like the view name are ours too."""
    turkish = _TURKISH.gettext(message)
    found = _current.get() or {}
    if turkish != message and (turkish in found or _language.get() == DEFAULT_LANGUAGE):
        text = found.get(turkish, turkish)
    else:  # no Turkish, or its translation lost a placeholder: English reads better than Turkish here
        text = found.get(message, message)
    if not variables:
        return text
    return text % {k: translate_text(v) if isinstance(v, str) else v for k, v in variables.items()}


def _ngettext(singular: str, plural: str, n: int, **variables: object) -> str:
    return _gettext(singular if n == 1 else plural, n=n, **variables)


def _finalize(value: object) -> object:
    """Every `{{ value }}`: our registered labels (view names, column labels, the title) get translated."""
    if isinstance(value, str) and not isinstance(value, Markup):
        return translate_text(value)
    return value


def install(env: Environment) -> None:
    """Hook the templates up; call before the first page is rendered (finalize is compiled into templates)."""
    env.install_gettext_callables(_gettext, _ngettext, newstyle=True)  # type: ignore[attr-defined]
    # Replace the newstyle wrappers: they format variables untranslated ("New Makine").
    env.globals["gettext"] = _gettext
    env.globals["ngettext"] = _ngettext
    env.globals["admin_language"] = current_language
    env.globals["admin_incomplete"] = incomplete
    env.globals["admin_incomplete_text"] = INCOMPLETE_TEXT
    env.globals["admin_loading_texts"] = LOADING_TEXTS
    env.globals["admin_text"] = translate_text  # a literal `{{ "…" }}` would be finalized once, at compile time
    env.globals["admin_languages"] = [(code, lang.name, lang.tr_name) for code, lang in LANGUAGES.items()]
    env.finalize = _finalize
