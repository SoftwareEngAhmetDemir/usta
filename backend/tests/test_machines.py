from collections.abc import Awaitable, Callable

from httpx import AsyncClient

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
    missing = await c.get("/api/machines/lookup?code=YOK-1")
    assert missing.status_code == 404 and missing.json() == {"detail": "Bu kodla makine bulunamadı."}


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
        Role.worker: (True, False, False, False),
        Role.technician: (True, False, False, True),
        Role.patron: (True, True, True, True),
    }
    for role, flags in expected.items():
        page = (await (await client_as(await make_user(role))).get(f"/api/machines/{machine.id}")).json()
        assert tuple(page["actions"].values()) == flags, role
    assert (await (await client_as(my_usta)).get(f"/api/machines/{machine.id}")).json()["actions"]["record_video"]
    assert not (await (await client_as(other_usta)).get(f"/api/machines/{machine.id}")).json()["actions"][
        "record_video"
    ]


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
    worker = await client_as(await make_user())
    assert (await worker.get(f"/api/machines/{machine.id}/qr.svg")).status_code == 403
    assert (await worker.get("/api/admin/qr-stickers.pdf")).status_code == 403
