from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    # Database — defaults to local SQLite (no setup needed); change to postgresql+asyncpg://... for production
    DATABASE_URL: str = "sqlite+aiosqlite:///./bureau.db"

    # JWT
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_CONTAINER_NAME: str = "missing-persons"

    # Twilio
    TWILIO_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    FAMILY_MEMBER_PHONE_NUMBER: str = ""

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

@lru_cache
def get_settings() -> Settings:
    return Settings()
