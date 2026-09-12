import httpx
import pytest
from app.core.config import settings
from app.services.local_ai import LocalAI


def test_rejects_remote_provider(monkeypatch):
    monkeypatch.setattr(settings, "OLLAMA_BASE_URL", "https://api.example.com")
    with pytest.raises(ValueError):
        LocalAI()


def test_rejects_cloud_model(monkeypatch):
    monkeypatch.setattr(settings, "OLLAMA_TEXT_MODEL", "paid:cloud")
    with pytest.raises(ValueError):
        LocalAI().chat([])


def test_provider_failure_does_not_fall_back():
    def fail(request):
        return httpx.Response(503)
    with pytest.raises(httpx.HTTPStatusError):
        LocalAI(httpx.MockTransport(fail)).chat([])


def test_embedding_count_must_match():
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json={"embeddings": [[1.0]]}))
    with pytest.raises(ValueError):
        LocalAI(transport).embed(["one", "two"])
