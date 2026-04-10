"""
CodeMind Backend — Main Application Entry Point

FastAPI application serving the CodeMind API.
Provides REST endpoints and WebSocket connections for
the temporal knowledge graph engine.

Lifecycle:
  - startup: connect to Neo4j, Qdrant, verify Ollama
  - shutdown: close all connections
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from core.graph_db import GraphDB
from core.vector_db import VectorDB
from core.llm import LLMClient
from api.routes import router as api_router
from api.routes import set_clients as set_route_clients
from api.websocket import router as ws_router
from api.websocket import set_clients as set_ws_clients

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── Shared clients ──
graph_db = GraphDB()
vector_db = VectorDB()
llm = LLMClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown hooks."""
    settings = get_settings()
    logger.info("CodeMind API starting up...")

    # Connect Neo4j
    try:
        await graph_db.connect()
    except Exception as e:
        logger.warning("Neo4j unavailable — graph features disabled: %s", e)

    # Connect Qdrant
    try:
        await vector_db.connect()
        await vector_db.ensure_collection()
    except Exception as e:
        logger.warning("Qdrant unavailable — vector search disabled: %s", e)

    # Connect Ollama / LLM
    try:
        await llm.connect()
    except Exception as e:
        logger.warning("Ollama unavailable — LLM features disabled: %s", e)

    # Inject clients into route and WebSocket modules
    set_route_clients(graph_db, vector_db, llm)
    set_ws_clients(graph_db, vector_db, llm)

    logger.info(
        "Startup complete — Neo4j: %s, Qdrant: %s, LLM: %s",
        "✓" if graph_db.connected else "✗",
        "✓" if vector_db.connected else "✗",
        "✓" if llm.available else "✗",
    )

    yield  # App runs here

    # Shutdown
    logger.info("CodeMind API shutting down...")
    await llm.close()
    await vector_db.close()
    await graph_db.close()
    logger.info("All connections closed")


app = FastAPI(
    title="CodeMind API",
    description="AI-native codebase memory engine",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(api_router, prefix="/api")
app.include_router(ws_router)


@app.get("/health")
async def health_check():
    """Health check endpoint with service status."""
    return {
        "status": "ok",
        "service": "codemind-api",
        "neo4j": graph_db.connected,
        "qdrant": vector_db.connected,
        "ollama": llm.available,
    }
