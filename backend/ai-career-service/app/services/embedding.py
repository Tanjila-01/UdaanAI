"""Local Sentence Transformers embedding service using all-MiniLM-L6-v2."""
import hashlib
import math
from functools import lru_cache
from typing import List

from app.core.config import settings

EMBEDDING_DIMENSION = settings.EMBEDDING_DIMENSION
EMBEDDING_MODEL_NAME = settings.EMBEDDING_MODEL_NAME


class EmbeddingServiceError(RuntimeError):
    """Safe, user-facing failure from embedding service."""


class MiniLMEmbeddingService:
    def __init__(self, model_name: str = EMBEDDING_MODEL_NAME, device: str = settings.EMBEDDING_DEVICE):
        self.model_name = model_name
        self.device = device
        self.dimension = EMBEDDING_DIMENSION
        self._model = None

    @property
    def model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                try:
                    self._model = SentenceTransformer(self.model_name, device=self.device, local_files_only=True)
                except Exception:
                    self._model = SentenceTransformer(self.model_name, device=self.device)
            except Exception as exc:
                raise EmbeddingServiceError(
                    f"Failed to load embedding model '{self.model_name}' on device '{self.device}': {exc}"
                ) from exc
        return self._model

    def model_digest(self) -> str:
        """Deterministic digest for the configured embedding model."""
        return hashlib.sha256(f"{self.model_name}:{self.dimension}".encode("utf-8")).hexdigest()

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        try:
            embeddings = self.model.encode(
                texts,
                batch_size=32,
                show_progress_bar=False,
                normalize_embeddings=True,
                convert_to_numpy=True,
            )
        except Exception as exc:
            raise EmbeddingServiceError(f"Embedding computation failed: {exc}") from exc

        vectors = embeddings.tolist()
        if len(vectors) != len(texts):
            raise EmbeddingServiceError("Embedding count mismatch")

        for v in vectors:
            if len(v) != self.dimension:
                raise EmbeddingServiceError(
                    f"Expected vector dimension {self.dimension}, got {len(v)}"
                )
            if not all(math.isfinite(x) for x in v) or not any(v):
                raise EmbeddingServiceError("Vector must contain finite, nonzero values")

        return vectors


@lru_cache(maxsize=1)
def get_embedding_service() -> MiniLMEmbeddingService:
    """Singleton instance for embedding service."""
    return MiniLMEmbeddingService()
