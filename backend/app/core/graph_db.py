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


class GraphDB:
    """Neo4j async client for the CodeMind temporal knowledge graph."""

    def __init__(self) -> None:
        self._driver: AsyncDriver | None = None

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

    # ── Node Operations ──

    async def create_node(
        self,
        node_id: str,
        label: str,
        node_type: NodeType,
        properties: dict[str, Any] | None = None,
    ) -> GraphNode:
        """Create or merge a node in the graph."""
        props = properties or {}
        props.update({"id": node_id, "label": label, "type": node_type.value})

        query = """
        MERGE (n:Entity {id: $id})
        SET n += $props, n.updated_at = timestamp()
        RETURN n
        """
        async with self._driver.session() as session:
            result = await session.run(query, id=node_id, props=props)
            record = await result.single()
            node_data = dict(record["n"])
            return GraphNode(
                id=node_data["id"],
                label=node_data.get("label", ""),
                type=NodeType(node_data.get("type", "module")),
                properties={k: v for k, v in node_data.items() if k not in ("id", "label", "type")},
            )

    async def create_edge(
        self,
        from_id: str,
        to_id: str,
        edge_type: EdgeType,
        properties: dict[str, Any] | None = None,
    ) -> None:
        """Create a relationship between two nodes."""
        props = properties or {}
        rel_type = edge_type.value.upper()

        query = f"""
        MATCH (a:Entity {{id: $from_id}})
        MATCH (b:Entity {{id: $to_id}})
        MERGE (a)-[r:{rel_type}]->(b)
        SET r += $props, r.updated_at = timestamp()
        """
        async with self._driver.session() as session:
            await session.run(query, from_id=from_id, to_id=to_id, props=props)

    async def get_node(self, node_id: str) -> GraphNode | None:
        """Get a single node by ID."""
        query = "MATCH (n:Entity {id: $id}) RETURN n"
        async with self._driver.session() as session:
            result = await session.run(query, id=node_id)
            record = await result.single()
            if not record:
                return None
            data = dict(record["n"])
            return GraphNode(
                id=data["id"],
                label=data.get("label", ""),
                type=NodeType(data.get("type", "module")),
                properties={k: v for k, v in data.items() if k not in ("id", "label", "type")},
            )

    # ── Graph Queries ──

    async def get_graph(self) -> dict[str, list]:
        """Return the full graph for visualization."""
        node_query = "MATCH (n:Entity) RETURN n"
        edge_query = "MATCH (a:Entity)-[r]->(b:Entity) RETURN a.id AS from_id, b.id AS to_id, type(r) AS rel_type, properties(r) AS props"

        nodes: list[GraphNode] = []
        edges: list[GraphEdge] = []

        async with self._driver.session() as session:
            # Fetch nodes
            result = await session.run(node_query)
            async for record in result:
                data = dict(record["n"])
                nodes.append(GraphNode(
                    id=data["id"],
                    label=data.get("label", ""),
                    type=NodeType(data.get("type", "module")),
                    properties={k: v for k, v in data.items() if k not in ("id", "label", "type")},
                ))

            # Fetch edges
            result = await session.run(edge_query)
            async for record in result:
                rel = record["rel_type"].lower()
                try:
                    etype = EdgeType(rel)
                except ValueError:
                    etype = EdgeType.DEPENDS
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
        query = f"""
        MATCH path = (start:Entity {{id: $id}})-[*1..{depth}]-(neighbor:Entity)
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

        async with self._driver.session() as session:
            result = await session.run(query, id=node_id)
            record = await result.single()
            if record:
                for n in record["all_nodes"]:
                    data = dict(n)
                    nodes.append(GraphNode(
                        id=data["id"],
                        label=data.get("label", ""),
                        type=NodeType(data.get("type", "module")),
                        properties={k: v for k, v in data.items() if k not in ("id", "label", "type")},
                    ))
                for e in record["all_edges"]:
                    rel = e["rel_type"].lower()
                    try:
                        etype = EdgeType(rel)
                    except ValueError:
                        etype = EdgeType.DEPENDS
                    edges.append(GraphEdge(from_id=e["from_id"], to_id=e["to_id"], type=etype))

        return {"nodes": nodes, "edges": edges}

    async def get_node_history(self, node_id: str) -> list[dict]:
        """Get the temporal history of a node (commits touching it)."""
        query = """
        MATCH (n:Entity {id: $id})<-[r]-(c:Entity {type: 'commit'})
        RETURN c.id AS commit_id, c.label AS label, c.timestamp AS ts,
               c.author AS author, c.message AS message, type(r) AS rel_type
        ORDER BY c.timestamp DESC
        """
        history: list[dict] = []
        async with self._driver.session() as session:
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
        async with self._driver.session() as session:
            node_result = await session.run("MATCH (n:Entity) RETURN count(n) AS cnt")
            node_record = await node_result.single()
            node_count = node_record["cnt"] if node_record else 0

            edge_result = await session.run("MATCH ()-[r]->() RETURN count(r) AS cnt")
            edge_record = await edge_result.single()
            edge_count = edge_record["cnt"] if edge_record else 0

            commit_result = await session.run(
                "MATCH (n:Entity {type: 'commit'}) RETURN count(n) AS cnt"
            )
            commit_record = await commit_result.single()
            commit_count = commit_record["cnt"] if commit_record else 0

        return {"nodes": node_count, "edges": edge_count, "commits": commit_count}

    async def query(self, cypher: str, params: dict | None = None) -> list[dict]:
        """Execute a raw Cypher query and return results as dicts."""
        async with self._driver.session() as session:
            result = await session.run(cypher, **(params or {}))
            return [dict(record) async for record in result]

    # ── User Operations (Auth) ──

    async def get_user_by_email(self, email: str) -> dict | None:
        """Fetch a User node by email."""
        query = "MATCH (u:User {email: $email}) RETURN u"
        async with self._driver.session() as session:
            result = await session.run(query, email=email)
            record = await result.single()
            if not record:
                return None
            return dict(record["u"])

    async def create_user(self, email: str, hashed_password: str, verification_code: str) -> dict:
        """Create a new unverified user."""
        query = """
        MERGE (u:User {email: $email})
        ON CREATE SET u.hashed_password = $hashed_password,
                      u.is_verified = false,
                      u.verification_code = $verification_code,
                      u.created_at = timestamp()
        RETURN u
        """
        async with self._driver.session() as session:
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
        query = """
        MATCH (u:User {email: $email})
        SET u.is_verified = true, u.verification_code = null
        RETURN u
        """
        async with self._driver.session() as session:
            result = await session.run(query, email=email)
            record = await result.single()
            return bool(record)
