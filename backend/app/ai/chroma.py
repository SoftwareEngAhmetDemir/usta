"""ChromaDB in persistent local mode (in-process, no server) behind the VectorStore interface.
Cosine space; every vector's metadata has machine_id so a search never leaves the chosen machine."""

from collections.abc import Sequence
from pathlib import Path

import chromadb
from chromadb.api.types import Metadata
from chromadb.config import Settings as ChromaSettings

from app.ai.interfaces import VectorHit

COLLECTION = "chunks"


class ChromaVectorStore:
    def __init__(self, path: Path | None) -> None:
        """path=None: in memory (tests)."""
        settings = ChromaSettings(anonymized_telemetry=False, allow_reset=True)
        self._client = (
            chromadb.PersistentClient(path=str(path), settings=settings)
            if path is not None
            else chromadb.EphemeralClient(settings=settings)
        )
        self._collection = self._client.get_or_create_collection(
            COLLECTION, metadata={"hnsw:space": "cosine"}, embedding_function=None
        )

    def upsert(self, ids: list[int], vectors: list[list[float]], metadata: list[dict[str, str | int | float]]) -> None:
        if ids:
            embeddings: list[Sequence[float]] = list(vectors)
            metadatas: list[Metadata] = [dict(m) for m in metadata]
            self._collection.upsert(ids=[str(i) for i in ids], embeddings=embeddings, metadatas=metadatas)

    def query(self, vector: list[float], machine_id: int, k: int) -> list[VectorHit]:
        query: list[Sequence[float]] = [vector]
        res = self._collection.query(
            query_embeddings=query, n_results=k, where={"machine_id": machine_id}, include=["distances"]
        )
        ids, distances = res["ids"][0], (res["distances"] or [[]])[0]
        return [VectorHit(chunk_id=int(i), score=1.0 - float(d)) for i, d in zip(ids, distances, strict=True)]

    def delete(self, ids: list[int]) -> None:
        if ids:
            self._collection.delete(ids=[str(i) for i in ids])

    def reset(self) -> None:
        """Tests only: drop every vector."""
        self._client.delete_collection(COLLECTION)
        self._collection = self._client.get_or_create_collection(
            COLLECTION, metadata={"hnsw:space": "cosine"}, embedding_function=None
        )
