from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SERVICE_NAME: str = "ai-career-service"
    PORT: int = 8004
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql://udaan_user:change_me_in_dev@localhost:5432/udaan_ai"
    DB_SCHEMA: str = "career_ai"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
