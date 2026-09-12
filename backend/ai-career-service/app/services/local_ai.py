"""Local Ollama transport; never falls back to a cloud provider."""
import math
from urllib.parse import urlparse

import httpx

from app.core.config import settings


class LocalAI:
    def __init__(self, transport=None):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        url = urlparse(self.base_url)
        if (url.scheme != "http" or url.hostname not in {"localhost", "127.0.0.1", "ollama"}
                or url.username or url.password or url.query or url.fragment
                or url.path not in {"", "/"}):
            raise ValueError("Only the local Ollama service is allowed")
        self.transport = transport

    def _post(self, endpoint, payload):
        if "cloud" in payload["model"].lower() or "/" in payload["model"]:
            raise ValueError("Cloud models are disabled")
        with httpx.Client(timeout=180, trust_env=False, transport=self.transport) as client:
            response = client.post(self.base_url + endpoint, json=payload)
            response.raise_for_status()
            return response.json()

    def chat(self, messages):
        data = self._post("/api/chat", {
            "model": settings.OLLAMA_TEXT_MODEL,
            "messages": messages, "stream": False, "think": False,
            "options": {"temperature": 0.2, "num_ctx": 4096, "num_predict": 400},
        })
        answer = data["message"]["content"]
        if not isinstance(answer, str) or not answer.strip():
            raise ValueError("Local model returned an empty answer")
        return answer

    def embed(self, texts):
        if not texts:
            return []
        data = self._post("/api/embed", {
            "model": settings.OLLAMA_EMBEDDING_MODEL,
            "input": texts, "truncate": False,
        })
        vectors = data["embeddings"]
        if (len(vectors) != len(texts) or not vectors[0]
                or any(len(v) != len(vectors[0]) for v in vectors)
                or any(not math.isfinite(n) for v in vectors for n in v)):
            raise ValueError("Invalid local embeddings")
        return vectors
