import httpx
import json
import pytest

from app.core.config import settings
from app.services.local_ai import AIServiceError, OllamaAI


@pytest.fixture
def cloud_settings(monkeypatch):
    monkeypatch.setattr(settings, "OLLAMA_GENERATION_BASE_URL", "https://ollama.com")
    monkeypatch.setattr(settings, "OLLAMA_CLOUD_API_KEY", "test-key")
    monkeypatch.setattr(settings, "OLLAMA_TEXT_MODEL", "gpt-oss:120b-cloud")
    monkeypatch.setattr(settings, "OLLAMA_EMBEDDING_BASE_URL", "http://ollama:11434")
    monkeypatch.setattr(settings, "OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:0.6b")


def test_generation_uses_ollama_cloud_and_cloud_model(cloud_settings):
    seen = {}

    def handler(request):
        seen["url"] = str(request.url)
        seen["auth"] = request.headers.get("authorization")
        seen["payload"] = json.loads(request.content)
        return httpx.Response(200, json={"message": {"content": "Cloud answer"}})

    answer = OllamaAI(httpx.MockTransport(handler)).chat([{"role": "user", "content": "Hello"}])
    assert answer == "Cloud answer"
    assert seen["url"] == "https://ollama.com/api/chat"
    assert seen["auth"] == "Bearer test-key"
    assert seen["payload"]["model"] == "gpt-oss:120b-cloud"


def test_direct_cloud_requires_an_api_key(monkeypatch, cloud_settings):
    monkeypatch.setattr(settings, "OLLAMA_CLOUD_API_KEY", "")
    with pytest.raises(AIServiceError, match="OLLAMA_CLOUD_API_KEY"):
        OllamaAI()


def test_rejects_a_local_generation_model(monkeypatch, cloud_settings):
    monkeypatch.setattr(settings, "OLLAMA_TEXT_MODEL", "gpt-oss:120b")
    with pytest.raises(AIServiceError, match="ending in -cloud"):
        OllamaAI()


def test_cloud_auth_failure_has_a_safe_message(cloud_settings):
    transport = httpx.MockTransport(lambda request: httpx.Response(401, json={"error": "invalid token"}))
    with pytest.raises(AIServiceError, match="authentication failed"):
        OllamaAI(transport).chat([])


def test_embedding_count_must_match(cloud_settings):
    def handler(request):
        assert str(request.url) == "http://ollama:11434/api/embed"
        assert request.headers.get("authorization") is None
        return httpx.Response(200, json={"embeddings": [[1.0]]})

    with pytest.raises(AIServiceError, match="invalid vectors"):
        OllamaAI(httpx.MockTransport(handler)).embed(["one", "two"])
