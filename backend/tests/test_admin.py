from collections.abc import Awaitable, Callable
from io import BytesIO

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from starlette.datastructures import Headers, UploadFile
from starlette.requests import Request

from app.admin.views import MachineAdmin
from app.auth.deps import SESSION_COOKIE
from app.auth.models import Role, User
from app.core import storage
from app.machines.models import Machine
from tests.conftest import ClientAs

MakeUser = Callable[..., Awaitable[User]]
MakeMachine = Callable[..., Awaitable[Machine]]


async def test_admin_machines_stats_and_search(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    usta = await make_user(Role.usta, name="Hasan Usta")
    await make_machine(ustas=[usta], name="Plazma Kesim")
    await make_machine(name="Forklift 3")
    patron = await client_as(await make_user(Role.patron))
    data = (await patron.get("/api/admin/machines")).json()
    assert data["stats"] == {
        "machines": 2,
        "videos": 0,
        "documents": 0,
        "answered_questions": 0,
        "maintenance_records": 0,
    }
    assert [m["name"] for m in data["machines"]] == ["Forklift 3", "Plazma Kesim"]
    plazma = data["machines"][1]
    assert plazma["ustas"] == [{"id": usta.id, "name": "Hasan Usta"}]
    assert plazma["last_maintenance"] is None and plazma["video_count"] == 0
    found = (await patron.get("/api/admin/machines?q=fork")).json()["machines"]
    assert [m["name"] for m in found] == ["Forklift 3"]
    assert (await patron.get("/api/admin/machines?q=100%")).json()["machines"] == []  # % is literal


async def test_admin_users_lists_roles_and_machines(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    usta = await make_user(Role.usta, name="Ali Usta")
    machine = await make_machine(ustas=[usta])
    patron_user = await make_user(Role.patron, name="Patron")
    users = (await (await client_as(patron_user)).get("/api/admin/users")).json()
    ali = next(u for u in users if u["id"] == usta.id)
    assert ali == {
        "id": usta.id, "name": "Ali Usta", "role": "usta", "authorized": False, "authorization_note": None,
        "authorization_document_url": None, "machines": [{"id": machine.id, "name": machine.name}],
    }  # fmt: skip
    assert (await (await client_as(usta)).get("/api/admin/users")).status_code == 403


async def test_sqladmin_lets_only_patrons_in(app: FastAPI, client_as: ClientAs, make_user: MakeUser) -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as anon:
        assert (await anon.get("/admin/machine/list")).status_code in (302, 303, 307)
    worker = await client_as(await make_user())
    assert (await worker.get("/admin/machine/list")).status_code in (302, 303, 307)
    patron = await client_as(await make_user(Role.patron))
    res = await patron.get("/admin/machine/list")
    assert res.status_code == 200 and "Makineler" in res.text


async def test_sqladmin_login_form_accepts_only_patrons(app: FastAPI, make_user: MakeUser) -> None:
    worker, patron = await make_user(), await make_user(Role.patron)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        bad = await c.post("/admin/login", data={"username": worker.login, "password": "gizli-sifre"})
        assert bad.status_code == 400
        ok = await c.post("/admin/login", data={"username": patron.login, "password": "gizli-sifre"})
        assert ok.status_code in (302, 303)
        assert (await c.get("/admin/machine/list")).status_code == 200
        assert SESSION_COOKIE not in c.cookies  # SQLAdmin keeps its own signed session


async def test_machine_photo_upload_in_sqladmin_is_stored() -> None:
    view = MachineAdmin()
    file = UploadFile(
        BytesIO(b"\xff\xd8jpeg"), filename="foto.jpg", size=6, headers=Headers({"content-type": "image/jpeg"})
    )
    data: dict[str, object] = {"name": "X", "photo": file}
    await view.on_model_change(data, Machine(), True, Request({"type": "http"}))
    assert isinstance(data["photo"], str) and data["photo"].startswith("machines/")
    assert storage.abs_path(data["photo"]).read_bytes() == b"\xff\xd8jpeg"
    empty = UploadFile(BytesIO(b""), filename="", size=0)
    kept: dict[str, object] = {"name": "X", "photo": empty}
    await view.on_model_change(kept, Machine(), False, Request({"type": "http"}))
    assert "photo" not in kept  # no new file: the current photo stays


async def test_uploads_need_login_and_stay_inside_the_folder(
    client: AsyncClient, client_as: ClientAs, make_user: MakeUser
) -> None:
    path = storage.abs_path("test/hello.txt")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("merhaba")
    assert (await client.get("/uploads/test/hello.txt")).status_code == 401
    c = await client_as(await make_user())
    res = await c.get("/uploads/test/hello.txt")
    assert res.status_code == 200 and res.text == "merhaba"
    assert (await c.get("/uploads/test/yok.txt")).status_code == 404
    assert (await c.get("/uploads/..%2f..%2fetc%2fpasswd")).status_code == 404
