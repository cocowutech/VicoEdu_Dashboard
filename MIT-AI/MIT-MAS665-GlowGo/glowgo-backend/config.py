from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    
    # JWT Configuration
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 7
    
    # Google Gemini AI
    GOOGLE_GEMINI_API_KEY: str
    GOOGLE_GEMINI_MODEL: str = "gemini-2.0-flash"

    # OpenAI (optional fallback)
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # SendGrid Email
    SENDGRID_API_KEY: str
    BUSINESS_EMAIL: str

    # ElevenLabs Voice
    ELEVENLABS_API_KEY: str
    ELEVENLABS_VOICE_ID: str

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env


# Global settings instance
settings = Settings()


# CrewAI Configuration
class CrewAIConfig:
    """CrewAI Multi-Agent System Configuration"""
    # Prefer a stable, generally available model over experimental to avoid quota=0 on free tier
    LLM_MODEL = "gemini-2.0-flash"
    LLM_TEMPERATURE = 0.7
    LLM_MAX_TOKENS = 2000
    # Limit retries to avoid long delays on quota errors
    LLM_MAX_RETRIES = 0
    OPENAI_FALLBACK_MODEL = "gpt-4o-mini"
    AGENT_MEMORY = True
    AGENT_VERBOSE = True
    CREW_PROCESS = "sequential"
    MAX_ITERATIONS = 10


# Global CrewAI config instance
crew_config = CrewAIConfig()

