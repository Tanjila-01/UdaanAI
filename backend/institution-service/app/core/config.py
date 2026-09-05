from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SERVICE_NAME: str = "institution-service"
    PORT: int = 8006
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql://udaan_user:change_me_in_dev@localhost:5432/udaan_ai"
    DB_SCHEMA: str = "institution"
    JWT_SECRET_KEY: str = "dev_secret_key_udaan_ai_phase2_change_in_prod"
    JWT_ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
