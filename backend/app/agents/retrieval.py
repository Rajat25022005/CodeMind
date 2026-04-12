"""
Retrieval Agent

Hybrid vector + graph search for answering queries.
Combines Qdrant vector similarity search with Neo4j graph traversal
to find the most relevant context for a user's question.
Uses reciprocal rank fusion to merge results from both sources.
"""

from __future__ import annotations

import logging

from app.core.graph_db import GraphDB
from app.core.vector_db import VectorDB
from app.core.llm import LLMClient

logger = logging.getLogger(__name__)


class RetrievalAgent:
    """Performs hybrid retrieval across vector store and knowledge graph."""

    def __init__(
        self,
        graph_db: GraphDB,
        vector_db: VectorDB,
        llm: LLMClient,
    ) -> None:
        self.graph_db = graph_db
        self.vector_db = vector_db
        self.llm = llm

    async def retrieve(self, query: str, top_k: int = 10) -> list[dict]:
        """
        Execute hybrid retrieval:
        1. Embed query and search Qdrant for similar chunks
        2. Extract entity names from query → traverse Neo4j for related nodes
        3. Re-rank and merge results via reciprocal rank fusion
        """
        logger.info("Retrieval for: '%s' (top_k=%d)", query[:80], top_k)

        # Step 1: Vector search
        vector_results = await self._vector_search(query, top_k)

        # Step 2: Graph search
        graph_results = await self._graph_search(query, top_k)

        # Step 3: Merge via reciprocal rank fusion
        merged = self._reciprocal_rank_fusion(vector_results, graph_results, top_k)

        logger.info(
            "Retrieval complete: %d vector hits, %d graph hits → %d merged",
            len(vector_results), len(graph_results), len(merged),
        )
        return merged

    async def _vector_search(self, query: str, top_k: int) -> list[dict]:
        """Embed query and search Qdrant for semantically similar chunks."""
        try:
            query_vector = await self.llm.embed(query)
        except Exception as e:
            logger.warning("Embedding failed for query: %s", e)
            return []

        try:
            results = await self.vector_db.search(
                query_vector=query_vector,
                top_k=top_k,
            )
        except Exception as e:
            logger.warning("Qdrant search failed: %s", e)
            return []

        return [
            {
                "id": r["id"],
                "content": r["payload"].get("content", ""),
                "source_file": r["payload"].get("source_file", ""),
                "commit_hash": r["payload"].get("commit_hash", ""),
                "chunk_type": r["payload"].get("chunk_type", ""),
                "score": r["score"],
                "source": "vector",
            }
            for r in results
        ]

    async def _graph_search(self, query: str, top_k: int) -> list[dict]:
        """
        Extract entity references from the query and traverse
        the knowledge graph for related context.
        """
        # Use LLM to extract entity names from the query
        entities = await self._extract_query_entities(query)

        results: list[dict] = []
        seen_ids: set[str] = set()

        for entity_name in entities:
            # Search for matching nodes in the graph
            try:
                matches = await self.graph_db.query(
                    "MATCH (n:Entity) WHERE toLower(n.label) CONTAINS toLower($name) "
                    "RETURN n.id AS id, n.label AS label, n.type AS type, "
                    "properties(n) AS props LIMIT 5",
                    {"name": entity_name},
                )
            except Exception as e:
                logger.debug("Graph search failed for '%s': %s", entity_name, e)
                continue

            for match in matches:
                node_id = match.get("id", "")
                if node_id in seen_ids:
                    continue
                seen_ids.add(node_id)

                # Get neighbors for richer context
                try:
                    neighborhood = await self.graph_db.get_node_neighbors(node_id, depth=1)
                except Exception:
                    neighborhood = {"nodes": [], "edges": []}

                props = match.get("props", {})
                neighbor_labels = [n.label for n in neighborhood.get("nodes", [])]

                results.append({
                    "id": node_id,
                    "content": f"{match.get('label', '')} ({match.get('type', '')}): "
                               f"{props.get('message', props.get('path', ''))}",
                    "source_file": props.get("path", props.get("source_file", "")),
                    "commit_hash": props.get("commit_hash", ""),
                    "chunk_type": "graph_node",
                    "score": 0.8,  # Graph matches get a base relevance score
                    "source": "graph",
                    "neighbors": neighbor_labels[:5],
                })

        return results[:top_k]

    async def _extract_query_entities(self, query: str) -> list[str]:
        """Use LLM to extract entity names from a natural language query."""
        prompt = (
            f"Extract the key code entity names (functions, files, modules, classes) "
            f"from this question. Return ONLY a comma-separated list of names, nothing else.\n\n"
            f"Question: {query}"
        )

        try:
            response = await self.llm.generate(prompt)
            entities = [e.strip() for e in response.split(",") if e.strip()]
            return entities[:5]  # Limit to 5 entities
        except Exception as e:
            logger.debug("Entity extraction failed: %s", e)
            # Fallback: extract words that look like code identifiers
            import re
            return re.findall(r"\b[a-z_]\w+(?:\.\w+)*\b", query.lower())[:5]

    def _reciprocal_rank_fusion(
        self,
        vector_results: list[dict],
        graph_results: list[dict],
        top_k: int,
        k: int = 60,
    ) -> list[dict]:
        """
        Merge results from vector and graph search using
        Reciprocal Rank Fusion (RRF): score = Σ 1/(k + rank)
        """
        scores: dict[str, float] = {}
        items: dict[str, dict] = {}

        for rank, item in enumerate(vector_results):
            item_id = item["id"]
            scores[item_id] = scores.get(item_id, 0) + 1 / (k + rank + 1)
            items[item_id] = item

        for rank, item in enumerate(graph_results):
            item_id = item["id"]
            scores[item_id] = scores.get(item_id, 0) + 1 / (k + rank + 1)
            if item_id not in items:
                items[item_id] = item
            else:
                # Merge sources
                items[item_id]["source"] = "hybrid"
                if "neighbors" in item:
                    items[item_id]["neighbors"] = item.get("neighbors", [])

        # Sort by fused score
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [
            {**items[item_id], "rrf_score": score}
            for item_id, score in ranked[:top_k]
            if item_id in items
        ]
