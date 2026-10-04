from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_agent_status_not_found():
    response = client.get("/agent/status/non-existent-thread-id")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "not_found"


def test_agent_approve_non_existent():
    response = client.post("/agent/approve/non-existent-thread-id")
    assert response.status_code == 404


def test_agent_reject_non_existent():
    response = client.post("/agent/reject/non-existent-thread-id")
    assert response.status_code == 404


def test_agent_run_invalid_user_or_cart():
    # User doesn't exist
    res = client.post("/agent/run", json={"query": "find shoes under 1000", "user_id": 999999, "cart_id": 999999})
    assert res.status_code == 404
    assert "User not found" in res.json()["detail"]
