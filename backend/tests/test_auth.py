import pytest
from app.core.security import get_password_hash

# Since we use TestClient, tests are run synchronously but they hit async endpoints
def test_register(client, mock_graph_db):
    response = client.post("/api/auth/register", json={"email": "test@example.com", "password": "password123"})
    assert response.status_code == 201
    assert response.json()["message"] == "Verification code sent to email"
    mock_graph_db["create_user"].assert_called_once()

def test_register_already_exists(client, mock_graph_db):
    mock_graph_db["get_user_by_email"].return_value = {"email": "test@example.com"}
    response = client.post("/api/auth/register", json={"email": "test@example.com", "password": "password123"})
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_login(client, mock_graph_db):
    hashed_pw = get_password_hash("password123")
    mock_graph_db["get_user_by_email"].return_value = {
        "id": "123",
        "email": "test@example.com",
        "hashed_password": hashed_pw,
        "is_verified": True
    }
    
    response = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password123"})
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

def test_login_unverified(client, mock_graph_db):
    hashed_pw = get_password_hash("password123")
    mock_graph_db["get_user_by_email"].return_value = {
        "id": "123",
        "email": "test@example.com",
        "hashed_password": hashed_pw,
        "is_verified": False
    }
    
    response = client.post("/api/auth/login", json={"email": "test@example.com", "password": "password123"})
    assert response.status_code == 403
    assert "Email not verified" in response.json()["detail"]
