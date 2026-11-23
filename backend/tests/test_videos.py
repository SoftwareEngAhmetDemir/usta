import asyncio
import json
import subprocess
from collections.abc import Awaitable, Callable
from pathlib import Path

from httpx import AsyncClient
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Role, User
from app.context import AppContext
from app.core import storage
from app.jobs.models import Job, JobStatus
from app.machines.models import Machine
from app.search.models import Chunk
from app.videos.models import DubbedVersion, Snapshot, StepStatus, TopicSegment, TranscriptSegment, Video, VideoStep
from app.videos.service import VideoProcessing, load_steps
from tests.conftest import ClientAs
from tests.fakes import FakeAI

MakeUser = Callable[..., Awaitable[User]]
MakeMachine = Callable[..., Awaitable[Machine]]

UPLOAD_KEYS = ["upload", "transcode", "audio", "transcribe", "refine", "topics", "snapshots", "index"]


async def _upload(
    c: AsyncClient, machine_id: int, clip: Path, title: str = "Meme değişimi", **form: str
) -> VideoProcessing:
    res = await c.post(
        f"/api/machines/{machine_id}/videos",
        data={"title": title, **form},
        files={"file": ("kayit.mp4", await asyncio.to_thread(clip.read_bytes), "video/mp4")},
    )
    assert res.status_code == 200, res.text
    return VideoProcessing.model_validate(res.json())


def _audio_tracks(path: Path) -> list[str]:
    out = subprocess.run(  # noqa: S603
        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream_tags=language",  # noqa: S607
         "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout  # fmt: skip
    return [s.get("tags", {}).get("language", "") for s in json.loads(out)["streams"]]


def _max_volume_db(path: Path, track: int) -> float:
    """Loudest sample of one audio track, in dB (ffmpeg volumedetect; -91 = digital silence)."""
    err = subprocess.run(  # noqa: S603
        ["ffmpeg", "-v", "info", "-i", str(path), "-map", f"0:a:{track}", "-af", "volumedetect",  # noqa: S607
         "-f", "null", "-"],
        capture_output=True, text=True, check=True,
    ).stderr  # fmt: skip
    return float(err.split("max_volume:")[1].split("dB")[0])


async def test_upload_runs_every_step_and_the_video_becomes_searchable(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path,
    db: AsyncSession, ai: FakeAI,
) -> None:  # fmt: skip
    usta_user = await make_user(Role.usta, name="Mehmet Usta")
    machine = await make_machine(ustas=[usta_user])
    usta = await client_as(usta_user)
    started = await _upload(usta, machine.id, sample_video)
    assert started.status == "processing" and [s.key for s in started.steps] == UPLOAD_KEYS
    assert started.job_id is not None
    assert (await usta.get(f"/api/jobs/{started.job_id}")).json()["status"] == "queued"
    await ctx.jobs.drain(ctx)

    vid = started.id
    job = (await usta.get(f"/api/jobs/{started.job_id}")).json()
    assert job["status"] == "done" and job["progress"] == 100
    done = (await usta.get(f"/api/videos/{vid}/processing")).json()
    assert done["status"] == "ready" and all(s["status"] == "done" for s in done["steps"])
    assert (await usta.get("/api/alerts")).json()["items"][0]["path"] == f"/videos/{vid}"
    assert ai.transcriber.hints == [None]  # no hint given: Whisper detects the language

    # Sentence timeline with confidence, words and speaking rate
    rows = list(await db.scalars(select(TranscriptSegment).where(TranscriptSegment.video_id == vid)))
    assert [r.text for r in rows] == ["Önce makineyi kapatın.", "Sonra elektrotu yenisiyle değiştirin."]
    assert rows[0].avg_logprob == -0.2 and len(rows[0].words or []) == 3
    assert rows[0].word_count == 3 and rows[0].words_per_sec == 2.5 and rows[0].pause_after == 0.2
    video = await db.get(Video, vid)
    assert video is not None and video.speaking_rate and video.speaking_rate["median_words_per_sec"] == 2.5
    assert storage.abs_path(f"videos/{vid}/transcript.txt").read_text(encoding="utf-8").splitlines() == [
        "0:00  Önce makineyi kapatın.",
        "0:01  Sonra elektrotu yenisiyle değiştirin.",
    ]
    srt = storage.abs_path(f"videos/{vid}/tr.srt").read_text(encoding="utf-8")
    assert srt.startswith("1\n00:00:00,000 --> 00:00:01,200\nÖnce makineyi kapatın.")
    assert not storage.abs_path(f"videos/{vid}/audio16k.wav").exists()  # temporary audio removed

    # One topic (the clip is shorter than the minimum topic length), with snapshots, as one search chunk
    topics = list(await db.scalars(select(TopicSegment).where(TopicSegment.video_id == vid)))
    assert len(topics) == 1 and topics[0].start_sec == 0.0 and topics[0].end_sec == 3.0
    shots = list(await db.scalars(select(Snapshot).where(Snapshot.video_id == vid)))
    assert shots and all(storage.abs_path(s.path).stat().st_size > 0 for s in shots)
    chunk = await db.scalar(select(Chunk).where(Chunk.video_id == vid))
    assert chunk is not None and chunk.machine_id == machine.id and chunk.source_type == "video"
    assert (chunk.start_sec, chunk.end_sec, chunk.language, chunk.title) == (0.0, 3.0, "tr", "Meme değişimi")
    assert chunk.snapshot_paths == [s.path for s in shots] and chunk.embedding_model_version == "fake-trigram-v1"

    detail = (await usta.get(f"/api/videos/{vid}")).json()
    original = detail["tracks"][0]
    assert original["is_original"] and original["language"] == "tr" and original["subtitles"] == "ready"
    vtt = (await usta.get(original["subtitle_url"])).text
    assert vtt.startswith("WEBVTT") and "00:00:01.400 --> 00:00:03.000" in vtt
    stream = await usta.get(original["stream_url"], headers={"Range": "bytes=0-99"})
    assert stream.status_code == 206 and len(stream.content) == 100  # seeking works

    english = await client_as(await make_user(language="en"))
    ask = (
        await english.post(f"/api/machines/{machine.id}/ask", json={"question": "Elektrotu nasıl değiştirin?"})
    ).json()
    assert ask["status"] == "answered"
    source = ask["sources"][0]
    assert source["kind"] == "video" and source["video_id"] == vid and source["timestamp_label"] == "0:00"
    assert source["start_sec"] == 0 and source["end_sec"] == 3 and source["snapshot_urls"][0].startswith("/uploads/")


async def test_language_hint_is_passed_to_whisper(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path, ai: FakeAI
) -> None:
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    usta = await client_as(usta_user)
    await _upload(usta, machine.id, sample_video, language="ar")
    await ctx.jobs.drain(ctx)
    assert ai.transcriber.hints == ["ar"]
    bad = await usta.post(
        f"/api/machines/{machine.id}/videos", data={"title": "x", "language": "xx"},
        files={"file": ("k.mp4", b"x", "video/mp4")},
    )  # fmt: skip
    assert bad.status_code == 422


async def test_language_prepared_on_demand_once_then_dubbed_with_both_tracks(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path,
    db: AsyncSession, ai: FakeAI,
) -> None:  # fmt: skip
    """KAN-55: the first viewer starts it, everyone gets it, it is never prepared twice."""
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    vid = (await _upload(await client_as(usta_user), machine.id, sample_video)).id
    await ctx.jobs.drain(ctx)
    arabic = await client_as(await make_user(language="ar"))
    before = (await arabic.get(f"/api/videos/{vid}")).json()  # the site language is the default before it is prepared
    assert before["default_subtitle_language"] == "ar" and before["default_audio_language"] == "ar"
    assert next(t for t in before["tracks"] if t["language"] == "ar")["subtitles"] == "none"

    prep = (await arabic.post(f"/api/videos/{vid}/languages/ar")).json()
    assert prep["language_name"] == "العربية"
    assert [s["key"] for s in prep["steps"]] == ["translate", "subtitles", "voice", "mix"]
    again = (await arabic.post(f"/api/videos/{vid}/languages/ar")).json()
    assert [s["key"] for s in again["steps"]] == [s["key"] for s in prep["steps"]]
    await ctx.jobs.drain(ctx)
    assert await db.scalar(select(func.count()).where(VideoStep.video_id == vid, VideoStep.pipeline == "ar")) == 4
    assert ai.tts.calls == 2  # one clip per sentence

    detail = (await arabic.get(f"/api/videos/{vid}")).json()
    ar = next(t for t in detail["tracks"] if t["language"] == "ar")
    assert ar["subtitles"] == "ready" and ar["audio"] == "ready" and ar["dir"] == "rtl"
    assert ar["stream_url"] == f"/uploads/videos/{vid}/ar.mp4"
    dubbed = storage.abs_path(f"videos/{vid}/ar.mp4")
    assert _audio_tracks(dubbed) == ["ara", "tur"]  # dub first, original kept
    assert _max_volume_db(dubbed, 0) < -60 < _max_volume_db(dubbed, 1)  # no original sound under the (silent) dub
    assert storage.abs_path(f"videos/{vid}/ar.srt").read_text(encoding="utf-8").count("[ar] ") == 2
    dub = await db.scalar(select(DubbedVersion).where(DubbedVersion.video_id == vid))
    assert dub is not None and dub.status == "ready" and dub.subtitle_srt == f"videos/{vid}/ar.srt"
    assert detail["transcript_language"] == "ar" and detail["transcript"][0]["text"] == "[ar] Önce makineyi kapatın."
    page = (await arabic.get(f"/api/machines/{machine.id}")).json()
    assert page["videos"][0]["availability"] == "dubbed"
    assert (await arabic.get("/api/alerts")).json()["items"] == []  # a prepared language is no notification


async def test_a_language_without_a_voice_gets_subtitles_only(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path,
    ai: FakeAI,
) -> None:  # fmt: skip
    """Google's free speech endpoint can't speak Persian: translated subtitles, no dubbed audio."""
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    vid = (await _upload(await client_as(usta_user), machine.id, sample_video)).id
    await ctx.jobs.drain(ctx)
    persian = await client_as(await make_user(language="fa"))
    before = (await persian.get(f"/api/videos/{vid}")).json()  # not prepared yet; no voice: audio stays original
    assert before["default_subtitle_language"] == "fa" and before["default_audio_language"] == "tr"
    prep = (await persian.post(f"/api/videos/{vid}/languages/fa")).json()
    assert [s["key"] for s in prep["steps"]] == ["translate", "subtitles"]
    await ctx.jobs.drain(ctx)

    detail = (await persian.get(f"/api/videos/{vid}")).json()
    fa = next(t for t in detail["tracks"] if t["language"] == "fa")
    assert fa["subtitles"] == "ready" and fa["audio"] == "unavailable" and fa["stream_url"] is None
    assert fa["dir"] == "rtl" and detail["preparation"] is None and ai.tts.calls == 0
    assert fa["language_tr_name"] == "Farsça"
    assert detail["default_subtitle_language"] == "fa" and detail["default_audio_language"] == "tr"
    page = (await persian.get(f"/api/machines/{machine.id}")).json()
    assert page["videos"][0]["availability"] == "subtitles"


async def test_failed_step_shows_and_retry_resumes_there(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path, ai: FakeAI
) -> None:
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    vid = (await _upload(await client_as(usta_user), machine.id, sample_video)).id
    await ctx.jobs.drain(ctx)
    english = await client_as(await make_user(language="en"))
    ai.tts.fail = True
    await english.post(f"/api/videos/{vid}/languages/en")
    await ctx.jobs.drain(ctx)

    detail = (await english.get(f"/api/videos/{vid}")).json()
    statuses = {s["key"]: s["status"] for s in detail["preparation"]["steps"]}
    assert statuses == {"translate": "done", "subtitles": "done", "voice": "failed", "mix": "waiting"}
    en = next(t for t in detail["tracks"] if t["language"] == "en")
    assert en["subtitles"] == "ready" and en["audio"] == "failed"
    assert (await english.get(f"/api/machines/{machine.id}")).json()["videos"][0]["availability"] == "subtitles"
    assert (await english.post(f"/api/videos/{vid}/languages/en/steps/mix/retry")).status_code == 409

    ai.tts.fail = False
    translated = ai.translator.calls
    retried = (await english.post(f"/api/videos/{vid}/languages/en/steps/voice/retry")).json()
    assert {s["key"]: s["status"] for s in retried["steps"]}["voice"] == "waiting"
    await ctx.jobs.drain(ctx)
    en = next(t for t in (await english.get(f"/api/videos/{vid}")).json()["tracks"] if t["language"] == "en")
    assert en["audio"] == "ready"
    assert ai.translator.calls == translated  # the retry did not redo finished steps


async def test_failed_transcription_keeps_the_video_playable(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path, ai: FakeAI
) -> None:
    ai.transcriber.fail = True
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    usta = await client_as(usta_user)
    started = await _upload(usta, machine.id, sample_video)
    await ctx.jobs.drain(ctx)
    proc = (await usta.get(f"/api/videos/{started.id}/processing")).json()
    assert proc["status"] == "ready"
    assert {s["key"]: s["status"] for s in proc["steps"]}["transcribe"] == "failed"
    job = (await usta.get(f"/api/jobs/{started.job_id}")).json()
    assert job["status"] == "failed" and "fake FakeTranscriber failed" in job["error"]
    detail = (await usta.get(f"/api/videos/{started.id}")).json()
    assert detail["tracks"][0]["stream_url"] and detail["tracks"][0]["subtitles"] == "failed"
    res = await (await client_as(await make_user(language="en"))).post(f"/api/videos/{started.id}/languages/en")
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
    await ctx.jobs.drain(ctx)
    assert (await patron.get(f"/api/videos/{vid}/processing")).json()["status"] == "failed"
    assert (await patron.get(f"/api/machines/{machine.id}")).json()["videos"] == []  # failed videos are hidden


async def test_delete_video_removes_everything_made_from_it(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path,
    db: AsyncSession, ai: FakeAI,
) -> None:  # fmt: skip
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    usta = await client_as(usta_user)
    vid = (await _upload(usta, machine.id, sample_video)).id
    await ctx.jobs.drain(ctx)
    await usta.post(f"/api/videos/{vid}/languages/en")
    await ctx.jobs.drain(ctx)
    chunk_ids = list(await db.scalars(select(Chunk.id).where(Chunk.video_id == vid)))
    assert chunk_ids and ai.vectors.query(ai.embedder.embed_query("elektrot"), machine.id, 5)

    worker = await client_as(await make_user())
    assert (await worker.delete(f"/api/videos/{vid}")).status_code == 403
    assert (await usta.delete(f"/api/videos/{vid}")).status_code == 204
    assert await db.scalar(select(func.count()).where(Chunk.video_id == vid)) == 0
    assert await db.scalar(select(func.count()).where(Snapshot.video_id == vid)) == 0
    assert await db.scalar(select(func.count()).where(DubbedVersion.video_id == vid)) == 0
    assert ai.vectors.query(ai.embedder.embed_query("elektrot"), machine.id, 5) == []
    assert not storage.abs_path(f"videos/{vid}").exists()
    assert (await usta.get(f"/api/videos/{vid}")).status_code == 404


async def test_restart_requeues_an_interrupted_job(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path,
    db: AsyncSession,
) -> None:  # fmt: skip
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    started = await _upload(await client_as(usta_user), machine.id, sample_video)
    await ctx.jobs.drain(ctx)
    # Simulate a server stopped in the middle of indexing.
    await db.execute(
        update(VideoStep)
        .where(VideoStep.video_id == started.id, VideoStep.key == "index")
        .values(status=StepStatus.running)
    )
    await db.execute(update(Job).where(Job.id == started.job_id).values(status=JobStatus.processing))
    await db.commit()
    await ctx.jobs.requeue_interrupted()
    await ctx.jobs.drain(ctx)
    async with ctx.sessionmaker() as fresh:
        steps = (await load_steps(fresh, [started.id]))[started.id]["upload"]
        job = await fresh.get(Job, started.job_id)
    assert all(s.status == StepStatus.done for s in steps)
    assert job is not None and job.status == JobStatus.done and job.attempts == 2


async def test_the_llm_corrects_misheard_words_and_whisper_text_is_kept(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path,
    db: AsyncSession, ai: FakeAI,
) -> None:  # fmt: skip
    ai.llm.corrections = {
        "Önce makineyi kapatın.": "Önce makineyi kapatın ve şalteri kilitleyin.",
        "Sonra elektrotu yenisiyle değiştirin.": "x",  # too different from what was said: rejected
    }
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user], name="Plazma Kesim")
    vid = (await _upload(await client_as(usta_user), machine.id, sample_video, title="Elektrot")).id
    await ctx.jobs.drain(ctx)

    assert ai.llm.context == 'Plazma Kesim, Plazma kesim, PK-105, video "Elektrot"'
    rows = list(
        await db.scalars(
            select(TranscriptSegment).where(TranscriptSegment.video_id == vid).order_by(TranscriptSegment.position)
        )
    )
    assert [(r.text, r.raw_text) for r in rows] == [
        ("Önce makineyi kapatın ve şalteri kilitleyin.", "Önce makineyi kapatın."),
        ("Sonra elektrotu yenisiyle değiştirin.", None),
    ]
    assert (rows[0].start_sec, rows[0].end_sec) == (0.0, 1.2)  # timing unchanged
    vtt = storage.abs_path(f"videos/{vid}/tr.vtt").read_text(encoding="utf-8")
    assert "Önce makineyi kapatın ve şalteri kilitleyin." in vtt
    assert (
        "0:00  Önce makineyi kapatın ve şalteri kilitleyin."
        in storage.abs_path(f"videos/{vid}/transcript.txt").read_text()
    )
    chunk = await db.scalar(select(Chunk).where(Chunk.video_id == vid))
    assert chunk is not None and "şalteri kilitleyin" in chunk.text  # search uses the corrected text


async def test_without_the_llm_whisper_text_is_used_and_the_video_still_finishes(
    client_as: ClientAs, make_user: MakeUser, make_machine: MakeMachine, ctx: AppContext, sample_video: Path, ai: FakeAI
) -> None:
    ai.llm.fail = True
    usta_user = await make_user(Role.usta)
    machine = await make_machine(ustas=[usta_user])
    usta = await client_as(usta_user)
    vid = (await _upload(usta, machine.id, sample_video)).id
    await ctx.jobs.drain(ctx)
    proc = (await usta.get(f"/api/videos/{vid}/processing")).json()
    assert all(s["status"] == "done" for s in proc["steps"])
    detail = (await usta.get(f"/api/videos/{vid}")).json()
    assert [s["text"] for s in detail["transcript"]] == [
        "Önce makineyi kapatın.",
        "Sonra elektrotu yenisiyle değiştirin.",
    ]
