import math
from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.protocol import AI
from app.search.models import SearchChunk


@dataclass
class ChunkIn:
    text: str
    start_sec: float | None = None
    page: int | None = None


def transcript_chunks(segments: list[tuple[float, str]], max_chars: int = 600) -> list[ChunkIn]:
    """Group (start_sec, text) transcript segments into passages of about max_chars, keeping the start time."""
    chunks: list[ChunkIn] = []
    for start, text in segments:
        if chunks and len(chunks[-1].text) + len(text) < max_chars:
            chunks[-1].text += " " + text
        else:
            chunks.append(ChunkIn(text=text, start_sec=start))
    return chunks


def page_chunks(pages: list[str], max_chars: int = 1500) -> list[ChunkIn]:
    """Split each page's text into passages of at most max_chars, keeping the page number (1-based)."""
    out: list[ChunkIn] = []
    for number, text in enumerate(pages, start=1):
        text = " ".join(text.split())
        out += [ChunkIn(text=text[i : i + max_chars], page=number) for i in range(0, len(text), max_chars)]
    return out


async def replace_chunks(
    db: AsyncSession,
    ai: AI,
    machine_id: int,
    kind: str,
    chunks: list[ChunkIn],
    *,
    video_id: int | None = None,
    document_id: int | None = None,
    question_id: int | None = None,
) -> None:
    """(Re)index one source: drop its old chunks, embed the new ones. Raises AIUnavailableError."""
    chunks = [c for c in chunks if c.text.strip()]
    vectors = await ai.embed([c.text for c in chunks], "document") if chunks else []
    owner = (
        SearchChunk.video_id == video_id
        if video_id is not None
        else SearchChunk.document_id == document_id
        if document_id is not None
        else SearchChunk.question_id == question_id
    )
    await db.execute(delete(SearchChunk).where(SearchChunk.kind == kind, owner))
    db.add_all(
        SearchChunk(
            machine_id=machine_id,
            kind=kind,
            video_id=video_id,
            document_id=document_id,
            question_id=question_id,
            start_sec=c.start_sec,
            page=c.page,
            text=c.text,
            embedding=v,
        )
        for c, v in zip(chunks, vectors, strict=True)
    )
    await db.commit()


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=False))
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return dot / norm if norm else 0.0


async def nearest(
    db: AsyncSession, machine_id: int, query: list[float], min_score: float, limit: int = 6
) -> list[tuple[SearchChunk, float]]:
    """The machine's chunks most similar to `query`, best first, only those scoring at least min_score.
    shortcut: scores every chunk of the machine in Python; fine for hundreds of chunks per machine,
    move to a vector index if a machine gets tens of thousands."""
    rows = await db.scalars(select(SearchChunk).where(SearchChunk.machine_id == machine_id))
    scored = [(c, cosine(query, c.embedding)) for c in rows]
    scored = [(c, s) for c, s in scored if s >= min_score]
    return sorted(scored, key=lambda cs: cs[1], reverse=True)[:limit]
