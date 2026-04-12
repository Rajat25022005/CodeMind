import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.auth.service import AuthService
from app.core.graph_db import GraphDB

@pytest.fixture(autouse=True)
def mock_graph_db():
    with patch("app.core.graph_db.GraphDB.connect", new_callable=AsyncMock) as m_conn, \
         patch("app.core.vector_db.VectorDB.connect", new_callable=AsyncMock) as m_vconn, \
         patch("app.core.vector_db.VectorDB.ensure_collection", new_callable=AsyncMock) as m_vcoll, \
         patch("app.core.llm.LLMClient.connect", new_callable=AsyncMock) as m_lconn, \
         patch("app.core.graph_db.GraphDB.close", new_callable=AsyncMock), \
         patch("app.core.vector_db.VectorDB.close", new_callable=AsyncMock), \
         patch("app.core.llm.LLMClient.close", new_callable=AsyncMock):
        
        # We also want to mock the DB actual functions that get hit during tests
        with patch.object(GraphDB, "get_user_by_email", new_callable=AsyncMock) as m_get_user, \
             patch.object(GraphDB, "create_user", new_callable=AsyncMock) as m_create_user, \
             patch.object(GraphDB, "verify_user", new_callable=AsyncMock) as m_verify_user, \
             patch.object(GraphDB, "get_graph", new_callable=AsyncMock) as m_get_graph, \
             patch.object(GraphDB, "get_stats", new_callable=AsyncMock) as m_get_stats:
            
            m_get_user.return_value = None
            m_verify_user.return_value = True
            m_get_graph.return_value = {"nodes": [], "edges": []}
            m_get_stats.return_value = {"nodes": 1, "edges": 1, "commits": 1}

            yield {
                "get_user_by_email": m_get_user,
                "create_user": m_create_user,
                "verify_user": m_verify_user,
                "get_graph": m_get_graph,
                "get_stats": m_get_stats
            }

@pytest.fixture
def client(mock_graph_db):
    # TestClient automatically executes the lifespan context via Starlette
    with TestClient(app) as test_client:
        yield test_client
