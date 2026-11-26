import io
from collections.abc import Awaitable, Callable

from docx import Document as DocxDocument
from openpyxl import Workbook
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen.canvas import Canvas
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User
from app.context import AppContext
from app.core import storage
from app.machines.models import Machine
from app.search.models import Chunk
from tests.conftest import ClientAs
from tests.fakes import FakeAI

MakeUser = Callable[..., Awaitable[User]]
MakeMachine = Callable[..., Awaitable[Machine]]


def two_page_pdf() -> bytes:
    """Page 1: a heading (bigger font), a paragraph and a parts table; page 2: maintenance text."""
    buf = io.BytesIO()
    c = Canvas(buf, pagesize=A4)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(72, 780, "Kurulum")
    c.setFont("Helvetica", 11)
    c.drawString(72, 750, "Hava basinci 6 bar olmalidir.")
    rows = [("Parca no", "Aciklama"), ("PK-220", "Nozul 1.2 mm"), ("PK-221", "Elektrot")]
    for i, (a, b) in enumerate(rows):
        y = 700 - i * 20
        c.drawString(80, y + 5, a)
        c.drawString(230, y + 5, b)
        c.line(72, y, 400, y)
    c.line(72, 720, 400, 720)
    for x in (72, 220, 400):
        c.line(x, 660, x, 720)
    c.showPage()
    c.setFont("Helvetica", 11)
    c.drawString(72, 780, "Elektrot her 200 saatte degistirilir. Hata kodu E-204: basinc sensoru arizasi.")
    c.save()
    return buf.getvalue()


def text_image(lines: list[str]) -> Image.Image:
    img = Image.new("RGB", (1400, 120 + 90 * len(lines)), "white")
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default(size=56)
    for i, line in enumerate(lines):
        draw.text((40, 40 + i * 90), line, fill="black", font=font)
    return img


def scanned_pdf() -> bytes:
    buf = io.BytesIO()
    text_image(["Torch height 3 mm", "Change the nozzle every 8 hours"]).save(buf, format="PDF")
    return buf.getvalue()


def photo() -> bytes:
    buf = io.BytesIO()
    text_image(["Max pressure 6 bar"]).save(buf, format="PNG")
    return buf.getvalue()


def docx() -> bytes:
    d = DocxDocument()
    d.add_heading("Bakim", level=1)
    d.add_paragraph("Nozul her 8 saatte degistirilir.")
    table = d.add_table(rows=2, cols=2)
    for r, (a, b) in enumerate([("Parca", "Kod"), ("Nozul", "PK-220")]):
        table.cell(r, 0).text, table.cell(r, 1).text = a, b
    buf = io.BytesIO()
    d.save(buf)
    return buf.getvalue()


def xlsx() -> bytes:
    wb = Workbook()
    ws = wb.active
    assert ws is not None
    ws.title = "Yedek parca"
    for row in [("Parca", "Kod", "Stok"), ("Nozul", "PK-220", 12), ("Elektrot", "PK-221", 5)]:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


async def _upload(c: object, machine_id: int, name: str, data: bytes, mime: str, title: str = "Kılavuz") -> int:
    from httpx import AsyncClient

    assert isinstance(c, AsyncClient)
    res = await c.post(
        f"/api/machines/{machine_id}/documents",
        data={"type": "user_manual", "title": title},
        files={"file": (name, data, mime)},
    )
    assert res.status_code == 200, res.text
    doc_id: int = res.json()["id"]
    return doc_id


async def test_pdf_keeps_pages_headings_and_tables_and_is_searchable(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, db: AsyncSession,
    ai: FakeAI,
) -> None:  # fmt: skip
    machine = await make_machine()
    patron = await client_as(await make_user(Role.patron))
    english = await client_as(await make_user(language="en"))  # summaries are translated into languages in use
    doc_id = await _upload(patron, machine.id, "kilavuz.pdf", two_page_pdf(), "application/pdf", "Kullanım kılavuzu")
    first = (await patron.get(f"/api/documents/{doc_id}")).json()
    assert first["summary_status"] == "preparing"
    await ctx.jobs.drain(ctx)

    chunks = list(await db.scalars(select(Chunk).where(Chunk.document_id == doc_id).order_by(Chunk.id)))
    assert {c.page for c in chunks} == {1, 2}
    page1 = [c for c in chunks if c.page == 1]
    assert all(c.section_heading == "Kurulum" for c in page1)
    table = next(c for c in page1 if "| PK-220 | Nozul 1.2 mm |" in c.text)  # part number stays with its value
    assert table.title == "kilavuz.pdf" and table.language == "tr"
    assert "Hava basinci 6 bar" not in table.text or "| Parca no | Aciklama |" in table.text

    detail = (await english.get(f"/api/documents/{doc_id}")).json()
    assert detail["page_count"] == 2 and detail["summary_status"] == "ready"
    assert detail["summary"]["lang"] == "en" and detail["summary"]["points"][0].startswith("[en] Özet: Kurulum")

    # An error code is found by the keyword side of hybrid search even when meaning-based search would miss it.
    answer = (await english.post(f"/api/machines/{machine.id}/ask", json={"question": "E-204 ne demek?"})).json()
    assert answer["status"] == "answered"
    assert answer["sources"][0] == {
        "kind": "document", "document_id": doc_id, "title": "Kullanım kılavuzu", "file_name": "kilavuz.pdf",
        "page": 2, "section_heading": "Kurulum",
    }  # fmt: skip
    assert "page 2" in ai.llm.sources[0] and "E-204" in ai.llm.sources[0]


async def test_scanned_pdf_and_photo_are_read_with_ocr(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, db: AsyncSession
) -> None:
    machine = await make_machine()
    patron = await client_as(await make_user(Role.patron))
    scan = await _upload(patron, machine.id, "tarama.pdf", scanned_pdf(), "application/pdf")
    pic = await _upload(patron, machine.id, "etiket.png", photo(), "image/png")
    await ctx.jobs.drain(ctx)
    scan_text = " ".join(c.text for c in await db.scalars(select(Chunk).where(Chunk.document_id == scan)))
    assert "nozzle" in scan_text.lower() and "8 hours" in scan_text
    pic_text = " ".join(c.text for c in await db.scalars(select(Chunk).where(Chunk.document_id == pic)))
    assert "6 bar" in pic_text


async def test_office_csv_and_text_files(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, db: AsyncSession
) -> None:
    machine = await make_machine()
    usta_user = await make_user(Role.usta)
    machine.ustas = [usta_user]
    await db.commit()
    usta = await client_as(usta_user)
    word = await _upload(usta, machine.id, "bakim.docx", docx(), "application/octet-stream")  # mime from extension
    excel = await _upload(
        usta, machine.id, "parca.xlsx", xlsx(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    sheet = await _upload(usta, machine.id, "stok.csv", b"Parca;Kod\nNozul;PK-220\n", "text/csv")
    note = await _upload(usta, machine.id, "not.txt", b"UYARI:\nBakimdan once enerjiyi kesin.\n", "text/plain")
    await ctx.jobs.drain(ctx)

    async def texts(doc_id: int) -> list[tuple[str | None, str]]:
        return [(c.section_heading, c.text) for c in await db.scalars(select(Chunk).where(Chunk.document_id == doc_id))]

    assert (
        "Bakim",
        "Bakim\nNozul her 8 saatte degistirilir.\n| Parca | Kod |\n|---|---|\n| Nozul | PK-220 |",
    ) in await texts(word)
    assert (
        "Yedek parca",
        "Yedek parca\n| Parca | Kod | Stok |\n|---|---|---|\n| Nozul | PK-220 | 12 |\n| Elektrot | PK-221 | 5 |",
    ) in await texts(excel)
    assert (None, "| Parca | Kod |\n|---|---|\n| Nozul | PK-220 |") in await texts(sheet)
    assert ("UYARI", "UYARI\nBakimdan once enerjiyi kesin.") in await texts(note)


async def test_document_without_summary_service_is_still_searchable(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, ai: FakeAI, db: AsyncSession
) -> None:
    ai.llm.fail = True
    machine = await make_machine()
    patron = await client_as(await make_user(Role.patron))
    doc_id = await _upload(patron, machine.id, "k.pdf", two_page_pdf(), "application/pdf")
    await ctx.jobs.drain(ctx)
    detail = (await patron.get(f"/api/documents/{doc_id}")).json()
    assert detail["page_count"] == 2 and detail["summary_status"] == "none" and detail["summary"] is None
    assert (await db.scalar(select(func.count()).where(Chunk.document_id == doc_id)) or 0) > 0


async def test_document_upload_rules(client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine) -> None:
    machine = await make_machine()
    body = {"type": "catalog", "title": "Katalog"}
    pdf = {"file": ("k.pdf", b"%PDF-1.4", "application/pdf")}
    other_usta = await client_as(await make_user(Role.usta))  # not this machine's usta
    assert (await other_usta.post(f"/api/machines/{machine.id}/documents", data=body, files=pdf)).status_code == 403
    worker = await client_as(await make_user())
    assert (await worker.post(f"/api/machines/{machine.id}/documents", data=body, files=pdf)).status_code == 403
    patron = await client_as(await make_user(Role.patron))
    exe = {"file": ("x.exe", b"MZ", "application/octet-stream")}
    res = await patron.post(f"/api/machines/{machine.id}/documents", data=body, files=exe)
    assert res.status_code == 422 and res.json()["detail"].startswith("Yalnızca PDF, Word (DOCX), Excel (XLSX)")
    bad_type = await patron.post(f"/api/machines/{machine.id}/documents", data={**body, "type": "poster"}, files=pdf)
    assert bad_type.status_code == 422
    assert (await patron.get("/api/documents/999999")).status_code == 404


async def test_broken_file_gives_an_empty_document_not_a_crash(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext
) -> None:
    machine = await make_machine()
    patron = await client_as(await make_user(Role.patron))
    doc_id = await _upload(patron, machine.id, "bozuk.pdf", b"%PDF-1.4 broken", "application/pdf")
    await ctx.jobs.drain(ctx)
    detail = (await patron.get(f"/api/documents/{doc_id}")).json()
    assert detail["page_count"] == 0 and detail["summary_status"] == "none"


async def test_delete_document_removes_chunks_vectors_and_file(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, db: AsyncSession, ai: FakeAI
) -> None:
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    usta = await client_as(usta_user)
    doc_id = await _upload(usta, machine.id, "k.pdf", two_page_pdf(), "application/pdf")
    patron = await client_as(await make_user(Role.patron))
    assert (await patron.delete(f"/api/documents/{doc_id}")).status_code == 409  # still being ingested
    await ctx.jobs.drain(ctx)
    assert ai.vectors.query(ai.embedder.embed_query("elektrot"), machine.id, 10)
    assert (await (await client_as(await make_user())).delete(f"/api/documents/{doc_id}")).status_code == 403
    assert (await usta.delete(f"/api/documents/{doc_id}")).status_code == 403  # even the machine's own usta
    assert (await patron.delete(f"/api/documents/{doc_id}")).status_code == 204
    assert await db.scalar(select(func.count()).where(Chunk.document_id == doc_id)) == 0
    assert ai.vectors.query(ai.embedder.embed_query("elektrot"), machine.id, 10) == []
    assert not storage.abs_path(f"docs/{doc_id}").exists()


async def test_summary_is_translated_when_someone_chooses_a_new_language(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext
) -> None:
    machine = await make_machine()
    patron = await client_as(await make_user(Role.patron))
    doc_id = await _upload(patron, machine.id, "not.txt", "Kurulum\nHava basıncı 6 bar olmalı.".encode(), "text/plain")
    await ctx.jobs.drain(ctx)
    worker = await client_as(await make_user())
    assert (await worker.get(f"/api/documents/{doc_id}")).json()["summary"]["lang"] == "tr"

    await worker.patch("/api/me/language", json={"language": "de"})  # nobody used German when it was summarized
    await ctx.jobs.drain(ctx)
    summary = (await worker.get(f"/api/documents/{doc_id}")).json()["summary"]
    assert summary["lang"] == "de" and summary["points"][0].startswith("[de] ")
