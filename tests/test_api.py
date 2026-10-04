from fastapi.testclient import TestClient
from app.api import app

def test_health():
    client=TestClient(app)
    assert client.get("/health").json()["status"] == "ok"
