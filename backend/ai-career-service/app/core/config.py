from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SERVICE_NAME: str = "ai-career-service"
    PORT: int = 8004
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql://udaan_user:change_me_in_dev@localhost:5432/udaan_ai"
    DB_SCHEMA: str = "career_ai"
    JWT_SECRET_KEY: str = "dev_secret_key_udaan_ai_phase2_change_in_prod"
    JWT_ALGORITHM: str = "HS256"
    ASSESSMENT_SERVICE_URL: str = "http://localhost:8003"
    STUDENT_SERVICE_URL: str = "http://localhost:8002"
    ROADMAP_SERVICE_URL: str = "http://localhost:8005"

    # Text generation uses Ollama Cloud. Embeddings remain separate because the
    # pgvector corpus is indexed with the 1024-dimensional local model below.
    OLLAMA_GENERATION_BASE_URL: str = "https://ollama.com"
    OLLAMA_CLOUD_API_KEY: str = ""
    OLLAMA_TEXT_MODEL: str = "gpt-oss:120b-cloud"
    OLLAMA_EMBEDDING_BASE_URL: str = "http://localhost:11434"
    OLLAMA_EMBEDDING_MODEL: str = "qwen3-embedding:0.6b"
    AI_REQUEST_DEADLINE_SECONDS: float = 60.0
    WEB_SEARCH_ENABLED: bool = False
    SEARXNG_BASE_URL: str = "http://searxng:8080"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
