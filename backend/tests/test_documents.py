import io
from collections.abc import Awaitable, Callable

from reportlab.pdfgen.canvas import Canvas
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User
from app.context import AppContext
from app.machines.models import Machine
from app.search.models import SearchChunk
from tests.conftest import ClientAs
from tests.fakes import FakeAI

MakeUser = Callable[..., Awaitable[User]]
MakeMachine = Callable[..., Awaitable[Machine]]


def two_page_pdf() -> bytes:
    buf = io.BytesIO()
    canvas = Canvas(buf)
    canvas.drawString(72, 720, "Hava basinci 6 bar olmalidir.")
    canvas.showPage()
    canvas.drawString(72, 720, "Elektrot her 200 saatte degistirilir.")
    canvas.save()
    return buf.getvalue()


async def test_patron_uploads_pdf_summary_and_search_are_prepared(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, db: AsyncSession
) -> None:
    machine = await make_machine()
    patron = await client_as(await make_user(Role.patron))
    res = await patron.post(
        f"/api/machines/{machine.id}/documents",
        data={"type": "user_manual", "title": "Kullanım kılavuzu"},
        files={"file": ("kilavuz.pdf", two_page_pdf(), "application/pdf")},
    )
    assert res.status_code == 200
    doc = res.json()
    assert doc["summary_status"] == "preparing" and doc["summary_preview"] is None
    await ctx.jobs.drain()

    english = await client_as(await make_user(language="en"))
    detail = (await english.get(f"/api/documents/{doc['id']}")).json()
    assert detail["page_count"] == 2 and detail["mime_type"] == "application/pdf"
    assert detail["summary_status"] == "ready"
    assert detail["summary"]["lang"] == "en" and detail["summary"]["language_name"] == "English"
    assert detail["summary"]["points"][0].startswith("[en] Özet: Hava basinci 6 bar")
    assert (await english.get(detail["file_url"])).content.startswith(b"%PDF")

    page = (await english.get(f"/api/machines/{machine.id}")).json()
    assert page["documents"][0]["summary_preview"]["lang"] == "en"
    pages = [c.page or 0 for c in await db.scalars(select(SearchChunk).where(SearchChunk.document_id == doc["id"]))]
    assert sorted(pages) == [1, 2]

    answer = (
        await english.post(f"/api/machines/{machine.id}/ask", json={"question": "Elektrot kac saatte degistirilir?"})
    ).json()
    assert answer["status"] == "answered"
    assert answer["sources"][0] == {
        "kind": "document",
        "document_id": doc["id"],
        "title": "Kullanım kılavuzu",
        "page": 2,
    }


async def test_document_without_ai_has_no_summary(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, ai: FakeAI
) -> None:
    ai.fail.update({"embed", "summarize"})
    machine = await make_machine()
    patron = await client_as(await make_user(Role.patron))
    doc = (
        await patron.post(
            f"/api/machines/{machine.id}/documents",
            data={"type": "catalog", "title": "Katalog"},
            files={"file": ("k.pdf", two_page_pdf(), "application/pdf")},
        )
    ).json()
    await ctx.jobs.drain()
    detail = (await patron.get(f"/api/documents/{doc['id']}")).json()
    assert detail["page_count"] == 2 and detail["summary_status"] == "none" and detail["summary"] is None


async def test_document_upload_rules(client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine) -> None:
    machine = await make_machine()
    body = {"type": "catalog", "title": "Katalog"}
    pdf = {"file": ("k.pdf", b"%PDF-1.4", "application/pdf")}
    usta = await client_as(await make_user(Role.usta))
    assert (await usta.post(f"/api/machines/{machine.id}/documents", data=body, files=pdf)).status_code == 403
    patron = await client_as(await make_user(Role.patron))
    exe = {"file": ("x.exe", b"MZ", "application/octet-stream")}
    res = await patron.post(f"/api/machines/{machine.id}/documents", data=body, files=exe)
    assert res.status_code == 422 and res.json() == {"detail": "Yalnızca PDF veya fotoğraf (JPG, PNG) yüklenebilir."}
    bad_type = await patron.post(f"/api/machines/{machine.id}/documents", data={**body, "type": "poster"}, files=pdf)
    assert bad_type.status_code == 422
    assert (await patron.get("/api/documents/999999")).status_code == 404


async def test_photo_document_is_read_by_ai(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext
) -> None:
    machine = await make_machine()
    patron = await client_as(await make_user(Role.patron))
    doc = (
        await patron.post(
            f"/api/machines/{machine.id}/documents",
            data={"type": "technical_info", "title": "Etiket"},
            files={"file": ("etiket.jpg", b"\xff\xd8jpeg", "image/jpeg")},
        )
    ).json()
    await ctx.jobs.drain()
    detail = (await patron.get(f"/api/documents/{doc['id']}")).json()
    assert detail["page_count"] == 1 and detail["summary"]["points"][0] == "Özet: Fotoğraftaki doküman metni"
