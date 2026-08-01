from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SERVICE_NAME: str = "student-service"
    PORT: int = 8002
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql://udaan_user:change_me_in_dev@localhost:5432/udaan_ai"
    DB_SCHEMA: str = "student"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
