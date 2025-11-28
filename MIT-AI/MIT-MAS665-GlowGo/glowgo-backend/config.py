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
    GOOGLE_GEMINI_MODEL: str = "gemini-2.5-flash"

    # OpenAI (optional fallback)
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # SendGrid Email
    SENDGRID_API_KEY: str
    BUSINESS_EMAIL: str

    # ElevenLabs Voice
    ELEVENLABS_API_KEY: str
    ELEVENLABS_VOICE_ID: str

    # Data Collection APIs
    YELP_API_KEY: str | None = None
    GOOGLE_PLACES_API_KEY: str | None = None
    BRIGHTDATA_API_KEY: str | None = None
    BRIGHTDATA_ZONE: str = "residential"  # BrightData proxy zone

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()

class CrewConfig:
    """Configuration for CrewAI agents"""
    LLM_MODEL = settings.GOOGLE_GEMINI_MODEL
    LLM_TEMPERATURE = 0.7
    LLM_MAX_TOKENS = 2048
    AGENT_MEMORY = True
    AGENT_VERBOSE = True
    MAX_ITERATIONS = 3
    OPENAI_FALLBACK_MODEL = settings.OPENAI_MODEL
    LLM_MAX_RETRIES = 2

crew_config = CrewConfig()
