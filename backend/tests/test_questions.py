from collections.abc import Awaitable, Callable

from app.ai.protocol import AnswerDraft
from app.auth.models import Role, User
from app.context import AppContext
from app.machines.models import Machine
from tests.conftest import ClientAs
from tests.fakes import FakeAI

MakeUser = Callable[..., Awaitable[User]]
MakeMachine = Callable[..., Awaitable[Machine]]


async def test_worker_asks_usta_who_answers_and_worker_sees_it(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext
) -> None:
    """KAN-62/63 end to end: question in Arabic → usta inbox in Turkish → answer → worker sees it in Arabic."""
    usta = await make_user(Role.usta, name="Mehmet Usta")
    other_usta = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta])
    worker_user = await make_user(name="Yusuf", language="ar")
    worker, usta_c, other_c = await client_as(worker_user), await client_as(usta), await client_as(other_usta)

    sent = await worker.post(f"/api/machines/{machine.id}/questions", json={"question": "  كيف أغير القطب؟  "})
    assert sent.status_code == 200
    qid = sent.json()["id"]
    assert sent.json() == {"id": qid, "status": "open", "recipients": [{"id": usta.id, "name": "Mehmet Usta"}]}
    await ctx.jobs.drain()  # translations

    alerts = (await usta_c.get("/api/alerts")).json()
    assert alerts["unread_count"] == 1
    assert alerts["items"][0]["path"] == f"/usta/questions/{qid}"
    assert (await other_c.get("/api/alerts")).json()["unread_count"] == 0

    inbox = (await usta_c.get("/api/me/inbox")).json()
    assert [q["id"] for q in inbox] == [qid]
    assert inbox[0]["question"] == {"text": "[tr] كيف أغير القطب؟", "lang": "tr", "dir": "ltr"}
    assert inbox[0]["original_question"] == {"text": "كيف أغير القطب؟", "lang": "ar", "dir": "rtl"}
    assert inbox[0]["worker_name"] == "Yusuf" and inbox[0]["worker_language_name"] == "العربية"
    assert (await other_c.get("/api/me/inbox")).json() == []
    assert (await usta_c.get(f"/api/questions/{qid}")).json()["id"] == qid
    assert (await other_c.get(f"/api/questions/{qid}")).status_code == 404

    mine = (await worker.get("/api/me/questions")).json()
    assert mine[0]["status"] == "open" and mine[0]["answer"] is None and mine[0]["usta"] is None

    answered = await usta_c.post(f"/api/questions/{qid}/answer", data={"text": "Önce enerjiyi kesin."})
    assert answered.status_code == 200 and answered.json() == {"id": qid, "status": "answered"}
    await ctx.jobs.drain()

    mine = (await worker.get("/api/me/questions")).json()
    assert mine[0]["status"] == "answered"
    assert mine[0]["answer"] == {"text": "[ar] Önce enerjiyi kesin.", "lang": "ar", "dir": "rtl"}
    assert mine[0]["usta"] == {"id": usta.id, "name": "Mehmet Usta"}
    worker_alerts = (await worker.get("/api/alerts")).json()
    assert worker_alerts["items"][0]["path"] == "/my-questions"
    assert "Mehmet Usta sorunu cevapladı" in worker_alerts["items"][0]["text"]
    assert (await usta_c.get("/api/me/inbox")).json() == []
    assert (await usta_c.get(f"/api/questions/{qid}")).status_code == 404  # answered: gone from the inbox

    page = (await worker.get(f"/api/machines/{machine.id}")).json()
    qa = page["questions"][0]
    assert qa["question"]["text"] == "كيف أغير القطب؟" and qa["original_question"] is None
    assert qa["answer"]["lang"] == "ar" and qa["original_answer"]["text"] == "Önce enerjiyi kesin."
    assert qa["usta"]["name"] == "Mehmet Usta"


async def test_answer_needs_content_and_can_carry_a_file(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    usta = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta])
    worker = await client_as(await make_user())
    qid = (await worker.post(f"/api/machines/{machine.id}/questions", json={"question": "Basınç kaç bar?"})).json()[
        "id"
    ]
    usta_c = await client_as(usta)
    empty = await usta_c.post(f"/api/questions/{qid}/answer", data={"text": "  "})
    assert empty.status_code == 422 and empty.json() == {"detail": "Bir cevap yazın veya video/dosya ekleyin."}
    res = await usta_c.post(
        f"/api/questions/{qid}/answer", files={"file": ("ayar.pdf", b"%PDF-1.4", "application/pdf")}
    )
    assert res.status_code == 200
    mine = (await worker.get("/api/me/questions")).json()[0]
    assert mine["answer"] is None and mine["answer_file_url"] == f"/uploads/answers/{qid}/ayar.pdf"
    assert (await worker.get(mine["answer_file_url"])).content == b"%PDF-1.4"


async def test_machine_without_ustas_goes_to_the_patron(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    patron = await make_user(Role.patron, name="Patron")
    machine = await make_machine()
    sent = await (await client_as(await make_user())).post(
        f"/api/machines/{machine.id}/questions", json={"question": "Kim bakıyor?"}
    )
    assert sent.json()["recipients"] == [{"id": patron.id, "name": "Patron"}]
    assert len((await (await client_as(patron)).get("/api/me/inbox")).json()) == 1


async def test_patron_sees_and_answers_every_question(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    usta, patron = await make_user(Role.usta), await make_user(Role.patron, name="Patron")
    machine = await make_machine(ustas=[usta])
    worker = await client_as(await make_user())
    qid = (await worker.post(f"/api/machines/{machine.id}/questions", json={"question": "Yağ ne zaman?"})).json()["id"]
    p = await client_as(patron)
    assert [q["id"] for q in (await p.get("/api/me/inbox")).json()] == [qid]  # though the machine has an usta
    assert (await p.post(f"/api/questions/{qid}/answer", data={"text": "Her ay."})).status_code == 200
    profile = (await p.get(f"/api/ustas/{patron.id}")).json()  # the patron's "Sorular" page
    assert [q["id"] for q in profile["answered"]] == [qid]
    assert (await (await client_as(await make_user())).get(f"/api/ustas/{(await make_user()).id}")).status_code == 404


async def test_question_validation(client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine) -> None:
    machine = await make_machine()
    c = await client_as(await make_user())
    assert (await c.post(f"/api/machines/{machine.id}/questions", json={"question": " "})).status_code == 422
    assert (await c.post("/api/machines/999999/questions", json={"question": "Merhaba"})).status_code == 404


async def test_usta_profile(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext
) -> None:
    usta = await make_user(Role.usta, name="Hasan Usta")
    machine = await make_machine(ustas=[usta])
    worker = await client_as(await make_user())
    qid = (await worker.post(f"/api/machines/{machine.id}/questions", json={"question": "Yağ ne zaman?"})).json()["id"]
    await (await client_as(usta)).post(f"/api/questions/{qid}/answer", data={"text": "Haftada bir."})
    await ctx.jobs.drain()
    profile = (await worker.get(f"/api/ustas/{usta.id}")).json()
    assert profile["name"] == "Hasan Usta"
    assert profile["machines"] == [{"id": machine.id, "code": machine.code, "name": machine.name}]
    assert [q["id"] for q in profile["answered"]] == [qid]
    worker_id = (await worker.get("/api/auth/me")).json()["id"]
    assert (await worker.get(f"/api/ustas/{worker_id}")).status_code == 404


async def test_alert_mark_read(client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine) -> None:
    usta = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta])
    await (await client_as(await make_user())).post(
        f"/api/machines/{machine.id}/questions", json={"question": "Soru 1"}
    )
    usta_c = await client_as(usta)
    alert_id = (await usta_c.get("/api/alerts")).json()["items"][0]["id"]
    after = (await usta_c.post(f"/api/alerts/{alert_id}/read")).json()
    assert after["unread_count"] == 0 and after["items"][0]["read"] is True


# ---- Makineye sor (KAN-60) ----


async def _answered_question(client_as: ClientAs, make_user: MakeUser, machine: Machine, usta: User) -> int:
    worker = await client_as(await make_user())
    q = "Elektrot nasıl değiştirilir?"
    qid: int = (await worker.post(f"/api/machines/{machine.id}/questions", json={"question": q})).json()["id"]
    await (await client_as(usta)).post(f"/api/questions/{qid}/answer", data={"text": "Enerjiyi kesip elektrotu sökün."})
    return qid


async def test_ask_answers_from_an_earlier_usta_answer_with_its_source(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext
) -> None:
    usta = await make_user(Role.usta, name="Mehmet Usta")
    machine = await make_machine(ustas=[usta])
    qid = await _answered_question(client_as, make_user, machine, usta)
    await ctx.jobs.drain()  # indexes the answer
    c = await client_as(await make_user(language="en"))
    res = (await c.post(f"/api/machines/{machine.id}/ask", json={"question": "Elektrot nasıl değiştirilir?"})).json()
    assert res["status"] == "answered"
    assert res["answer"]["lang"] == "en" and res["answer"]["text"].startswith("[en] ")
    assert res["sources"] == [
        {
            "kind": "usta_answer",
            "question_id": qid,
            "usta_name": "Mehmet Usta",
            "answered_at": res["sources"][0]["answered_at"],
        }
    ]


async def test_ask_unrelated_question_is_not_found_with_ustas(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext
) -> None:
    usta = await make_user(Role.usta, name="Mehmet Usta")
    machine = await make_machine(ustas=[usta])
    await _answered_question(client_as, make_user, machine, usta)
    await ctx.jobs.drain()
    c = await client_as(await make_user())
    res = (
        await c.post(f"/api/machines/{machine.id}/ask", json={"question": "Kantinde öğle yemeği saat kaçta?"})
    ).json()
    assert res == {"status": "not_found", "ustas": [{"id": usta.id, "name": "Mehmet Usta"}]}


async def test_ask_never_trusts_an_answer_without_valid_sources(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, ai: FakeAI
) -> None:
    usta = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta])
    await _answered_question(client_as, make_user, machine, usta)
    await ctx.jobs.drain()
    c = await client_as(await make_user())
    question = {"question": "Elektrot nasıl değiştirilir?"}
    for draft in (
        AnswerDraft(found=False),
        AnswerDraft(found=True, answer="Uydurma cevap", source_ids=[]),
        AnswerDraft(found=True, answer="Uydurma cevap", source_ids=[7]),  # not one of the given sources
    ):
        ai.draft = draft
        res = (await c.post(f"/api/machines/{machine.id}/ask", json=question)).json()
        assert res["status"] == "not_found", draft
    ai.draft = None
    ai.fail.add("embed")  # AI down → not found, never an error page
    assert (await c.post(f"/api/machines/{machine.id}/ask", json=question)).json()["status"] == "not_found"


async def test_ask_on_machine_with_no_knowledge(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    machine = await make_machine()
    c = await client_as(await make_user())
    assert (await c.post(f"/api/machines/{machine.id}/ask", json={"question": "Nasıl çalışır?"})).json() == {
        "status": "not_found",
        "ustas": [],
    }


async def test_nobody_gets_or_answers_their_own_question(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    mehmet, hasan = await make_user(Role.usta, name="Mehmet Usta"), await make_user(Role.usta, name="Hasan Usta")
    machine = await make_machine(ustas=[mehmet, hasan])
    c = await client_as(mehmet)
    not_found = (await c.post(f"/api/machines/{machine.id}/ask", json={"question": "Kantin kaçta?"})).json()
    assert not_found["ustas"] == [{"id": hasan.id, "name": "Hasan Usta"}]  # "Ustaya sor" never offers yourself
    sent = (await c.post(f"/api/machines/{machine.id}/questions", json={"question": "Zincir gerginliği?"})).json()
    assert sent["recipients"] == [{"id": hasan.id, "name": "Hasan Usta"}]
    assert (await c.get("/api/me/inbox")).json() == []
    assert (await c.get(f"/api/questions/{sent['id']}")).status_code == 404
    assert (await c.post(f"/api/questions/{sent['id']}/answer", data={"text": "x"})).status_code == 404
    assert [q["id"] for q in (await (await client_as(hasan)).get("/api/me/inbox")).json()] == [sent["id"]]
    assert (await (await client_as(mehmet)).get("/api/alerts")).json()["unread_count"] == 0


async def test_only_usta_asking_goes_to_the_patron_or_is_refused(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine
) -> None:
    usta = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta])
    c = await client_as(usta)
    question = {"question": "Yağ ne zaman?"}
    refused = await c.post(f"/api/machines/{machine.id}/questions", json=question)  # no patron yet: nobody else
    assert refused.status_code == 409 and refused.json()["detail"] == "Bu soruyu cevaplayabilecek başka bir usta yok."
    assert (await c.get("/api/me/questions")).json() == []  # nothing saved
    patron = await make_user(Role.patron, name="Patron")
    sent = (await c.post(f"/api/machines/{machine.id}/questions", json=question)).json()
    assert sent["recipients"] == [{"id": patron.id, "name": "Patron"}]
    p = await client_as(patron)  # the patron asking on a machine without ustas reaches nobody but themselves
    lone = await make_machine()
    assert (await p.post(f"/api/machines/{lone.id}/questions", json=question)).status_code == 409
