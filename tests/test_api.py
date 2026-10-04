from fastapi.testclient import TestClient
from app.api import app, settings

def test_health():
    client=TestClient(app)
    assert client.get("/health").json()["status"] == "ok"

def test_protected_endpoint_requires_token(monkeypatch):
    client=TestClient(app)
    monkeypatch.setattr(settings,"api_token","test-token")
    assert client.get("/v1/providers").status_code == 401
    assert client.get("/v1/providers",headers={"Authorization":"Bearer test-token"}).status_code == 200
    monkeypatch.setattr(settings,"api_token","")
