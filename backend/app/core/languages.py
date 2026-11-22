from pydantic import BaseModel

from app.core.schemas import Dir, LocalizedText


class Language(BaseModel):
    code: str
    name: str  # native name
    tr_name: str  # Turkish name (the UI is Turkish; drop-downs search both)
    dir: Dir


# (code, native name, Turkish name, ISO 639-2 tag for MP4 audio tracks, has a voice). Every code is one that
# Google's free translate endpoint accepts and that Whisper uses for the same language. "voice": the free speech
# endpoint speaks it (checked live 2026-11-22); without it a video gets translated subtitles but no dubbed audio.
_TABLE: list[tuple[str, str, str, str, bool]] = [
    ("tr", "Türkçe", "Türkçe", "tur", True),
    ("en", "English", "İngilizce", "eng", True),
    ("ar", "العربية", "Arapça", "ara", True),
    ("af", "Afrikaans", "Afrikaanca", "afr", True),
    ("az", "Azərbaycanca", "Azerbaycan Türkçesi", "aze", False),
    ("id", "Bahasa Indonesia", "Endonezce", "ind", True),
    ("ms", "Bahasa Melayu", "Malayca", "msa", True),
    ("jw", "Basa Jawa", "Cava dili", "jav", True),
    ("su", "Basa Sunda", "Sunda dili", "sun", True),
    ("bs", "Bosanski", "Boşnakça", "bos", True),
    ("ca", "Català", "Katalanca", "cat", True),
    ("cs", "Čeština", "Çekçe", "ces", True),
    ("cy", "Cymraeg", "Galce", "cym", True),
    ("da", "Dansk", "Danca", "dan", True),
    ("de", "Deutsch", "Almanca", "deu", True),
    ("et", "Eesti", "Estonca", "est", True),
    ("es", "Español", "İspanyolca", "spa", True),
    ("eu", "Euskara", "Baskça", "eus", True),
    ("tl", "Filipino", "Filipince", "fil", True),
    ("fr", "Français", "Fransızca", "fra", True),
    ("ga", "Gaeilge", "İrlandaca", "gle", False),
    ("gl", "Galego", "Galiçyaca", "glg", True),
    ("ha", "Hausa", "Hausa dili", "hau", True),
    ("hr", "Hrvatski", "Hırvatça", "hrv", True),
    ("is", "Íslenska", "İzlandaca", "isl", True),
    ("it", "Italiano", "İtalyanca", "ita", True),
    ("sw", "Kiswahili", "Svahili", "swa", True),
    ("ku", "Kurdî", "Kürtçe", "kur", False),
    ("lv", "Latviešu", "Letonca", "lav", True),
    ("lt", "Lietuvių", "Litvanca", "lit", True),
    ("hu", "Magyar", "Macarca", "hun", True),
    ("nl", "Nederlands", "Felemenkçe", "nld", True),
    ("no", "Norsk", "Norveççe", "nor", True),
    ("uz", "Oʻzbekcha", "Özbekçe", "uzb", False),
    ("pl", "Polski", "Lehçe", "pol", True),
    ("pt", "Português", "Portekizce", "por", True),
    ("ro", "Română", "Rumence", "ron", True),
    ("sq", "Shqip", "Arnavutça", "sqi", True),
    ("sk", "Slovenčina", "Slovakça", "slk", True),
    ("sl", "Slovenščina", "Slovence", "slv", False),
    ("so", "Soomaali", "Somalice", "som", False),
    ("fi", "Suomi", "Fince", "fin", True),
    ("sv", "Svenska", "İsveççe", "swe", True),
    ("vi", "Tiếng Việt", "Vietnamca", "vie", True),
    ("tk", "Türkmençe", "Türkmence", "tuk", False),
    ("el", "Ελληνικά", "Yunanca", "ell", True),
    ("be", "Беларуская", "Belarusça", "bel", False),
    ("bg", "Български", "Bulgarca", "bul", True),
    ("ky", "Кыргызча", "Kırgızca", "kir", False),
    ("mk", "Македонски", "Makedonca", "mkd", False),
    ("mn", "Монгол", "Moğolca", "mon", False),
    ("ru", "Русский", "Rusça", "rus", True),
    ("sr", "Српски", "Sırpça", "srp", True),
    ("tg", "Тоҷикӣ", "Tacikçe", "tgk", False),
    ("uk", "Українська", "Ukraynaca", "ukr", True),
    ("kk", "Қазақ тілі", "Kazakça", "kaz", False),
    ("ka", "ქართული", "Gürcüce", "kat", False),
    ("hy", "Հայերեն", "Ermenice", "hye", False),
    ("he", "עברית", "İbranice", "heb", True),
    ("ur", "اردو", "Urduca", "urd", True),
    ("ps", "پښتو", "Peştuca", "pus", False),
    ("fa", "فارسی", "Farsça", "fas", False),
    ("am", "አማርኛ", "Amharca", "amh", True),
    ("ne", "नेपाली", "Nepalce", "nep", True),
    ("mr", "मराठी", "Marathi", "mar", True),
    ("hi", "हिन्दी", "Hintçe", "hin", True),
    ("bn", "বাংলা", "Bengalce", "ben", True),
    ("pa", "ਪੰਜਾਬੀ", "Pencapça", "pan", True),
    ("gu", "ગુજરાતી", "Güceratça", "guj", True),
    ("ta", "தமிழ்", "Tamilce", "tam", True),
    ("te", "తెలుగు", "Telugu dili", "tel", True),
    ("kn", "ಕನ್ನಡ", "Kannada dili", "kan", True),
    ("ml", "മലയാളം", "Malayalam dili", "mal", True),
    ("si", "සිංහල", "Seylanca", "sin", True),
    ("th", "ไทย", "Tayca", "tha", True),
    ("lo", "ລາວ", "Laoca", "lao", False),
    ("my", "မြန်မာ", "Birmanca", "mya", True),
    ("km", "ខ្មែរ", "Kmerce", "khm", True),
    ("ko", "한국어", "Korece", "kor", True),
    ("ja", "日本語", "Japonca", "jpn", True),
    ("zh", "中文", "Çince", "zho", True),
]
_RTL = {"ar", "fa", "he", "ps", "ur"}

# The backend owns the supported list (GET /languages): Turkish, English, Arabic first, then by native name.
LANGUAGES: dict[str, Language] = {
    code: Language(code=code, name=name, tr_name=tr_name, dir="rtl" if code in _RTL else "ltr")
    for code, name, tr_name, _, _ in _TABLE
}
ISO639_2: dict[str, str] = {code: iso for code, _, _, iso, _ in _TABLE}
VOICED: frozenset[str] = frozenset(code for code, _, _, _, voice in _TABLE if voice)
DEFAULT_LANGUAGE = "tr"


def lang_dir(code: str) -> Dir:
    lang = LANGUAGES.get(code)
    return lang.dir if lang else "ltr"


def lang_tr_name(code: str) -> str:
    lang = LANGUAGES.get(code)
    return lang.tr_name if lang else code


def lang_name(code: str) -> str:
    lang = LANGUAGES.get(code)
    return lang.name if lang else code


def localized(text: str, lang: str) -> LocalizedText:
    return LocalizedText(text=text, lang=lang, dir=lang_dir(lang))
