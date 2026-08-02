from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SERVICE_NAME: str = "api-gateway"
    PORT: int = 8000
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    AUTH_SERVICE_URL: str = "http://localhost:8001"
    STUDENT_SERVICE_URL: str = "http://localhost:8002"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
