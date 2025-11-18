from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from routers import health, auth, preferences, matches, voice
from config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    print("🚀 GlowGo Backend Starting...")
    print(f"📊 Database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else 'configured'}")
    yield
    # Shutdown
    print("👋 GlowGo Backend Shutting Down...")


app = FastAPI(
    title="GlowGo",
    description="AI-powered beauty/wellness service marketplace",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc)
        }
    )


# Include Routers
app.include_router(health.router)
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(preferences.router, prefix="/api/preferences", tags=["preferences"])
app.include_router(matches.router, prefix="/api/matches", tags=["matches"])
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])
# Future routers will be mounted here:
# app.include_router(bookings_router, prefix="/api/bookings", tags=["bookings"])


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )


