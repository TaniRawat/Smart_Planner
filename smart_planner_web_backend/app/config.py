# app/config.py - UPDATED VERSION
from pydantic_settings import BaseSettings
from typing import Optional, List, Union
from enum import Enum
import json

class AIProvider(str, Enum):
    """Supported AI providers"""
    OPENAI = "openai"
    GEMINI = "gemini"
    CLAUDE = "claude"
    LOCAL_LLM = "local_llm"

class Environment(str, Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"
    TESTING = "testing"


class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Smart Study Planner"  # Changed from ScholarSync
    APP_VERSION: str = "1.0.0"  # Changed from 2.0.0
    ENVIRONMENT: Environment = Environment.DEVELOPMENT
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./smart_planner.db"  # Changed from scholarsync.db
    SYNC_DATABASE_URL: str = "sqlite:///./smart_planner.db"  # Changed from scholarsync.db
    
    # Firebase (ADD THESE)
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_PRIVATE_KEY_ID: Optional[str] = None
    FIREBASE_PRIVATE_KEY: Optional[str] = None
    FIREBASE_CLIENT_EMAIL: Optional[str] = None
    FIREBASE_CLIENT_ID: Optional[str] = None
    FIREBASE_DATABASE_URL: Optional[str] = None
    
    # Redis
    REDIS_URL: Optional[str] = None  # Set to None if not using
    
    # CORS - Fixed to handle both JSON and comma-separated strings
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ]
    
    # AI Settings
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    AI_PROVIDER: AIProvider = AIProvider.OPENAI
    DEFAULT_AI_MODEL: str = "gpt-4-turbo-preview"
    
    # File upload
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "./uploads"
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".txt", ".md", ".docx", ".jpg", ".png", ".jpeg"]
    
    # Email (optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@smartstudyplanner.com"  # Changed
    
    # Security
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 24
    
    # Features
    AI_TUTOR_ENABLED: bool = True
    GAMIFICATION_ENABLED: bool = True
    FILE_UPLOAD_ENABLED: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert CORS_ORIGINS to list if it's a JSON string"""
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        elif isinstance(self.CORS_ORIGINS, str):
            # Try to parse as JSON
            try:
                return json.loads(self.CORS_ORIGINS)
            except json.JSONDecodeError:
                # If not JSON, treat as comma-separated string
                return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return []


settings = Settings()