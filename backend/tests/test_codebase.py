import pytest
from app.core.security import create_access_token

@pytest.fixture
def auth_headers():
    token = create_access_token(data={"sub": "123", "email": "test@example.com"})
    return {"Authorization": f"Bearer {token}"}

def test_get_status_unauthorized(client):
    response = client.get("/api/status")
    assert response.status_code == 401

def test_get_status(client, auth_headers):
    response = client.get("/api/status", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["nodes"] == 1
    assert data["edges"] == 1
    assert data["commits"] == 1

def test_get_graph(client, auth_headers):
    response = client.get("/api/graph", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert isinstance(data["nodes"], list)
    assert isinstance(data["edges"], list)
