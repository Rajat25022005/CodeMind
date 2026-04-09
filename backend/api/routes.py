"""
API Routes

REST endpoints for CodeMind.
Handles repository ingestion, querying, graph exploration,
and drift detection.
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/ingest")
async def ingest_repository(payload: dict):
    """
    Ingest a local git repository.
    Expects: {"repo_path": "/absolute/path/to/your/repo"}
    """
    repo_path = payload.get("repo_path", "")
    if not repo_path:
        return {"error": "repo_path is required"}

    # TODO: Wire up IngestionAgent
    return {"status": "accepted", "repo_path": repo_path}


@router.post("/query")
async def query_codebase(payload: dict):
    """
    Query the codebase knowledge graph.
    Expects: {"question": "Why was the auth middleware rewritten?"}
    """
    question = payload.get("question", "")
    if not question:
        return {"error": "question is required"}

    # TODO: Wire up RetrievalAgent + ReasoningAgent
    return {"status": "pending", "question": question}


@router.get("/graph")
async def get_graph():
    """Return the full knowledge graph for visualization."""
    # TODO: Wire up GraphDB query
    return {"nodes": [], "edges": []}


@router.get("/drift")
async def get_drift_alerts():
    """Return current drift detection alerts."""
    # TODO: Wire up drift detection
    return {"alerts": []}
