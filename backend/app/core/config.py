from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database — keep existing lowercase aliases working too
    database_url: str = "postgresql+psycopg://volunteer_user:volunteer_pass@localhost:5432/volunteer_db"
    DATABASE_URL: Optional[str] = None  # Railway-style uppercase alias

    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    SECRET_KEY: Optional[str] = None  # uppercase alias
    algorithm: str = "HS256"
    ALGORITHM: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7   # 7 days
    ACCESS_TOKEN_EXPIRE_MINUTES: Optional[int] = None

    # Twilio (optional — SMS notifications)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    # External APIs (optional)
    OPENWEATHER_API_KEY: str = ""
    NDMA_FEED_URL: str = "https://sachet.ndma.gov.in/cap/alerts.json"

    # Cache directory for external feed responses
    CACHE_DIR: str = "cache"

    # Server
    debug: bool = True
    api_title: str = "VolunteerMatch API"
    api_version: str = "2.0.0"

    def get_database_url(self) -> str:
        """Returns DATABASE_URL (uppercase) if set, else database_url (lowercase)."""
        url = self.DATABASE_URL or self.database_url
        if url and url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    def get_secret_key(self) -> str:
        """Returns SECRET_KEY (uppercase) if set, else secret_key (lowercase)."""
        return self.SECRET_KEY or self.secret_key

    def get_token_expire_minutes(self) -> int:
        return self.ACCESS_TOKEN_EXPIRE_MINUTES or self.access_token_expire_minutes

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
