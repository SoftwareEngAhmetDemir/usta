"""Search index for "Makineye sor": chunk text + metadata in MySQL (`chunks`), vectors in the VectorStore under the
chunk id. Every chunk belongs to one machine and every search is limited to that machine."""

import asyncio
from dataclasses import dataclass, field

from sqlalchemy import ColumnElement, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.interfaces import AIServices
from app.search.keyword import BM25, rrf_merge, tokenize
from app.search.models import Chunk


@dataclass
class ChunkIn:
    """A chunk to store. `title` is the video title / document file name shown with answers."""

    text: str
    language: str
    title: str = ""
    start_sec: float | None = None
    end_sec: float | None = None
    page: int | None = None
    section_heading: str | None = None
    topic_segment_id: int | None = None
    snapshot_paths: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class Owner:
    """The source a chunk comes from: exactly one of these is set."""

    video_id: int | None = None
    document_id: int | None = None
    question_id: int | None = None

    @property
    def source_type(self) -> str:
        return "video" if self.video_id else "document" if self.document_id else "usta_answer"


def _owned(owner: Owner) -> ColumnElement[bool]:
    if owner.video_id is not None:
        return Chunk.video_id == owner.video_id
    if owner.document_id is not None:
        return Chunk.document_id == owner.document_id
    return Chunk.question_id == owner.question_id


async def delete_chunks(db: AsyncSession, ai: AIServices, owner: Owner) -> None:
    """Remove a source's chunks and their vectors (the caller commits)."""
    ids = list(await db.scalars(select(Chunk.id).where(_owned(owner))))
    await asyncio.to_thread(ai.vectors.delete, ids)
    await db.execute(delete(Chunk).where(Chunk.id.in_(ids)))


async def embed_and_store(
    db: AsyncSession, ai: AIServices, machine_id: int, owner: Owner, chunks: list[ChunkIn]
) -> list[int]:
    """(Re)index one source: drop its old chunks and vectors, embed and store the new ones. Returns chunk ids."""
    chunks = [c for c in chunks if c.text.strip()]
    await delete_chunks(db, ai, owner)
    rows = [
        Chunk(
            machine_id=machine_id,
            source_type=owner.source_type,
            video_id=owner.video_id,
            document_id=owner.document_id,
            question_id=owner.question_id,
            topic_segment_id=c.topic_segment_id,
            title=c.title[:255],
            start_sec=c.start_sec,
            end_sec=c.end_sec,
            page=c.page,
            section_heading=(c.section_heading or None) and c.section_heading[:255],
            language=c.language,
            snapshot_paths=c.snapshot_paths,
            text=c.text,
            embedding_model_version=ai.embedder.model_version,
        )
        for c in chunks
    ]
    db.add_all(rows)
    await db.flush()
    await _upsert_vectors(ai, rows)
    await db.commit()
    return [r.id for r in rows]


async def _upsert_vectors(ai: AIServices, rows: list[Chunk]) -> None:
    vectors = await asyncio.to_thread(ai.embedder.embed_documents, [r.text for r in rows])
    meta: list[dict[str, str | int | float]] = [
        {"machine_id": r.machine_id, "source_type": r.source_type, "language": r.language} for r in rows
    ]
    await asyncio.to_thread(ai.vectors.upsert, [r.id for r in rows], vectors, meta)


async def reembed_stale(db: AsyncSession, ai: AIServices, batch: int = 64) -> int:
    """Re-embed every chunk made with another embedding model (texts stay; nothing is re-transcribed)."""
    version, done = ai.embedder.model_version, 0
    while rows := list(await db.scalars(select(Chunk).where(Chunk.embedding_model_version != version).limit(batch))):
        await _upsert_vectors(ai, rows)
        for r in rows:
            r.embedding_model_version = version
        await db.commit()
        done += len(rows)
    return done


# ---- retrieval ----


@dataclass
class Candidate:
    chunk: Chunk
    vector_rank: int | None = None
    keyword_rank: int | None = None
    rrf: float = 0.0
    rerank: float = 0.0


async def hybrid_search(
    db: AsyncSession, ai: AIServices, machine_id: int, queries: list[str], k: int = 20
) -> list[Candidate]:
    """Vector search (top k) + BM25 keyword search (top k) over this machine's chunks, for each phrasing of the
    question (the worker's words, plus machine translations into the content's language), merged with RRF."""
    # shortcut: BM25 is computed in Python over the machine's chunks each time; fine for a few thousand chunks per
    # machine, move to MySQL FULLTEXT (or a BM25 index) if a machine gets far more.
    rows = list(await db.scalars(select(Chunk).where(Chunk.machine_id == machine_id)))
    if not rows:
        return []
    by_id = {r.id: r for r in rows}
    bm25 = BM25([tokenize(r.text) for r in rows])
    rankings: list[list[int]] = []
    vector_best: dict[int, int] = {}
    keyword_best: dict[int, int] = {}
    for query in queries:
        query_vector = await asyncio.to_thread(ai.embedder.embed_query, query)
        hits = await asyncio.to_thread(ai.vectors.query, query_vector, machine_id, k)
        vector = [h.chunk_id for h in hits if h.chunk_id in by_id]
        scores = bm25.scores(tokenize(query))
        keyword = [r.id for r, s in sorted(zip(rows, scores, strict=True), key=lambda rs: -rs[1]) if s > 0][:k]
        rankings += [vector, keyword]
        for best, ranking in ((vector_best, vector), (keyword_best, keyword)):
            for rank, cid in enumerate(ranking, start=1):
                best[cid] = min(best.get(cid, rank), rank)
    return [
        Candidate(chunk=by_id[cid], vector_rank=vector_best.get(cid), keyword_rank=keyword_best.get(cid), rrf=score)
        for cid, score in rrf_merge(rankings)
    ]


async def rerank(ai: AIServices, queries: list[str], candidates: list[Candidate], top_k: int = 5) -> list[Candidate]:
    """Re-score with the cross-encoder (best score over the question's phrasings) and keep the top_k, best first."""
    texts = [c.chunk.text for c in candidates]
    for query in queries:
        scores = await asyncio.to_thread(ai.reranker.score, query, texts)
        for c, s in zip(candidates, scores, strict=True):
            c.rerank = max(c.rerank, s)
    return sorted(candidates, key=lambda c: -c.rerank)[:top_k]
