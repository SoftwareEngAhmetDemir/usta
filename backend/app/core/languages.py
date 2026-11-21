from pydantic import BaseModel

from app.core.schemas import Dir, LocalizedText


class Language(BaseModel):
    code: str
    name: str  # native name
    dir: Dir


# The backend owns the supported list (GET /languages). Content is shown in these; the UI stays Turkish.
LANGUAGES: dict[str, Language] = {
    lang.code: lang
    for lang in (
        Language(code="tr", name="Türkçe", dir="ltr"),
        Language(code="en", name="English", dir="ltr"),
        Language(code="ar", name="العربية", dir="rtl"),
    )
}
DEFAULT_LANGUAGE = "tr"


def lang_dir(code: str) -> Dir:
    lang = LANGUAGES.get(code)
    return lang.dir if lang else "ltr"


def lang_name(code: str) -> str:
    lang = LANGUAGES.get(code)
    return lang.name if lang else code


def localized(text: str, lang: str) -> LocalizedText:
    return LocalizedText(text=text, lang=lang, dir=lang_dir(lang))
