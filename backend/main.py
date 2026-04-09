"""
CodeMind Backend - Main Application Entry Point

FastAPI application serving the CodeMind API.
Provides REST endpoints and WebSocket connections for
the temporal knowledge graph engine.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as api_router
from api.websocket import router as ws_router

app = FastAPI(
    title="CodeMind API",
    description="AI-native codebase memory engine",
    version="0.1.0",
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(api_router, prefix="/api")
app.include_router(ws_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "codemind-api"}
