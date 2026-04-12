"""
Qdrant Vector Store Client

Async wrapper over the Qdrant Python client for semantic search.
Handles collection management, point upsertion, and similarity search.
"""

from __future__ import annotations

import logging
import uuid

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
    Filter,
    FieldCondition,
    MatchValue,
)

from app.config import get_settings

logger = logging.getLogger(__name__)


class VectorDB:
    """Qdrant async client for CodeMind vector embeddings."""

    __slots__ = ("_client", "_settings")

    def __init__(self) -> None:
        self._client: AsyncQdrantClient | None = None
        self._settings = get_settings()

    def _require_connection(self) -> AsyncQdrantClient:
        """Return the client or raise if not connected."""
        if self._client is None:
            raise RuntimeError("Qdrant is not connected — call connect() first")
        return self._client

    async def connect(self) -> None:
        """Establish connection to Qdrant."""
        self._settings = get_settings()
        try:
            self._client = AsyncQdrantClient(
                host=self._settings.qdrant_host,
                port=self._settings.qdrant_port,
            )
            # Verify by listing collections
            await self._client.get_collections()
            logger.info(
                "Connected to Qdrant at %s:%s",
                self._settings.qdrant_host,
                self._settings.qdrant_port,
            )
        except Exception as e:
            logger.error("Failed to connect to Qdrant: %s", e)
            self._client = None
            raise

    async def close(self) -> None:
        """Close the Qdrant connection."""
        if self._client:
            await self._client.close()
            self._client = None
            logger.info("Qdrant connection closed")

    @property
    def connected(self) -> bool:
        return self._client is not None

    async def ensure_collection(
        self,
        name: str | None = None,
        dimension: int | None = None,
    ) -> None:
        """Create collection if it doesn't exist."""
        client = self._require_connection()
        coll_name = name or self._settings.collection_name
        dim = dimension or self._settings.embed_dimension

        collections = await client.get_collections()
        existing = [c.name for c in collections.collections]

        if coll_name not in existing:
            await client.create_collection(
                collection_name=coll_name,
                vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
            )
            logger.info("Created Qdrant collection '%s' (dim=%d)", coll_name, dim)
        else:
            logger.debug("Collection '%s' already exists", coll_name)

    async def upsert(
        self,
        vector: list[float],
        payload: dict,
        point_id: str | None = None,
        collection: str | None = None,
    ) -> str:
        """Insert or update a single point. Returns the point ID."""
        client = self._require_connection()
        coll = collection or self._settings.collection_name
        pid = point_id or str(uuid.uuid4())

        await client.upsert(
            collection_name=coll,
            points=[
                PointStruct(id=pid, vector=vector, payload=payload),
            ],
        )
        return pid

    async def upsert_batch(
        self,
        points: list[dict],
        collection: str | None = None,
    ) -> int:
        """
        Batch upsert multiple points.
        Each dict should have keys: 'id', 'vector', 'payload'.
        """
        client = self._require_connection()
        coll = collection or self._settings.collection_name

        structs = [
            PointStruct(
                id=p.get("id", str(uuid.uuid4())),
                vector=p["vector"],
                payload=p.get("payload", {}),
            )
            for p in points
        ]

        await client.upsert(collection_name=coll, points=structs)
        logger.info("Upserted %d points into '%s'", len(structs), coll)
        return len(structs)

    async def search(
        self,
        query_vector: list[float],
        top_k: int = 10,
        collection: str | None = None,
        filter_conditions: dict | None = None,
    ) -> list[dict]:
        """
        Similarity search. Returns list of dicts with 'id', 'score', 'payload'.
        """
        client = self._require_connection()
        coll = collection or self._settings.collection_name

        # Build optional filter
        qfilter = None
        if filter_conditions:
            conditions = [
                FieldCondition(key=k, match=MatchValue(value=v))
                for k, v in filter_conditions.items()
            ]
            qfilter = Filter(must=conditions)

        results = await client.search(
            collection_name=coll,
            query_vector=query_vector,
            limit=top_k,
            query_filter=qfilter,
        )

        return [
            {
                "id": str(hit.id),
                "score": hit.score,
                "payload": hit.payload or {},
            }
            for hit in results
        ]

    async def delete_collection(self, name: str | None = None) -> None:
        """Delete a collection."""
        client = self._require_connection()
        coll = name or self._settings.collection_name
        await client.delete_collection(collection_name=coll)
        logger.info("Deleted Qdrant collection '%s'", coll)

    async def count(self, collection: str | None = None) -> int:
        """Return the number of points in a collection."""
        client = self._require_connection()
        coll = collection or self._settings.collection_name
        try:
            info = await client.get_collection(collection_name=coll)
            return info.points_count or 0
        except Exception:
            return 0
