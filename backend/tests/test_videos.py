import asyncio
from collections.abc import Awaitable, Callable
from pathlib import Path

from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User
from app.context import AppContext
from app.core import storage
from app.machines.models import Machine
from app.main import resume
from app.videos.models import StepStatus, VideoStep
from app.videos.service import VideoProcessing, load_steps
from tests.conftest import ClientAs
from tests.fakes import FakeAI

MakeUser = Callable[..., Awaitable[User]]
MakeMachine = Callable[..., Awaitable[Machine]]


async def _upload(c: AsyncClient, machine_id: int, clip: Path, title: str = "Meme değişimi") -> VideoProcessing:
    res = await c.post(
        f"/api/machines/{machine_id}/videos",
        data={"title": title},
        files={"file": ("kayit.mp4", await asyncio.to_thread(clip.read_bytes), "video/mp4")},
    )
    assert res.status_code == 200, res.text
    return VideoProcessing.model_validate(res.json())


async def test_usta_uploads_video_and_it_becomes_playable_with_subtitles(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path
) -> None:
    usta_user = await make_user(Role.usta, name="Mehmet Usta")
    machine = await make_machine(ustas=[usta_user])
    usta = await client_as(usta_user)
    started = await _upload(usta, machine.id, sample_video)
    assert started.status == "processing"
    assert [s.key for s in started.steps] == ["upload", "transcode", "transcribe", "index"]
    await ctx.jobs.drain()

    vid = started.id
    done = (await usta.get(f"/api/videos/{vid}/processing")).json()
    assert done["status"] == "ready" and all(s["status"] == "done" for s in done["steps"])
    assert (await usta.get("/api/alerts")).json()["items"][0]["path"] == f"/videos/{vid}"

    detail = (await usta.get(f"/api/videos/{vid}")).json()
    assert detail["duration_sec"] == 3 and detail["author_name"] == "Mehmet Usta"
    original = detail["tracks"][0]
    assert original["is_original"] and original["language"] == "tr" and original["subtitles"] == "ready"
    assert original["stream_url"] == f"/uploads/videos/{vid}/stream.mp4"
    assert [t["language"] for t in detail["tracks"]] == ["tr", "en", "ar"]
    assert detail["default_audio_language"] == "tr" and detail["default_subtitle_language"] == "tr"
    assert [s["text"] for s in detail["transcript"]] == [
        "Önce makineyi kapatın.",
        "Sonra elektrotu yenisiyle değiştirin.",
    ]
    vtt = (await usta.get(original["subtitle_url"])).text
    assert vtt.startswith("WEBVTT") and "00:00:01.000 --> 00:00:02.500" in vtt
    stream = await usta.get(original["stream_url"], headers={"Range": "bytes=0-99"})
    assert stream.status_code == 206 and len(stream.content) == 100  # seeking works

    page = (await usta.get(f"/api/machines/{machine.id}")).json()
    assert page["videos"][0]["availability"] == "original" and page["videos"][0]["thumbnail_url"]
    english = await client_as(await make_user(language="en"))
    assert (await english.get(f"/api/machines/{machine.id}")).json()["videos"][0]["availability"] == "on_demand"
    ask = (
        await english.post(
            f"/api/machines/{machine.id}/ask", json={"question": "Elektrotu yenisiyle nasıl değiştirin?"}
        )
    ).json()
    assert ask["status"] == "answered" and ask["sources"][0]["kind"] == "video" and ask["sources"][0]["video_id"] == vid


async def test_language_prepared_on_demand_once_then_dubbed(
    client_as: ClientAs,
    make_user: MakeUser,
    make_machine: MakeMachine,
    ctx: AppContext,
    sample_video: Path,
    db: AsyncSession,
) -> None:
    """KAN-55: the first viewer starts it, everyone gets it, it is never prepared twice."""
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    vid = (await _upload(await client_as(usta_user), machine.id, sample_video)).id
    await ctx.jobs.drain()
    arabic = await client_as(await make_user(language="ar"))

    prep = (await arabic.post(f"/api/videos/{vid}/languages/ar")).json()
    assert prep["language_name"] == "العربية"
    assert [s["key"] for s in prep["steps"]] == ["translate", "subtitles", "audio", "dub", "mix"]
    again = (await arabic.post(f"/api/videos/{vid}/languages/ar")).json()
    assert [s["key"] for s in again["steps"]] == [s["key"] for s in prep["steps"]]
    await ctx.jobs.drain()
    steps = await db.scalars(select(VideoStep).where(VideoStep.video_id == vid, VideoStep.pipeline == "ar"))
    assert len(list(steps)) == 5  # not duplicated

    detail = (await arabic.get(f"/api/videos/{vid}")).json()
    ar = next(t for t in detail["tracks"] if t["language"] == "ar")
    assert ar["subtitles"] == "ready" and ar["audio"] == "ready" and ar["dir"] == "rtl"
    assert ar["stream_url"] == f"/uploads/videos/{vid}/ar.mp4"
    assert storage.abs_path(f"videos/{vid}/ar.mp4").stat().st_size > 0
    assert detail["default_audio_language"] == "ar" and detail["default_subtitle_language"] == "ar"
    assert detail["transcript_language"] == "ar" and detail["transcript"][0]["text"] == "[ar] Önce makineyi kapatın."
    assert detail["preparation"] is None
    page = (await arabic.get(f"/api/machines/{machine.id}")).json()
    assert page["videos"][0]["availability"] == "dubbed"
    assert "artık العربية hazır" in (await arabic.get("/api/alerts")).json()["items"][0]["text"]


async def test_failed_step_shows_and_retry_resumes_there(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path, ai: FakeAI
) -> None:
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    vid = (await _upload(await client_as(usta_user), machine.id, sample_video)).id
    await ctx.jobs.drain()
    english = await client_as(await make_user(language="en"))
    ai.fail.add("speak")
    await english.post(f"/api/videos/{vid}/languages/en")
    await ctx.jobs.drain()

    detail = (await english.get(f"/api/videos/{vid}")).json()
    statuses = {s["key"]: s["status"] for s in detail["preparation"]["steps"]}
    assert statuses == {"translate": "done", "subtitles": "done", "audio": "done", "dub": "failed", "mix": "waiting"}
    en = next(t for t in detail["tracks"] if t["language"] == "en")
    assert en["subtitles"] == "ready" and en["audio"] == "failed"
    assert (await english.get(f"/api/machines/{machine.id}")).json()["videos"][0]["availability"] == "subtitles"
    assert (await english.post(f"/api/videos/{vid}/languages/en/steps/mix/retry")).status_code == 409

    ai.fail.clear()
    retried = (await english.post(f"/api/videos/{vid}/languages/en/steps/dub/retry")).json()
    assert {s["key"]: s["status"] for s in retried["steps"]}["dub"] == "waiting"
    await ctx.jobs.drain()
    en = next(t for t in (await english.get(f"/api/videos/{vid}")).json()["tracks"] if t["language"] == "en")
    assert en["audio"] == "ready"
    assert ai.calls.count("translate") == 1  # the retry did not redo finished steps


async def test_without_ai_video_still_plays(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path, ai: FakeAI
) -> None:
    ai.fail.add("transcribe")
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    usta = await client_as(usta_user)
    vid = (await _upload(usta, machine.id, sample_video)).id
    await ctx.jobs.drain()
    proc = (await usta.get(f"/api/videos/{vid}/processing")).json()
    assert proc["status"] == "ready"
    assert {s["key"]: s["status"] for s in proc["steps"]}["transcribe"] == "failed"
    detail = (await usta.get(f"/api/videos/{vid}")).json()
    assert detail["tracks"][0]["stream_url"] and detail["tracks"][0]["subtitles"] == "failed"
    res = await (await client_as(await make_user(language="en"))).post(f"/api/videos/{vid}/languages/en")
    assert res.status_code == 409 and res.json() == {"detail": "Videonun konuşma metni henüz hazır değil."}


async def test_upload_rules(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, sample_video: Path
) -> None:
    machine = await make_machine(ustas=[await make_user(Role.usta)])
    other_usta = await client_as(await make_user(Role.usta))
    res = await other_usta.post(
        f"/api/machines/{machine.id}/videos", data={"title": "x"}, files={"file": ("k.mp4", b"x", "video/mp4")}
    )
    assert res.status_code == 403
    patron = await client_as(await make_user(Role.patron))
    not_video = await patron.post(
        f"/api/machines/{machine.id}/videos", data={"title": "x"}, files={"file": ("k.pdf", b"%PDF", "application/pdf")}
    )
    assert not_video.status_code == 422 and not_video.json() == {"detail": "Lütfen bir video dosyası seçin."}
    assert (await patron.get("/api/videos/999999")).status_code == 404


async def test_broken_video_fails_cleanly(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext
) -> None:
    machine = await make_machine()
    patron = await client_as(await make_user(Role.patron))
    res = await patron.post(
        f"/api/machines/{machine.id}/videos",
        data={"title": "Bozuk"},
        files={"file": ("b.mp4", b"not a video", "video/mp4")},
    )
    vid = res.json()["id"]
    await ctx.jobs.drain()
    proc = (await patron.get(f"/api/videos/{vid}/processing")).json()
    assert proc["status"] == "failed"
    assert (await patron.get(f"/api/machines/{machine.id}")).json()["videos"] == []  # failed videos are hidden


async def test_restart_resumes_unfinished_steps(
    client_as: ClientAs,
    make_user: MakeUser,
    make_machine: MakeMachine,
    ctx: AppContext,
    sample_video: Path,
    db: AsyncSession,
) -> None:
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    vid = (await _upload(await client_as(usta_user), machine.id, sample_video)).id
    await ctx.jobs.drain()
    # Simulate a server stopped in the middle of indexing.
    await db.execute(
        update(VideoStep).where(VideoStep.video_id == vid, VideoStep.key == "index").values(status=StepStatus.running)
    )
    await db.commit()
    await resume(ctx)
    await ctx.jobs.drain()
    async with ctx.sessionmaker() as fresh:
        steps = (await load_steps(fresh, [vid]))[vid]["upload"]
    assert all(s.status == StepStatus.done for s in steps)
