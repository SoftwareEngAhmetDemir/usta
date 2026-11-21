from collections.abc import Awaitable, Callable

from app.auth.models import Role, User
from app.machines.models import Machine
from tests.conftest import ClientAs

MakeUser = Callable[..., Awaitable[User]]
MakeMachine = Callable[..., Awaitable[Machine]]


async def test_technician_records_maintenance_with_photo(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    """KAN-39: doer and time come from the session; the record shows on the machine page, newest first."""
    usta = await make_user(Role.usta, name="Mehmet Usta")
    patron = await make_user(Role.patron, name="Patron")
    tech_user = await make_user(Role.technician, name="Emre K.")
    machine = await make_machine(ustas=[usta])
    tech = await client_as(tech_user)

    form = (await tech.get(f"/api/machines/{machine.id}/maintenance-form")).json()
    assert form["machine"]["code"] == machine.code
    assert form["openers"] == [{"id": usta.id, "name": "Mehmet Usta"}, {"id": patron.id, "name": "Patron"}]

    res = await tech.post(
        f"/api/machines/{machine.id}/maintenance",
        data={"description": "Meme ve elektrot değişti.", "opened_by_id": str(usta.id), "done_by_id": str(patron.id)},
        files={"attachment": ("foto.jpg", b"\xff\xd8jpeg", "image/jpeg")},
    )
    assert res.status_code == 200
    rec = res.json()
    assert rec["done_by"] == {
        "id": tech_user.id,
        "name": "Emre K.",
        "authorized": False,
        "authorization_document_url": None,
    }
    assert rec["opened_by"] == {"id": usta.id, "name": "Mehmet Usta"}
    assert rec["attachments"][0]["kind"] == "photo" and rec["attachments"][0]["url"].startswith("/uploads/maintenance/")

    page = (await tech.get(f"/api/machines/{machine.id}")).json()
    assert [r["id"] for r in page["maintenance"]] == [rec["id"]]
    assert [r["id"] for r in (await tech.get("/api/me/maintenance")).json()] == [rec["id"]]
    alerts = (await (await client_as(patron)).get("/api/alerts")).json()
    assert alerts["items"][0]["path"] == f"/m/{machine.id}"
    admin_row = (await (await client_as(patron)).get("/api/admin/machines")).json()["machines"][0]
    assert admin_row["last_maintenance"]["by_name"] == "Emre K."


async def test_maintenance_rules(client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine) -> None:
    usta = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta])
    worker = await client_as(await make_user())
    assert (await worker.get(f"/api/machines/{machine.id}/maintenance-form")).status_code == 403
    tech = await client_as(await make_user(Role.technician))
    stranger = await make_user()
    bad_opener = await tech.post(
        f"/api/machines/{machine.id}/maintenance", data={"description": "x", "opened_by_id": str(stranger.id)}
    )
    assert bad_opener.status_code == 422 and bad_opener.json() == {"detail": "İşi açan kişiyi listeden seçin."}
    bad_file = await tech.post(
        f"/api/machines/{machine.id}/maintenance",
        data={"description": "x", "opened_by_id": str(usta.id)},
        files={"attachment": ("notlar.txt", b"metin", "text/plain")},
    )
    assert bad_file.status_code == 422
