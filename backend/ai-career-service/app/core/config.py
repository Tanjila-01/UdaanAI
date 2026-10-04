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

    # Text generation uses Ollama Cloud (gpt-oss:120b-cloud).
    OLLAMA_GENERATION_BASE_URL: str = "https://ollama.com"
    OLLAMA_CLOUD_API_KEY: str = "58d7b9bc002342e2934252b34b834e72.etwyjOlZiGKriktSoccMqpie"
    OLLAMA_TEXT_MODEL: str = "gpt-oss:120b-cloud"

    # Embeddings use local Sentence Transformers (all-MiniLM-L6-v2, 384 dimensions).
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    EMBEDDING_DEVICE: str = "cpu"

    # Speech recognition uses converted vasista22/whisper-kannada-small (CTranslate2 INT8).
    SPEECH_MODEL_ID: str = "vasista22/whisper-kannada-small"
    SPEECH_MODEL_PATH: str = "/models/whisper-kannada-small-ct2-int8"
    SPEECH_MODEL_DEVICE: str = "cpu"
    SPEECH_MODEL_COMPUTE_TYPE: str = "int8"

    AI_REQUEST_DEADLINE_SECONDS: float = 60.0
    WEB_SEARCH_ENABLED: bool = False
    SEARXNG_BASE_URL: str = "http://searxng:8080"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
