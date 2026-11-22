from collections.abc import Awaitable, Callable
from io import BytesIO

from httpx import AsyncClient
from pypdf import PdfReader

from app.auth.models import Role, User
from app.machines.models import Machine
from app.machines.service import embed_url
from tests.conftest import ClientAs

MakeUser = Callable[..., Awaitable[User]]
MakeMachine = Callable[..., Awaitable[Machine]]


async def test_everything_needs_login(client: AsyncClient) -> None:
    for path in ("/api/machines/1", "/api/machines/lookup?code=X", "/api/me/machines", "/api/admin/machines"):
        assert (await client.get(path)).status_code == 401, path


async def test_languages_and_switching_content_language(client_as: ClientAs, make_user: MakeUser) -> None:
    c = await client_as(await make_user())
    langs = (await c.get("/api/languages")).json()
    assert [lang["code"] for lang in langs] == ["tr", "en", "ar"]
    assert langs[2] == {"code": "ar", "name": "العربية", "dir": "rtl"}
    res = await c.patch("/api/me/language", json={"language": "ar"})
    assert res.status_code == 200 and res.json()["language"] == "ar"
    bad = await c.patch("/api/me/language", json={"language": "xx"})
    assert bad.status_code == 422 and bad.json() == {"detail": "Bu dil desteklenmiyor."}


async def test_lookup_by_sticker_code(client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine) -> None:
    machine = await make_machine()
    c = await client_as(await make_user())
    assert (await c.get(f"/api/machines/lookup?code={machine.code}")).json() == {"id": machine.id}
    scanned = await c.get("/api/machines/lookup", params={"code": f"https://old-tunnel.example/m/{machine.id}"})
    assert scanned.json() == {"id": machine.id}
    for unknown in ("YOK-1", "https://x.example/m/999999"):
        res = await c.get("/api/machines/lookup", params={"code": unknown})
        assert res.status_code == 404 and res.json() == {"detail": "Bu kodla makine bulunamadı."}


async def test_machine_page_shape_and_empty_sections(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    usta = await make_user(Role.usta, name="Mehmet Usta")
    machine = await make_machine(ustas=[usta])
    page = (await (await client_as(await make_user())).get(f"/api/machines/{machine.id}")).json()
    assert page["machine"] == {
        "id": machine.id, "code": machine.code, "name": "Plazma Kesim Makinesi", "type": "Plazma kesim",
        "model": "PK-105", "serial": machine.serial, "location": "Atölye A", "photo_url": None,
    }  # fmt: skip
    assert page["ustas"] == [{"id": usta.id, "name": "Mehmet Usta"}]
    for section in ("videos", "external_videos", "documents", "maintenance", "questions"):
        assert page[section] == [], section


async def test_machine_page_404(client_as: ClientAs, make_user: MakeUser) -> None:
    res = await (await client_as(await make_user())).get("/api/machines/999999")
    assert res.status_code == 404 and res.json() == {"detail": "Makine bulunamadı."}


async def test_actions_depend_on_role_and_assignment(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    my_usta, other_usta = await make_user(Role.usta), await make_user(Role.usta)
    machine = await make_machine(ustas=[my_usta])
    expected = {
        Role.worker: (True, False, False, False, False, False),
        Role.technician: (True, False, False, True, False, False),
        Role.patron: (True, True, True, True, True, True),
    }
    for role, flags in expected.items():
        page = (await (await client_as(await make_user(role))).get(f"/api/machines/{machine.id}")).json()
        assert tuple(page["actions"].values()) == flags, role
    assert (await (await client_as(my_usta)).get(f"/api/machines/{machine.id}")).json()["actions"]["record_video"]
    assert not (await (await client_as(other_usta)).get(f"/api/machines/{machine.id}")).json()["actions"][
        "record_video"
    ]
    mine = (await (await client_as(my_usta)).get(f"/api/machines/{machine.id}")).json()["actions"]
    assert mine["archive"] and mine["qr"]
    assert not (await (await client_as(other_usta)).get(f"/api/machines/{machine.id}")).json()["actions"]["qr"]


async def test_usta_gets_qr_and_sticker_of_own_machine_only(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    usta = await make_user(Role.usta)
    mine, other = await make_machine(ustas=[usta]), await make_machine()
    c = await client_as(usta)
    assert (await c.get(f"/api/machines/{mine.id}/qr.svg")).status_code == 200
    sticker = await c.get(f"/api/machines/{mine.id}/sticker.pdf")
    assert sticker.status_code == 200 and mine.code in PdfReader(BytesIO(sticker.content)).pages[0].extract_text()
    assert (await c.get(f"/api/machines/{other.id}/qr.svg")).status_code == 403
    assert (await c.get(f"/api/machines/{other.id}/sticker.pdf")).status_code == 403
    patron = await client_as(await make_user(Role.patron))
    assert (await patron.get(f"/api/machines/{other.id}/sticker.pdf")).status_code == 200
    assert (await patron.get("/api/machines/999999/sticker.pdf")).status_code == 404


async def test_ustas_and_patron_search_all_machines(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    usta = await make_user(Role.usta)
    plasma, fork = await make_machine(name="Plazma Kesim"), await make_machine(name="Forklift 3")
    c = await client_as(usta)  # an usta finds machines that are not theirs too
    assert [m["id"] for m in (await c.get("/api/machines", params={"q": "forkl"})).json()] == [fork.id]
    hit = (await c.get("/api/machines", params={"q": plasma.code})).json()
    assert hit == [{"id": plasma.id, "code": plasma.code, "name": "Plazma Kesim", "location": plasma.location}]
    assert len((await c.get("/api/machines")).json()) == 2
    assert (await c.get("/api/machines", params={"q": "100%"})).json() == []  # % is literal
    patron = await client_as(await make_user(Role.patron))
    assert len((await patron.get("/api/machines")).json()) == 2
    for role in (Role.worker, Role.technician):
        assert (await (await client_as(await make_user(role))).get("/api/machines")).status_code == 403


async def test_my_machines_for_usta_and_patron(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    usta = await make_user(Role.usta)
    mine = await make_machine(ustas=[usta], name="A makinesi")
    await make_machine(name="B makinesi")
    assert [m["id"] for m in (await (await client_as(usta)).get("/api/me/machines")).json()] == [mine.id]
    assert len((await (await client_as(await make_user(Role.patron))).get("/api/me/machines")).json()) == 2


async def test_patron_adds_external_video_with_embed(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    machine = await make_machine()
    body = {
        "title": "Üretici: sarf malzeme",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "source": "manufacturer",
    }
    worker = await client_as(await make_user())
    assert (await worker.post(f"/api/machines/{machine.id}/external-videos", json=body)).status_code == 403
    patron = await client_as(await make_user(Role.patron))
    res = await patron.post(f"/api/machines/{machine.id}/external-videos", json=body)
    assert res.status_code == 200
    assert res.json()["embed_url"] == "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    page = (await worker.get(f"/api/machines/{machine.id}")).json()
    assert [v["title"] for v in page["external_videos"]] == ["Üretici: sarf malzeme"]
    bad = await patron.post(f"/api/machines/{machine.id}/external-videos", json={**body, "url": "javascript:alert(1)"})
    assert bad.status_code == 422


def test_embed_url_only_for_known_players() -> None:
    assert embed_url("https://youtu.be/dQw4w9WgXcQ") == "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    assert embed_url("https://vimeo.com/123456") == "https://player.vimeo.com/video/123456"
    assert embed_url("https://servis.example.com/video.mp4") is None


async def test_qr_svg_and_sticker_pdf_for_patron(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    machine = await make_machine()
    patron = await client_as(await make_user(Role.patron))
    svg = await patron.get(f"/api/machines/{machine.id}/qr.svg")
    assert svg.status_code == 200 and svg.headers["content-type"] == "image/svg+xml"
    assert b"<svg" in svg.content
    pdf = await patron.get("/api/admin/qr-stickers.pdf")
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")
    other = await make_machine(name="Seçilmeyen Makine")
    picked = await patron.get("/api/admin/qr-stickers.pdf", params={"ids": [machine.id]})
    assert picked.status_code == 200
    text = "".join(page.extract_text() for page in PdfReader(BytesIO(picked.content)).pages)
    assert machine.code in text and other.code not in text  # only the picked machine (KAN-30)
    worker = await client_as(await make_user())
    assert (await worker.get(f"/api/machines/{machine.id}/qr.svg")).status_code == 403
    assert (await worker.get("/api/admin/qr-stickers.pdf")).status_code == 403


NEW = {
    "code": " cnc-7 ",
    "name": "CNC Torna",
    "type": "Torna",
    "model": "T-200",
    "serial": "X1",
    "location": "Atölye B",
}


async def test_usta_adds_a_machine_and_becomes_its_usta(client_as: ClientAs, make_user: MakeUser) -> None:
    usta = await make_user(Role.usta)
    c = await client_as(usta)
    res = await c.post("/api/machines", json=NEW)
    assert res.status_code == 201
    machine_id = res.json()["id"]
    assert (await c.get("/api/me/machines")).json() == [{"id": machine_id, "code": "CNC-7", "name": "CNC Torna"}]
    page = (await c.get(f"/api/machines/{machine_id}")).json()
    assert [u["id"] for u in page["ustas"]] == [usta.id] and page["machine"]["location"] == "Atölye B"
    again = await c.post("/api/machines", json={**NEW, "code": "CNC-7"})
    assert again.status_code == 409 and again.json() == {"detail": "Bu kodla bir makine zaten var."}
    assert (await c.post("/api/machines", json={**NEW, "code": "C2", "name": " "})).status_code == 422


async def test_patron_adds_a_machine_without_ustas_others_may_not(client_as: ClientAs, make_user: MakeUser) -> None:
    patron = await client_as(await make_user(Role.patron))
    machine_id = (await patron.post("/api/machines", json=NEW)).json()["id"]
    assert (await patron.get(f"/api/machines/{machine_id}")).json()["ustas"] == []
    for role in (Role.worker, Role.technician):
        res = await (await client_as(await make_user(role))).post("/api/machines", json={**NEW, "code": "Z1"})
        assert res.status_code == 403, role


async def test_archived_machine_leaves_lists_but_keeps_its_page(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    usta, other_usta = await make_user(Role.usta), await make_user(Role.usta)
    machine = await make_machine(ustas=[usta])
    for role in (Role.worker, Role.technician):
        res = await (await client_as(await make_user(role))).post(f"/api/machines/{machine.id}/archive")
        assert res.status_code == 403, role
    assert (await (await client_as(other_usta)).post(f"/api/machines/{machine.id}/archive")).status_code == 403

    c = await client_as(usta)
    assert (await c.post(f"/api/machines/{machine.id}/archive")).status_code == 204
    assert (await c.get("/api/me/machines")).json() == []
    assert (await c.get(f"/api/ustas/{usta.id}")).json()["machines"] == []
    assert (await c.get(f"/api/machines/lookup?code={machine.code}")).status_code == 404
    page = (await c.get(f"/api/machines/{machine.id}")).json()  # old links and history still open
    assert page["machine"]["id"] == machine.id and page["actions"]["archive"] is False
    assert (await c.post(f"/api/machines/{machine.id}/archive")).status_code == 404

    patron = await client_as(await make_user(Role.patron))
    assert (await patron.get("/api/admin/machines")).json()["machines"] == []
    other = await make_machine()
    assert (await patron.post(f"/api/machines/{other.id}/archive")).status_code == 204
