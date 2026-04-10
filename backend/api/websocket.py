"""
WebSocket Handler

Real-time streaming for Q&A responses and graph updates.
Provides live token-by-token streaming of LLM reasoning
and push notifications for drift alerts and ingestion progress.
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

router = APIRouter()

# Shared clients — set by main.py
_graph_db = None
_vector_db = None
_llm = None


def set_clients(graph_db, vector_db, llm):
    """Called by main.py to inject shared client instances."""
    global _graph_db, _vector_db, _llm
    _graph_db = graph_db
    _vector_db = vector_db
    _llm = llm


class ConnectionManager:
    """Manages active WebSocket connections with per-channel tracking."""

    def __init__(self) -> None:
        self.query_connections: list[WebSocket] = []
        self.graph_connections: list[WebSocket] = []

    async def connect_query(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.query_connections.append(websocket)
        logger.info("Query WS connected (%d total)", len(self.query_connections))

    async def connect_graph(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.graph_connections.append(websocket)
        logger.info("Graph WS connected (%d total)", len(self.graph_connections))

    def disconnect_query(self, websocket: WebSocket) -> None:
        if websocket in self.query_connections:
            self.query_connections.remove(websocket)
        logger.info("Query WS disconnected (%d remaining)", len(self.query_connections))

    def disconnect_graph(self, websocket: WebSocket) -> None:
        if websocket in self.graph_connections:
            self.graph_connections.remove(websocket)
        logger.info("Graph WS disconnected (%d remaining)", len(self.graph_connections))

    async def broadcast_graph(self, message: dict) -> None:
        """Send a message to all graph WebSocket connections."""
        disconnected: list[WebSocket] = []
        for ws in self.graph_connections:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect_graph(ws)


manager = ConnectionManager()


@router.websocket("/ws/query")
async def query_stream(websocket: WebSocket):
    """
    WebSocket endpoint for streaming Q&A responses.

    Client sends: {"question": "...", "top_k": 10}
    Server streams back:
      {"type": "trace_step", "content": "Planning..."}
      {"type": "token", "content": "The"}
      {"type": "token", "content": " answer"}
      {"type": "done", "content": "", "metadata": {"hops": 3}}
    """
    await manager.connect_query(websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "content": "Invalid JSON"})
                continue

            question = data.get("question", "").strip()
            if not question:
                await websocket.send_json({"type": "error", "content": "question is required"})
                continue

            top_k = data.get("top_k", 10)

            # Check if services are available
            if not _llm or not _llm.available:
                await websocket.send_json({
                    "type": "error",
                    "content": "LLM not available. Ensure Ollama is running.",
                })
                continue

            # Run retrieval + streaming reasoning
            try:
                from agents.retrieval import RetrievalAgent
                from agents.reasoning import ReasoningAgent

                retrieval = RetrievalAgent(_graph_db, _vector_db, _llm)
                reasoning = ReasoningAgent(_llm)

                # Retrieve context
                await websocket.send_json({
                    "type": "trace_step",
                    "content": "Searching knowledge graph...",
                })

                context = await retrieval.retrieve(question, top_k=top_k)

                await websocket.send_json({
                    "type": "trace_step",
                    "content": f"Found {len(context)} relevant chunks",
                })

                # Stream reasoning
                async for chunk in reasoning.stream_reason(question, context):
                    await websocket.send_json(chunk.model_dump())

            except Exception as e:
                logger.error("WS query error: %s", e, exc_info=True)
                await websocket.send_json({
                    "type": "error",
                    "content": f"Reasoning error: {str(e)}",
                })

    except WebSocketDisconnect:
        manager.disconnect_query(websocket)
    except Exception as e:
        logger.error("WS unexpected error: %s", e)
        manager.disconnect_query(websocket)


@router.websocket("/ws/graph")
async def graph_updates(websocket: WebSocket):
    """
    WebSocket endpoint for real-time graph update notifications.
    Used during ingestion to push progress updates to the frontend.

    Server pushes:
      {"type": "node_added", "data": {...}}
      {"type": "edge_added", "data": {...}}
      {"type": "ingestion_progress", "progress": 0.5}
      {"type": "ingestion_complete"}
    """
    await manager.connect_graph(websocket)

    try:
        while True:
            # Keep connection alive — just listen for pings/close
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_graph(websocket)
    except Exception as e:
        logger.error("Graph WS error: %s", e)
        manager.disconnect_graph(websocket)


# Public access to broadcast
async def notify_graph_update(event_type: str, data: dict | None = None):
    """Broadcast a graph update event to all connected clients."""
    await manager.broadcast_graph({
        "type": event_type,
        "data": data or {},
    })
