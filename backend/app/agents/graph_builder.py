"""
Graph Builder Agent

Entity extraction → Neo4j graph construction.
Takes ingested chunks from the IngestionAgent, extracts entities and
semantic relationships via LLM, and populates the temporal knowledge graph.
Simultaneously embeds chunks into Qdrant for vector search.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

from app.core.graph_db import GraphDB
from app.core.vector_db import VectorDB
from app.core.llm import LLMClient
from app.codebase.schemas import ChunkRecord, NodeType, EdgeType

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

# Pre-compiled regex for JSON extraction
_JSON_RE = re.compile(r'\{.*\}', re.DOTALL)


class GraphBuilderAgent:
    """Builds and maintains the temporal knowledge graph in Neo4j."""

    __slots__ = ("graph_db", "vector_db", "llm")

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

        node_batch: list[dict[str, Any]] = []
        edge_batch: list[dict[str, Any]] = []

        # Pass 1: Create nodes from structured chunk metadata
        for chunk in chunks:
            try:
                if chunk.chunk_type == "commit_message":
                    self._collect_commit_chunk(chunk, node_batch)
                elif chunk.chunk_type == "code":
                    self._collect_code_chunk(chunk, node_batch, edge_batch)
                elif chunk.chunk_type == "diff":
                    self._collect_diff_chunk(chunk, node_batch, edge_batch)
            except Exception as e:
                logger.warning("Error processing chunk %s: %s", chunk.id, e)

        if node_batch:
            nodes_created += await self.graph_db.bulk_create_nodes(node_batch)
        if edge_batch:
            edges_created += await self.graph_db.bulk_create_edges(edge_batch)

        # Pass 2: LLM-based relationship extraction for code chunks
        llm_edges: list[dict[str, Any]] = []
        code_chunks = [c for c in chunks if c.chunk_type == "code" and c.content]
        for chunk in code_chunks[:100]:  # Limit to prevent excessive LLM calls
            try:
                new_edges = await self._extract_relationships(chunk)
                llm_edges.extend(new_edges)
            except Exception as e:
                logger.debug("Relationship extraction failed for %s: %s", chunk.id, e)

        if llm_edges:
            edges_created += await self.graph_db.bulk_create_edges(llm_edges)

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

    def _collect_commit_chunk(self, chunk: ChunkRecord, node_batch: list) -> None:
        """Collect a commit node for bulk graph insertion."""
        node_batch.append({
            "id": chunk.id,
            "label": chunk.commit_hash[:7],
            "type": NodeType.COMMIT.value,
            "properties": {
                "message": chunk.commit_message,
                "author": chunk.author,
                "timestamp": chunk.timestamp,
                "files_changed": chunk.metadata.get("files_changed", 0),
            }
        })

    def _collect_code_chunk(self, chunk: ChunkRecord, node_batch: list, edge_batch: list) -> None:
        """Collect file and entity nodes/edges from a code chunk for bulk insertion."""
        # File node
        if chunk.source_file:
            file_id = f"file_{chunk.source_file.replace('/', '_').replace('.', '_')}"
            node_batch.append({
                "id": file_id,
                "label": chunk.source_file,
                "type": NodeType.FILE.value,
                "properties": {
                    "language": chunk.metadata.get("language", ""),
                    "lines": chunk.metadata.get("lines", 0),
                    "path": chunk.source_file,
                }
            })

        # Entity nodes (functions, classes)
        entities = chunk.metadata.get("entities", [])
        for entity in entities:
            ent_name = entity.get("name", "")
            ent_type = entity.get("type", "function")
            if not ent_name:
                continue

            ent_id = f"{ent_type}_{chunk.source_file}_{ent_name}".replace("/", "_").replace(".", "_")
            node_type = NodeType.FUNCTION if ent_type in ("function", "class") else NodeType.MODULE

            node_batch.append({
                "id": ent_id,
                "label": ent_name,
                "type": node_type.value,
                "properties": {
                    "source_file": chunk.source_file,
                    "line": entity.get("line", 0),
                    "entity_type": ent_type,
                }
            })

            # Edge: entity belongs to file
            if chunk.source_file:
                file_id = f"file_{chunk.source_file.replace('/', '_').replace('.', '_')}"
                edge_batch.append({
                    "from_id": ent_id,
                    "to_id": file_id,
                    "type": EdgeType.DEPENDS.value,
                    "properties": {"relationship": "defined_in"},
                })

    def _collect_diff_chunk(self, chunk: ChunkRecord, node_batch: list, edge_batch: list) -> None:
        """Collect edges linking commits to the files they modified for bulk insertion."""
        if chunk.commit_hash and chunk.source_file:
            commit_id = f"commit_{chunk.commit_hash[:7]}"
            file_id = f"file_{chunk.source_file.replace('/', '_').replace('.', '_')}"

            # Ensure file node exists
            node_batch.append({
                "id": file_id,
                "label": chunk.source_file,
                "type": NodeType.FILE.value,
                "properties": {"path": chunk.source_file},
            })

            edge_batch.append({
                "from_id": commit_id,
                "to_id": file_id,
                "type": EdgeType.INTRODUCED.value,
                "properties": {
                    "message": chunk.commit_message,
                    "author": chunk.author,
                }
            })

    async def _extract_relationships(self, chunk: ChunkRecord) -> list:
        """Use LLM to extract semantic relationships from a code chunk."""
        prompt = f"""Analyze this code chunk and extract entities and relationships:

File: {chunk.source_file}
Content:
```
{chunk.content[:2000]}
```"""

        try:
            response = await self.llm.generate(prompt, system_prompt=EXTRACTION_PROMPT)
            # Resilient JSON parsing
            match = _JSON_RE.search(response.strip())
            json_str = match.group(0) if match else response.strip()
            data = json.loads(json_str)
        except (json.JSONDecodeError, Exception) as e:
            logger.debug("LLM extraction parse error: %s", e)
            return []

        rel_batch: list[dict[str, Any]] = []
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

            rel_batch.append({
                "from_id": source_id,
                "to_id": target_id,
                "type": etype.value,
                "properties": {"extracted_by": "llm"},
            })

        return rel_batch

    async def _embed_chunks(self, chunks: list[ChunkRecord]) -> int:
        """Embed all chunks and upsert into Qdrant in parallel."""
        sem = asyncio.Semaphore(10)  # Max 10 concurrent embeddings
        
        async def embed_one(chunk: ChunkRecord):
            async with sem:
                try:
                    if not chunk.content.strip():
                        return None
                    vector = await self.llm.embed(chunk.content[:1000])
                    payload = {
                        "content": chunk.content[:2000],
                        "source_file": chunk.source_file,
                        "commit_hash": chunk.commit_hash,
                        "chunk_type": chunk.chunk_type,
                        "author": chunk.author,
                        "timestamp": chunk.timestamp,
                    }
                    return {"id": chunk.id, "vector": vector, "payload": payload}
                except Exception as e:
                    logger.error("Failed to embed chunk %s: %s", chunk.id, e)
                    return None

        tasks = [embed_one(c) for c in chunks if c.content.strip()]
        results = await asyncio.gather(*tasks)
        valid_points = [r for r in results if r is not None]

        inserted = 0
        batch_size = 50
        for i in range(0, len(valid_points), batch_size):
            batch = valid_points[i:i + batch_size]
            await self.vector_db.upsert_batch(batch)
            inserted += len(batch)

        logger.info("Embedded and stored %d/%d chunks in Vector DB", inserted, len(chunks))
        return inserted
