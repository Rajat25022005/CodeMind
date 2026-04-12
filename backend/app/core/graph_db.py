"""
Neo4j Graph Database Client

Async wrapper over the Neo4j Python driver for the temporal knowledge graph.
Handles connection lifecycle, node/edge CRUD, and graph queries.
"""

from __future__ import annotations

import logging
from typing import Any

from neo4j import AsyncGraphDatabase, AsyncDriver

from app.config import get_settings
from app.codebase.schemas import GraphNode, GraphEdge, NodeType, EdgeType

logger = logging.getLogger(__name__)

# Fields that are part of the GraphNode schema (excluded from properties dict)
_SCHEMA_FIELDS = frozenset(("id", "label", "type"))


class GraphDB:
    """Neo4j async client for the CodeMind temporal knowledge graph."""

    __slots__ = ("_driver",)

    def __init__(self) -> None:
        self._driver: AsyncDriver | None = None

    # ── Connection Lifecycle ──

    async def connect(self) -> None:
        """Establish connection to Neo4j."""
        settings = get_settings()
        try:
            self._driver = AsyncGraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password),
            )
            # Verify connectivity
            await self._driver.verify_connectivity()
            logger.info("Connected to Neo4j at %s", settings.neo4j_uri)
        except Exception as e:
            logger.error("Failed to connect to Neo4j: %s", e)
            self._driver = None
            raise

    async def close(self) -> None:
        """Close the Neo4j connection."""
        if self._driver:
            await self._driver.close()
            self._driver = None
            logger.info("Neo4j connection closed")

    @property
    def connected(self) -> bool:
        return self._driver is not None

    def _require_connection(self) -> AsyncDriver:
        """Return the driver or raise if not connected."""
        if self._driver is None:
            raise RuntimeError("Neo4j is not connected — call connect() first")
        return self._driver

    # ── Shared Helpers ──

    @staticmethod
    def _to_graph_node(data: dict[str, Any]) -> GraphNode:
        """Convert a Neo4j record dict to a GraphNode model."""
        return GraphNode(
            id=data["id"],
            label=data.get("label", ""),
            type=NodeType(data.get("type", "module")),
            properties={k: v for k, v in data.items() if k not in _SCHEMA_FIELDS},
        )

    @staticmethod
    def _resolve_edge_type(rel_type_str: str) -> EdgeType:
        """Resolve a relationship type string to an EdgeType enum, with fallback."""
        try:
            return EdgeType(rel_type_str.lower())
        except ValueError:
            return EdgeType.DEPENDS

    # ── Node Operations ──

    VALID_REL_TYPES = frozenset(e.value.upper() for e in EdgeType)

    async def create_node(
        self,
        node_id: str,
        label: str,
        node_type: NodeType,
        properties: dict[str, Any] | None = None,
    ) -> GraphNode:
        """Create or merge a node in the graph."""
        driver = self._require_connection()
        props = properties or {}
        props.update({"id": node_id, "label": label, "type": node_type.value})

        query = """
        MERGE (n:Entity {id: $id})
        SET n += $props, n.updated_at = timestamp()
        RETURN n
        """
        async with driver.session() as session:
            result = await session.run(query, id=node_id, props=props)
            record = await result.single()
            return self._to_graph_node(dict(record["n"]))

    async def create_edge(
        self,
        from_id: str,
        to_id: str,
        edge_type: EdgeType,
        properties: dict[str, Any] | None = None,
    ) -> None:
        """Create a relationship between two nodes."""
        driver = self._require_connection()
        props = properties or {}
        rel_type = edge_type.value.upper()
        if rel_type not in self.VALID_REL_TYPES:
            raise ValueError(f"Invalid relationship type: {rel_type}")

        query = f"""
        MATCH (a:Entity {{id: $from_id}})
        MATCH (b:Entity {{id: $to_id}})
        MERGE (a)-[r:{rel_type}]->(b)
        SET r += $props, r.updated_at = timestamp()
        """
        async with driver.session() as session:
            await session.run(query, from_id=from_id, to_id=to_id, props=props)

    async def bulk_create_nodes(self, nodes: list[dict[str, Any]]) -> int:
        """Create or merge numerous nodes in a bulk UNWIND transaction."""
        if not nodes:
            return 0
        driver = self._require_connection()
        query = """
        UNWIND $batch AS process
        MERGE (n:Entity {id: process.id})
        SET n += coalesce(process.properties, {}), n.label = process.label, n.type = process.type, n.updated_at = timestamp()
        """
        async with driver.session() as session:
            await session.run(query, batch=nodes)
        return len(nodes)

    async def bulk_create_edges(self, edges: list[dict[str, Any]]) -> int:
        """Create numerous relationships grouped by type."""
        if not edges:
            return 0
        driver = self._require_connection()
        grouped: dict[str, list[dict[str, Any]]] = {}
        for e in edges:
            rel = e["type"].value.upper() if hasattr(e["type"], "value") else str(e["type"]).upper()
            if rel not in grouped:
                grouped[rel] = []
            grouped[rel].append(e)

        async with driver.session() as session:
            for rel_type, batch in grouped.items():
                query = f"""
                UNWIND $batch AS process
                MATCH (a:Entity {{id: process.from_id}})
                MATCH (b:Entity {{id: process.to_id}})
                MERGE (a)-[r:{rel_type}]->(b)
                SET r += coalesce(process.properties, {{}}), r.updated_at = timestamp()
                """
                await session.run(query, batch=batch)
        return len(edges)

    async def get_node(self, node_id: str) -> GraphNode | None:
        """Get a single node by ID."""
        driver = self._require_connection()
        query = "MATCH (n:Entity {id: $id}) RETURN n"
        async with driver.session() as session:
            result = await session.run(query, id=node_id)
            record = await result.single()
            if not record:
                return None
            return self._to_graph_node(dict(record["n"]))

    # ── Graph Queries ──

    async def get_graph(self) -> dict[str, list]:
        """Return the full graph for visualization."""
        driver = self._require_connection()
        node_query = "MATCH (n:Entity) RETURN n"
        edge_query = "MATCH (a:Entity)-[r]->(b:Entity) RETURN a.id AS from_id, b.id AS to_id, type(r) AS rel_type, properties(r) AS props"

        nodes: list[GraphNode] = []
        edges: list[GraphEdge] = []

        async with driver.session() as session:
            # Fetch nodes
            result = await session.run(node_query)
            async for record in result:
                nodes.append(self._to_graph_node(dict(record["n"])))

            # Fetch edges
            result = await session.run(edge_query)
            async for record in result:
                etype = self._resolve_edge_type(record["rel_type"])
                edges.append(GraphEdge(
                    from_id=record["from_id"],
                    to_id=record["to_id"],
                    type=etype,
                    properties=record["props"] or {},
                ))

        return {"nodes": nodes, "edges": edges}

    async def get_node_neighbors(
        self, node_id: str, depth: int = 2
    ) -> dict[str, list]:
        """Get a node and its neighbors up to `depth` hops."""
        driver = self._require_connection()
        # Security: Strictly bound integer variable against injection natively
        safe_depth = max(1, min(int(depth), 5)) 

        query = f"""
        MATCH path = (start:Entity {{id: $id}})-[*1..{safe_depth}]-(neighbor:Entity)
        WITH nodes(path) AS ns, relationships(path) AS rs
        UNWIND ns AS n
        WITH COLLECT(DISTINCT n) AS all_nodes, rs
        UNWIND rs AS r
        RETURN all_nodes, COLLECT(DISTINCT {{
            from_id: startNode(r).id,
            to_id: endNode(r).id,
            rel_type: type(r)
        }}) AS all_edges
        """
        nodes: list[GraphNode] = []
        edges: list[GraphEdge] = []

        async with driver.session() as session:
            result = await session.run(query, id=node_id)
            record = await result.single()
            if record:
                for n in record["all_nodes"]:
                    nodes.append(self._to_graph_node(dict(n)))
                for e in record["all_edges"]:
                    etype = self._resolve_edge_type(e["rel_type"])
                    edges.append(GraphEdge(from_id=e["from_id"], to_id=e["to_id"], type=etype))

        return {"nodes": nodes, "edges": edges}

    async def get_node_history(self, node_id: str) -> list[dict]:
        """Get the temporal history of a node (commits touching it)."""
        driver = self._require_connection()
        query = """
        MATCH (n:Entity {id: $id})<-[r]-(c:Entity {type: 'commit'})
        RETURN c.id AS commit_id, c.label AS label, c.timestamp AS ts,
               c.author AS author, c.message AS message, type(r) AS rel_type
        ORDER BY c.timestamp DESC
        """
        history: list[dict] = []
        async with driver.session() as session:
            result = await session.run(query, id=node_id)
            async for record in result:
                history.append({
                    "commit_id": record["commit_id"],
                    "label": record["label"],
                    "timestamp": record["ts"],
                    "author": record["author"],
                    "message": record["message"],
                    "relationship": record["rel_type"],
                })
        return history

    async def get_stats(self) -> dict:
        """Get graph statistics."""
        driver = self._require_connection()
        query = """
        MATCH (n:Entity) WITH count(n) AS nodes
        OPTIONAL MATCH ()-[r]->() WITH nodes, count(r) AS edges
        OPTIONAL MATCH (c:Entity {type: 'commit'}) 
        RETURN nodes, edges, count(c) AS commits
        """
        async with driver.session() as session:
            result = await session.run(query)
            record = await result.single()
            return {
                "nodes": record["nodes"] if record else 0,
                "edges": record["edges"] if record else 0,
                "commits": record["commits"] if record else 0,
            }

    async def query(self, cypher: str, params: dict | None = None) -> list[dict]:
        """Execute a raw Cypher query and return results as dicts."""
        driver = self._require_connection()
        async with driver.session() as session:
            result = await session.run(cypher, **(params or {}))
            return [dict(record) async for record in result]

    # ── User Operations (Auth) ──

    async def get_user_by_email(self, email: str) -> dict | None:
        """Fetch a User node by email."""
        driver = self._require_connection()
        query = "MATCH (u:User {email: $email}) RETURN u"
        async with driver.session() as session:
            result = await session.run(query, email=email)
            record = await result.single()
            if not record:
                return None
            return dict(record["u"])

    async def create_user(self, email: str, hashed_password: str, verification_code: str) -> dict:
        """Create a new unverified user."""
        driver = self._require_connection()
        query = """
        MERGE (u:User {email: $email})
        ON CREATE SET u.hashed_password = $hashed_password,
                      u.is_verified = false,
                      u.verification_code = $verification_code,
                      u.created_at = timestamp()
        RETURN u
        """
        async with driver.session() as session:
            result = await session.run(
                query,
                email=email,
                hashed_password=hashed_password,
                verification_code=verification_code
            )
            record = await result.single()
            return dict(record["u"])

    async def verify_user(self, email: str) -> bool:
        """Mark a user as verified."""
        driver = self._require_connection()
        query = """
        MATCH (u:User {email: $email})
        SET u.is_verified = true, u.verification_code = null
        RETURN u
        """
        async with driver.session() as session:
            result = await session.run(query, email=email)
            record = await result.single()
            return bool(record)

    async def increment_verification_attempts(self, email: str) -> None:
        """Increment verification attempts for an unverified user."""
        driver = self._require_connection()
        query = """
        MATCH (u:User {email: $email})
        SET u.verification_attempts = coalesce(u.verification_attempts, 0) + 1
        """
        async with driver.session() as session:
            await session.run(query, email=email)
