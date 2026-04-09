"""
WebSocket Handler

Real-time streaming for Q&A responses and graph updates.
Provides live token-by-token streaming of LLM reasoning
and push notifications for drift alerts.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)


manager = ConnectionManager()


@router.websocket("/ws/query")
async def query_stream(websocket: WebSocket):
    """WebSocket endpoint for streaming Q&A responses."""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            question = data.get("question", "")

            # TODO: Wire up ReasoningAgent with streaming
            await websocket.send_json({
                "type": "answer",
                "content": f"Processing: {question}",
                "done": True,
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/ws/graph")
async def graph_updates(websocket: WebSocket):
    """WebSocket endpoint for real-time graph update notifications."""
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
