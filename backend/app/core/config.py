from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://volunteer_user:volunteer_pass@localhost:5432/volunteer_db"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Server
    debug: bool = True
    api_title: str = "VolunteerMatch API"
    api_version: str = "1.0.0"
    
    class Config:
        env_file = ".env"


settings = Settings()
