"""
API Routes

REST endpoints for CodeMind.
Handles repository ingestion, querying, graph exploration,
drift detection, timeline, files, commits, onboarding, and status.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from models import (
    IngestRequest,
    IngestResponse,
    QueryRequest,
    QueryResponse,
    GraphResponse,
    DriftResponse,
    OnboardingRequest,
    OnboardingResponse,
    TimelineResponse,
    TimelineEvent,
    StatusResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# These are set by main.py at startup
_graph_db = None
_vector_db = None
_llm = None


def set_clients(graph_db, vector_db, llm):
    """Called by main.py to inject shared client instances."""
    global _graph_db, _vector_db, _llm
    _graph_db = graph_db
    _vector_db = vector_db
    _llm = llm


def _get_agents():
    """Lazy-construct agents from shared clients."""
    from agents.ingestion import IngestionAgent
    from agents.graph_builder import GraphBuilderAgent
    from agents.retrieval import RetrievalAgent
    from agents.reasoning import ReasoningAgent
    from agents.synthesis import SynthesisAgent

    return {
        "graph_builder": GraphBuilderAgent(_graph_db, _vector_db, _llm),
        "retrieval": RetrievalAgent(_graph_db, _vector_db, _llm),
        "reasoning": ReasoningAgent(_llm),
        "synthesis": SynthesisAgent(_graph_db, _llm),
    }


# ── Ingestion ──

async def _run_ingestion(repo_path: str, branch: str, max_commits: int | None):
    """Background task: run the full ingestion + graph build pipeline."""
    from agents.ingestion import IngestionAgent
    from agents.graph_builder import GraphBuilderAgent

    try:
        logger.info("Background ingestion started for %s", repo_path)
        agent = IngestionAgent(repo_path)
        result = await agent.ingest(max_commits=max_commits, branch=branch)

        chunks = result.get("chunks", [])
        if chunks and _graph_db and _vector_db and _llm:
            builder = GraphBuilderAgent(_graph_db, _vector_db, _llm)
            await builder.build_graph(chunks)

        logger.info("Background ingestion completed for %s", repo_path)
    except Exception as e:
        logger.error("Background ingestion failed: %s", e, exc_info=True)


@router.post("/ingest", response_model=IngestResponse)
async def ingest_repository(
    request: IngestRequest,
    background_tasks: BackgroundTasks,
):
    """
    Ingest a local git repository.
    Runs as a background task — returns immediately with a task ID.
    """
    task_id = str(uuid.uuid4())[:8]
    background_tasks.add_task(
        _run_ingestion, request.repo_path, request.branch, request.max_commits
    )

    return IngestResponse(
        status="accepted",
        repo_path=request.repo_path,
        task_id=task_id,
        message=f"Ingestion started. Branch: {request.branch}",
    )


# ── Query ──

@router.post("/query", response_model=QueryResponse)
async def query_codebase(request: QueryRequest):
    """
    Query the codebase knowledge graph.
    Performs hybrid retrieval + multi-hop reasoning.
    """
    if not _llm:
        raise HTTPException(503, "LLM client not available")

    agents = _get_agents()

    # Retrieve relevant context
    context = await agents["retrieval"].retrieve(
        request.question, top_k=request.top_k
    )

    # Reason over context
    response = await agents["reasoning"].reason(request.question, context)
    return response


# ── Graph ──

@router.get("/graph", response_model=GraphResponse)
async def get_graph():
    """Return the full knowledge graph for visualization."""
    if not _graph_db or not _graph_db.connected:
        raise HTTPException(503, "Graph database not available")

    data = await _graph_db.get_graph()
    return GraphResponse(nodes=data["nodes"], edges=data["edges"])


@router.get("/graph/{node_id}")
async def get_node_neighbors(node_id: str, depth: int = 2):
    """Get a node and its neighbors."""
    if not _graph_db or not _graph_db.connected:
        raise HTTPException(503, "Graph database not available")

    data = await _graph_db.get_node_neighbors(node_id, depth=depth)
    return GraphResponse(nodes=data["nodes"], edges=data["edges"])


# ── Drift Detection ──

@router.get("/drift", response_model=DriftResponse)
async def get_drift_alerts(module: str | None = None):
    """Return current drift detection alerts."""
    if not _graph_db or not _llm:
        raise HTTPException(503, "Services not available")

    agents = _get_agents()
    alerts = await agents["synthesis"].detect_drift(module)
    return DriftResponse(alerts=alerts, total=len(alerts))


# ── Onboarding ──

@router.post("/onboard", response_model=OnboardingResponse)
async def get_onboarding(request: OnboardingRequest):
    """Generate an onboarding walkthrough for a module."""
    if not _graph_db or not _llm:
        raise HTTPException(503, "Services not available")

    agents = _get_agents()
    return await agents["synthesis"].onboard(request.module_path)


# ── Timeline ──

@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(limit: int = 50):
    """Return chronological events from the knowledge graph."""
    if not _graph_db or not _graph_db.connected:
        raise HTTPException(503, "Graph database not available")

    records = await _graph_db.query(
        "MATCH (n:Entity) WHERE n.timestamp IS NOT NULL "
        "RETURN n.id AS id, n.label AS title, "
        "COALESCE(n.message, n.label) AS description, "
        "n.timestamp AS date, n.type AS type "
        "ORDER BY n.timestamp DESC LIMIT $limit",
        {"limit": limit},
    )

    events = [
        TimelineEvent(
            id=r.get("id", ""),
            title=r.get("title", ""),
            description=r.get("description", ""),
            date=r.get("date", ""),
            type=r.get("type", "commit"),
            hash=r.get("id", ""),
        )
        for r in records
    ]

    return TimelineResponse(events=events, total=len(events))


# ── Files ──

@router.get("/files")
async def get_files():
    """Return indexed file list from the knowledge graph."""
    if not _graph_db or not _graph_db.connected:
        raise HTTPException(503, "Graph database not available")

    records = await _graph_db.query(
        "MATCH (f:Entity {type: 'file'}) "
        "OPTIONAL MATCH (f)<-[r]-(c:Entity {type: 'commit'}) "
        "RETURN f.id AS id, f.label AS path, f.language AS language, "
        "f.lines AS lines, count(c) AS commit_count "
        "ORDER BY f.label"
    )

    return {
        "files": [
            {
                "id": r.get("id", ""),
                "path": r.get("path", ""),
                "language": r.get("language", ""),
                "lines": r.get("lines", 0),
                "commit_count": r.get("commit_count", 0),
            }
            for r in records
        ]
    }


# ── Commits ──

@router.get("/commits")
async def get_commits(limit: int = 50):
    """Return commit history from the knowledge graph."""
    if not _graph_db or not _graph_db.connected:
        raise HTTPException(503, "Graph database not available")

    records = await _graph_db.query(
        "MATCH (c:Entity {type: 'commit'}) "
        "OPTIONAL MATCH (c)-[r]->(f:Entity) "
        "RETURN c.id AS id, c.label AS hash, c.message AS message, "
        "c.author AS author, c.timestamp AS date, "
        "c.files_changed AS files_changed, count(f) AS graph_nodes "
        "ORDER BY c.timestamp DESC LIMIT $limit",
        {"limit": limit},
    )

    return {
        "commits": [
            {
                "hash": r.get("hash", ""),
                "message": r.get("message", ""),
                "author": r.get("author", ""),
                "date": r.get("date", ""),
                "files_changed": r.get("files_changed", 0),
                "graph_nodes": r.get("graph_nodes", 0),
            }
            for r in records
        ]
    }


# ── Status ──

@router.get("/status", response_model=StatusResponse)
async def get_status():
    """Return system status — node/edge counts, model info, drift count."""
    stats = {"nodes": 0, "edges": 0, "commits": 0}

    if _graph_db and _graph_db.connected:
        try:
            stats = await _graph_db.get_stats()
        except Exception as e:
            logger.warning("Could not fetch graph stats: %s", e)

    model = ""
    if _llm and _llm.available:
        from config import get_settings
        model = get_settings().ollama_model

    drift_count = 0
    if _graph_db and _graph_db.connected and _llm:
        try:
            agents = _get_agents()
            alerts = await agents["synthesis"].detect_drift()
            drift_count = len(alerts)
        except Exception:
            pass

    return StatusResponse(
        nodes=stats.get("nodes", 0),
        edges=stats.get("edges", 0),
        commits=stats.get("commits", 0),
        model=model,
        drift_count=drift_count,
    )
