"""
CodeMind Pydantic Models

Request/response schemas for all API endpoints and inter-agent data contracts.
"""

from __future__ import annotations
from enum import Enum
from pydantic import BaseModel, Field


# ── Enums ──

class NodeType(str, Enum):
    MODULE = "module"
    FUNCTION = "func"
    COMMIT = "commit"
    PR = "pr"
    DRIFT = "drift"
    FILE = "file"


class EdgeType(str, Enum):
    DEPENDS = "depends"
    INTRODUCED = "introduced"
    REFACTORED = "refactored"
    CALLS = "calls"
    IMPORTS = "imports"


class DriftSeverity(str, Enum):
    BEHAVIOR_DRIFT = "BEHAVIOR_DRIFT"
    MISSING_INTENT = "MISSING_INTENT"
    CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION"


# ── Graph Models ──

class GraphNode(BaseModel):
    id: str
    label: str
    type: NodeType
    properties: dict = Field(default_factory=dict)


class GraphEdge(BaseModel):
    from_id: str = Field(serialization_alias="source")
    to_id: str = Field(serialization_alias="target")
    type: EdgeType
    properties: dict = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class GraphResponse(BaseModel):
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []


# ── Ingestion ──

class IngestRequest(BaseModel):
    repo_path: str = Field(..., max_length=500)
    branch: str = Field("main", max_length=100)
    max_commits: int | None = None


class IngestResponse(BaseModel):
    status: str
    repo_path: str
    task_id: str = ""
    message: str = ""


class ChunkRecord(BaseModel):
    """A single chunk produced by the ingestion agent."""
    id: str
    content: str
    source_file: str = ""
    commit_hash: str = ""
    commit_message: str = ""
    author: str = ""
    timestamp: str = ""
    chunk_type: str = "code"  # code, commit_message, diff
    metadata: dict = Field(default_factory=dict)


# ── Query ──

class QueryRequest(BaseModel):
    question: str = Field(..., max_length=2000)
    max_hops: int = Field(3, ge=1, le=10)
    top_k: int = Field(10, ge=1, le=100)


class Citation(BaseModel):
    badge: str
    text: str
    source_id: str = ""


class TraceStep(BaseModel):
    label: str
    done: bool = False
    detail: str = ""


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation] = []
    reasoning_trace: list[TraceStep] = []
    hops: int = 0


# ── Streaming (WebSocket) ──

class StreamChunk(BaseModel):
    """A single chunk in a streaming response."""
    type: str  # "token", "trace_step", "citation", "done", "error"
    content: str = ""
    metadata: dict = Field(default_factory=dict)


# ── Drift Detection ──

class DriftAlert(BaseModel):
    file: str
    message: str
    severity: DriftSeverity
    time_ago: str = ""
    commit_hash: str = ""


class DriftResponse(BaseModel):
    alerts: list[DriftAlert] = []
    total: int = 0


# ── Onboarding ──

class OnboardingRequest(BaseModel):
    module_path: str = Field(..., max_length=500)


class OnboardingStep(BaseModel):
    date: str
    title: str
    description: str
    type: str  # create, refactor, fix, feature
    commit: str = ""
    pr: str = ""


class OnboardingResponse(BaseModel):
    module: str
    summary: str = ""
    steps: list[OnboardingStep] = []


# ── Timeline ──

class TimelineEvent(BaseModel):
    id: str
    title: str
    description: str
    date: str
    type: str  # commit, pr, drift, release
    hash: str = ""


class TimelineResponse(BaseModel):
    events: list[TimelineEvent] = []
    total: int = 0


# ── Status ──

class StatusResponse(BaseModel):
    nodes: int = 0
    edges: int = 0
    commits: int = 0
    model: str = ""
    avg_query_ms: float = 0
    drift_count: int = 0
    indexed_repos: list[str] = []
