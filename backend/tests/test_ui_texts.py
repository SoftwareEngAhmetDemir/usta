from collections.abc import Awaitable, Callable

from httpx import AsyncClient

from app.auth.models import User
from app.translations.service import _framed, _unframed
from tests.conftest import ClientAs
from tests.fakes import FakeAI

MakeUser = Callable[..., Awaitable[User]]
LONG = "Bu makinenin videolarında ve dokümanlarında cevap bulunamadı."


def test_short_labels_are_translated_inside_a_frame_and_taken_back_out() -> None:
    assert _framed("Sor") == 'Uygulama düğmesi: "Sor"'  # alone, Google reads "Sor" as "mister"
    assert _framed(LONG) == LONG  # a sentence has its own context
    assert _unframed("Sor", 'زر التطبيق: "اسأل"') == "اسأل"
    assert _unframed("Aç", "App-Button: „Öffnen“") == "Öffnen"
    assert _unframed("Sor", "应用按钮：“问”") == "问"
    assert _unframed("Sor", "frame lost") == "Sor"  # shown in Turkish rather than wrong
    assert _unframed(LONG, "No answer found.") == "No answer found."


async def test_ui_texts_come_in_the_users_language_and_are_translated_once(
    client: AsyncClient, client_as: ClientAs, make_user: MakeUser, ai: FakeAI
) -> None:
    assert (await client.post("/api/ui-texts", json={"texts": ["Sor"]})).status_code == 401

    turkish = await client_as(await make_user(language="tr"))
    res = (await turkish.post("/api/ui-texts", json={"texts": ["Sor"]})).json()
    assert res == {"language": "tr", "dir": "ltr", "texts": {}}  # Turkish is the source: nothing to translate

    ai.translator.table = {'Uygulama düğmesi: "Sor"': 'زر التطبيق: "اسأل"', LONG: "لم يتم العثور على إجابة."}
    arabic = await client_as(await make_user(language="ar"))
    res = (await arabic.post("/api/ui-texts", json={"texts": ["Sor", LONG, "Sor", " "]})).json()
    assert res == {"language": "ar", "dir": "rtl", "texts": {"Sor": "اسأل", LONG: "لم يتم العثور على إجابة."}}
    calls = ai.translator.calls

    other = await client_as(await make_user(language="ar"))
    assert (await other.post("/api/ui-texts", json={"texts": ["Sor"]})).json()["texts"] == {"Sor": "اسأل"}
    assert ai.translator.calls == calls  # stored: the second user does not call the translator


async def test_ui_texts_without_the_translator_return_what_is_stored(
    client_as: ClientAs, make_user: MakeUser, ai: FakeAI
) -> None:
    c = await client_as(await make_user(language="en"))
    assert (await c.post("/api/ui-texts", json={"texts": [LONG]})).json()["texts"] == {LONG: f"[en] {LONG}"}
    ai.translator.fail = True
    res = (await c.post("/api/ui-texts", json={"texts": [LONG, "Gönder"]})).json()
    assert res["texts"] == {LONG: f"[en] {LONG}"}  # "Gönder" stays Turkish until the translator is back
    too_many = {"texts": [f"metin {i}" for i in range(501)]}
    assert (await c.post("/api/ui-texts", json=too_many)).status_code == 422
