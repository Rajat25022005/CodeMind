"""
Graph Builder Agent

Entity extraction → Neo4j graph construction.
Takes ingested chunks from the IngestionAgent, extracts entities and
semantic relationships via LLM, and populates the temporal knowledge graph.
Simultaneously embeds chunks into Qdrant for vector search.
"""

from __future__ import annotations

import logging
from typing import Any

from core.graph_db import GraphDB
from core.vector_db import VectorDB
from core.llm import LLMClient
from models import ChunkRecord, NodeType, EdgeType

logger = logging.getLogger(__name__)

# System prompt for entity/relationship extraction
EXTRACTION_PROMPT = """You are a code analysis expert. Given the following code chunk, extract:
1. ENTITIES: Functions, classes, modules, or files mentioned. For each, provide: name, type (function/module/file/class).
2. RELATIONSHIPS: How entities relate to each other. For each, provide: source, target, type (depends/introduced/refactored/calls/imports).

Respond in this exact JSON format:
{
  "entities": [{"name": "...", "type": "..."}, ...],
  "relationships": [{"source": "...", "target": "...", "type": "..."}, ...]
}

Only return the JSON. No explanation."""


class GraphBuilderAgent:
    """Builds and maintains the temporal knowledge graph in Neo4j."""

    def __init__(
        self,
        graph_db: GraphDB,
        vector_db: VectorDB,
        llm: LLMClient,
    ) -> None:
        self.graph_db = graph_db
        self.vector_db = vector_db
        self.llm = llm

    async def build_graph(self, chunks: list[ChunkRecord]) -> dict:
        """
        Process ingested chunks to:
        1. Create nodes for commits, files, and code entities
        2. Extract relationships via LLM for semantic edges
        3. Embed all chunks into Qdrant for vector search
        4. Return stats on what was created
        """
        logger.info("Building graph from %d chunks", len(chunks))

        nodes_created = 0
        edges_created = 0
        vectors_upserted = 0

        # Pass 1: Create nodes from structured chunk metadata
        for chunk in chunks:
            try:
                if chunk.chunk_type == "commit_message":
                    await self._process_commit_chunk(chunk)
                    nodes_created += 1
                elif chunk.chunk_type == "code":
                    n = await self._process_code_chunk(chunk)
                    nodes_created += n
                elif chunk.chunk_type == "diff":
                    await self._process_diff_chunk(chunk)
                    edges_created += 1
            except Exception as e:
                logger.warning("Error processing chunk %s: %s", chunk.id, e)

        # Pass 2: LLM-based relationship extraction for code chunks
        code_chunks = [c for c in chunks if c.chunk_type == "code" and c.content]
        for chunk in code_chunks[:100]:  # Limit to prevent excessive LLM calls
            try:
                e = await self._extract_relationships(chunk)
                edges_created += e
            except Exception as e:
                logger.debug("Relationship extraction failed for %s: %s", chunk.id, e)

        # Pass 3: Embed all chunks into Qdrant
        vectors_upserted = await self._embed_chunks(chunks)

        logger.info(
            "Graph build complete: %d nodes, %d edges, %d vectors",
            nodes_created, edges_created, vectors_upserted,
        )

        return {
            "status": "completed",
            "nodes_created": nodes_created,
            "edges_created": edges_created,
            "vectors_upserted": vectors_upserted,
        }

    async def _process_commit_chunk(self, chunk: ChunkRecord) -> None:
        """Create a commit node in the graph."""
        await self.graph_db.create_node(
            node_id=chunk.id,
            label=chunk.commit_hash[:7],
            node_type=NodeType.COMMIT,
            properties={
                "message": chunk.commit_message,
                "author": chunk.author,
                "timestamp": chunk.timestamp,
                "files_changed": chunk.metadata.get("files_changed", 0),
            },
        )

    async def _process_code_chunk(self, chunk: ChunkRecord) -> int:
        """Create file and entity nodes from a code chunk."""
        count = 0

        # File node
        if chunk.source_file:
            file_id = f"file_{chunk.source_file.replace('/', '_').replace('.', '_')}"
            await self.graph_db.create_node(
                node_id=file_id,
                label=chunk.source_file,
                node_type=NodeType.FILE,
                properties={
                    "language": chunk.metadata.get("language", ""),
                    "lines": chunk.metadata.get("lines", 0),
                    "path": chunk.source_file,
                },
            )
            count += 1

        # Entity nodes (functions, classes)
        entities = chunk.metadata.get("entities", [])
        for entity in entities:
            ent_name = entity.get("name", "")
            ent_type = entity.get("type", "function")
            if not ent_name:
                continue

            ent_id = f"{ent_type}_{chunk.source_file}_{ent_name}".replace("/", "_").replace(".", "_")
            node_type = NodeType.FUNCTION if ent_type in ("function", "class") else NodeType.MODULE

            await self.graph_db.create_node(
                node_id=ent_id,
                label=ent_name,
                node_type=node_type,
                properties={
                    "source_file": chunk.source_file,
                    "line": entity.get("line", 0),
                    "entity_type": ent_type,
                },
            )
            count += 1

            # Edge: entity belongs to file
            if chunk.source_file:
                file_id = f"file_{chunk.source_file.replace('/', '_').replace('.', '_')}"
                await self.graph_db.create_edge(
                    from_id=ent_id,
                    to_id=file_id,
                    edge_type=EdgeType.DEPENDS,
                    properties={"relationship": "defined_in"},
                )

        return count

    async def _process_diff_chunk(self, chunk: ChunkRecord) -> None:
        """Create edges linking commits to the files they modified."""
        if chunk.commit_hash and chunk.source_file:
            commit_id = f"commit_{chunk.commit_hash[:7]}"
            file_id = f"file_{chunk.source_file.replace('/', '_').replace('.', '_')}"

            # Ensure file node exists
            await self.graph_db.create_node(
                node_id=file_id,
                label=chunk.source_file,
                node_type=NodeType.FILE,
                properties={"path": chunk.source_file},
            )

            await self.graph_db.create_edge(
                from_id=commit_id,
                to_id=file_id,
                edge_type=EdgeType.INTRODUCED,
                properties={
                    "message": chunk.commit_message,
                    "author": chunk.author,
                },
            )

    async def _extract_relationships(self, chunk: ChunkRecord) -> int:
        """Use LLM to extract semantic relationships from a code chunk."""
        import json

        prompt = f"""Analyze this code chunk and extract entities and relationships:

File: {chunk.source_file}
Content:
```
{chunk.content[:2000]}
```"""

        try:
            response = await self.llm.generate(prompt, system_prompt=EXTRACTION_PROMPT)
            # Parse JSON response
            data = json.loads(response.strip())
        except (json.JSONDecodeError, Exception) as e:
            logger.debug("LLM extraction parse error: %s", e)
            return 0

        edge_count = 0
        relationships = data.get("relationships", [])
        for rel in relationships:
            source = rel.get("source", "")
            target = rel.get("target", "")
            rel_type = rel.get("type", "depends")

            if not source or not target:
                continue

            try:
                etype = EdgeType(rel_type)
            except ValueError:
                etype = EdgeType.DEPENDS

            source_id = f"entity_{source.replace('/', '_').replace('.', '_')}"
            target_id = f"entity_{target.replace('/', '_').replace('.', '_')}"

            await self.graph_db.create_edge(
                from_id=source_id,
                to_id=target_id,
                edge_type=etype,
                properties={"extracted_by": "llm"},
            )
            edge_count += 1

        return edge_count

    async def _embed_chunks(self, chunks: list[ChunkRecord]) -> int:
        """Embed all chunks and upsert into Qdrant."""
        batch: list[dict[str, Any]] = []

        for chunk in chunks:
            if not chunk.content.strip():
                continue

            try:
                vector = await self.llm.embed(chunk.content[:1000])
            except Exception as e:
                logger.debug("Embedding failed for chunk %s: %s", chunk.id, e)
                continue

            batch.append({
                "id": chunk.id,
                "vector": vector,
                "payload": {
                    "content": chunk.content[:2000],
                    "source_file": chunk.source_file,
                    "commit_hash": chunk.commit_hash,
                    "chunk_type": chunk.chunk_type,
                    "author": chunk.author,
                    "timestamp": chunk.timestamp,
                },
            })

            # Batch upsert every 50 points
            if len(batch) >= 50:
                await self.vector_db.upsert_batch(batch)
                batch = []

        # Flush remaining
        if batch:
            await self.vector_db.upsert_batch(batch)

        return sum(1 for c in chunks if c.content.strip())
