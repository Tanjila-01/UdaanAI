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

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
