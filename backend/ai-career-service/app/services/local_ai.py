"""Ollama Cloud generation with a separate local Ollama embedding connection."""
from functools import lru_cache
import math
from urllib.parse import urlparse

import httpx

from app.core.config import settings


class AIServiceError(RuntimeError):
    """A safe, user-facing failure from an AI provider."""


def _valid_endpoint(value, *, direct_cloud=False):
    base_url = value.rstrip("/")
    url = urlparse(base_url)
    clean = not (url.username or url.password or url.query or url.fragment or url.path not in {"", "/"})
    if direct_cloud:
        if clean and url.scheme == "https" and url.hostname == "ollama.com":
            return base_url
        raise ValueError("OLLAMA_GENERATION_BASE_URL must be https://ollama.com or a signed-in local Ollama endpoint")
    if clean and url.scheme == "http" and url.hostname in {"localhost", "127.0.0.1", "ollama"}:
        return base_url
    raise ValueError("OLLAMA_EMBEDDING_BASE_URL must be the local Ollama embedding service")


class OllamaAI:
    def __init__(self, transport=None):
        self.generation_base_url = settings.OLLAMA_GENERATION_BASE_URL.rstrip("/")
        generation_url = urlparse(self.generation_base_url)
        self.direct_cloud = generation_url.scheme == "https" and generation_url.hostname == "ollama.com"
        if self.direct_cloud:
            self.generation_base_url = _valid_endpoint(self.generation_base_url, direct_cloud=True)
            if not settings.OLLAMA_CLOUD_API_KEY.strip():
                raise AIServiceError(
                    "UdaanAI could not connect to the AI inference service. "
                    "Set OLLAMA_CLOUD_API_KEY for Ollama Cloud authentication."
                )
        else:
            # `ollama signin` authenticates this supported local proxy path. It
            # does not download the cloud model weights.
            self.generation_base_url = self._signed_in_local_endpoint(self.generation_base_url)
        self.embedding_base_url = _valid_endpoint(settings.OLLAMA_EMBEDDING_BASE_URL)
        if not settings.OLLAMA_TEXT_MODEL.endswith("-cloud"):
            raise AIServiceError("Text generation must use an Ollama Cloud model ending in -cloud.")
        self.client = httpx.Client(trust_env=False, transport=transport)
        self.last_metrics = {}

    @staticmethod
    def _signed_in_local_endpoint(value):
        base_url = value.rstrip("/")
        url = urlparse(base_url)
        if (url.scheme == "http" and url.hostname in {"localhost", "127.0.0.1", "ollama", "host.docker.internal"}
                and not url.username and not url.password and not url.query and not url.fragment
                and url.path in {"", "/"}):
            return base_url
        raise ValueError("OLLAMA_GENERATION_BASE_URL must be https://ollama.com or a signed-in local Ollama endpoint")

    def _post(self, base_url, endpoint, payload, *, timeout, cloud=False):
        headers = {}
        if cloud:
            headers["Authorization"] = "Bearer " + settings.OLLAMA_CLOUD_API_KEY.strip()
        try:
            response = self.client.post(base_url + endpoint, json=payload, headers=headers, timeout=timeout)
        except httpx.TimeoutException as exc:
            raise AIServiceError("UdaanAI could not reach Ollama Cloud before the request timed out. Please try again.") from exc
        except httpx.RequestError as exc:
            raise AIServiceError(
                "UdaanAI could not connect to the AI inference service. "
                "Please check your network and Ollama Cloud authentication."
            ) from exc
        if response.status_code in {401, 403}:
            raise AIServiceError("Ollama Cloud authentication failed. Check OLLAMA_CLOUD_API_KEY or sign in to Ollama.")
        if response.status_code == 404:
            raise AIServiceError("The configured Ollama Cloud model is unavailable. Check the model name and your Ollama access.")
        if response.status_code in {402, 429}:
            raise AIServiceError("Ollama Cloud is temporarily unavailable or has reached a usage limit. Please try again later.")
        try:
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPStatusError, ValueError) as exc:
            provider = "Ollama Cloud" if cloud else "the embedding service"
            raise AIServiceError(f"UdaanAI could not get a valid response from {provider}. Please try again later.") from exc

    def chat(self, messages, *, output_schema=None, num_predict=180, timeout: float = 180.0):
        payload = {
            "model": settings.OLLAMA_TEXT_MODEL,
            "messages": messages, "stream": False, "think": False,
            "options": {"temperature": 0.2, "num_ctx": 2048, "num_predict": num_predict},
        }
        if output_schema is not None:
            payload["format"] = output_schema
        data = self._post(self.generation_base_url, "/api/chat", payload, timeout=timeout, cloud=self.direct_cloud)
        self.last_metrics = {
            "model_loading": round(data.get("load_duration", 0) / 1e9, 3),
            "prompt_eval": round(data.get("prompt_eval_duration", 0) / 1e9, 3),
            "generation": round(data.get("eval_duration", 0) / 1e9, 3),
            "prompt_tokens": data.get("prompt_eval_count", 0),
            "generated_tokens": data.get("eval_count", 0),
            "total_ollama": round(data.get("total_duration", 0) / 1e9, 3),
        }
        answer = data["message"]["content"]
        if not isinstance(answer, str) or not answer.strip():
            raise AIServiceError("Ollama Cloud returned an empty answer. Please try again.")
        return answer

    def embed(self, texts):
        if not texts:
            return []
        data = self._post(self.embedding_base_url, "/api/embed", {
            "model": settings.OLLAMA_EMBEDDING_MODEL,
            "input": texts, "truncate": False,
        }, timeout=30.0)
        vectors = data["embeddings"]
        if (len(vectors) != len(texts) or not vectors[0]
                or any(len(v) != len(vectors[0]) for v in vectors)
                or any(not math.isfinite(n) for v in vectors for n in v)):
            raise AIServiceError("The local embedding service returned invalid vectors.")
        return vectors


@lru_cache(maxsize=1)
def get_ai():
    """Reuse the normal provider client for connection pooling across requests."""
    return OllamaAI()
