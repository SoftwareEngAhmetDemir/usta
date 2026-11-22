import re
from collections.abc import Awaitable, Callable
from io import BytesIO

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from starlette.datastructures import Headers, UploadFile
from starlette.requests import Request

from app.admin.views import ExternalVideoAdmin, MachineAdmin
from app.auth.deps import SESSION_COOKIE
from app.auth.models import Role, User
from app.core import storage
from app.machines.models import ExternalSource, ExternalVideo, Machine
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


async def _can_log_in(app: FastAPI, login: str, password: str) -> bool:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        return (await c.post("/api/auth/login", json={"login": login, "password": password})).status_code == 200


async def test_patron_resets_a_password_in_sqladmin(app: FastAPI, client_as: ClientAs, make_user: MakeUser) -> None:
    patron = await client_as(await make_user(Role.patron))
    worker = await make_user()
    edit = f"/admin/user/edit/{worker.id}"
    form = {"name": worker.name, "role": "worker", "language": "tr", "authorization_note": ""}
    field = re.search(r"<input[^>]*name=\"new_password\"[^>]*>", (await patron.get(edit)).text)
    assert field and "required" not in field.group(0)  # saving other fields must not need a new password
    assert (await patron.post(edit, data={**form, "new_password": ""})).status_code in (302, 303)
    assert await _can_log_in(app, worker.login, "gizli-sifre")  # empty field keeps the password
    assert (await patron.post(edit, data={**form, "new_password": "kisa"})).status_code == 400
    assert await _can_log_in(app, worker.login, "gizli-sifre")
    assert (await patron.post(edit, data={**form, "new_password": "yeni-sifre-1"})).status_code in (302, 303)
    assert await _can_log_in(app, worker.login, "yeni-sifre-1")
    assert not await _can_log_in(app, worker.login, "gizli-sifre")
    details = await patron.get(f"/admin/user/details/{worker.id}")
    assert details.status_code == 200 and "scrypt$" not in details.text  # the hash is never shown


async def test_maintenance_records_are_read_only_in_sqladmin(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    tech, patron_user = await make_user(Role.technician), await make_user(Role.patron)
    machine = await make_machine()
    rec = (
        await (await client_as(tech)).post(
            f"/api/machines/{machine.id}/maintenance",
            data={"description": "Yağ değişti", "opened_by_id": str(patron_user.id)},
        )
    ).json()
    patron = await client_as(patron_user)
    assert (await patron.get("/admin/maintenance-record/list")).status_code == 200
    assert (await patron.get(f"/admin/maintenance-record/details/{rec['id']}")).status_code == 200
    assert (await patron.get(f"/admin/maintenance-record/edit/{rec['id']}")).status_code == 403
    assert (await patron.delete(f"/admin/maintenance-record/delete?pks={rec['id']}")).status_code == 403


async def test_outside_video_link_in_sqladmin_must_be_http() -> None:
    view, req = ExternalVideoAdmin(), Request({"type": "http"})
    bad: dict[str, object] = {"title": "X", "url": "javascript:alert(1)"}
    with pytest.raises(ValueError, match="http"):
        await view.on_model_change(bad, ExternalVideo(), True, req)
    ok: dict[str, object] = {"title": "X", "url": "https://youtu.be/dQw4w9WgXcQ", "source": ExternalSource.manufacturer}
    await view.on_model_change(ok, ExternalVideo(), True, req)
    assert ok["embed_url"] == "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
