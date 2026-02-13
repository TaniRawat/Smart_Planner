"""
Smart Study Planner - FastAPI Main Application
Enhanced for production with comprehensive error handling, logging, and security
"""

import logging
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter
from slowapi.util import get_remote_address

# Import config and database
from .config import settings
from .database import init_db, close_db
from .services.firebase_auth import initialize_firebase
from . import models  # Import models so they're registered with Base

# Import routers
from .routers import auth, users, tasks_v2 as tasks, ai, study, gamification

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown
    """
    # Startup
    logger.info("=" * 80)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug: {settings.DEBUG}")
    logger.info("=" * 80)
    
    try:
        # Initialize database
        await init_db()
        logger.info("✓ Database initialized")
        
        # Initialize Firebase
        initialize_firebase()
        logger.info("✓ Firebase initialized")
        
    except Exception as e:
        logger.critical(f"Startup failed: {e}")
        if settings.ENVIRONMENT == "production":
            raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    try:
        await close_db()
        logger.info("✓ Database connection closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")
    
    logger.info("Application shutdown complete")


# Create FastAPI app with lifespan
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered student productivity platform with gamification",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Add rate limiter
app.state.limiter = limiter

# Configure CORS FIRST (before other middleware)
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    # Vercel production URLs
    "https://smart-planner-x787.vercel.app",
]

# Add any origins from settings
if isinstance(settings.CORS_ORIGINS, str):
    for o in settings.CORS_ORIGINS.split(","):
        origin = o.strip()
        if origin and origin not in cors_origins:
            cors_origins.append(origin)
elif isinstance(settings.CORS_ORIGINS, list):
    for origin in settings.CORS_ORIGINS:
        if origin not in cors_origins:
            cors_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all vercel.app subdomains
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*", "Content-Length", "X-Total-Count"],
    max_age=3600,
)

logger.info(f"CORS origins configured: {cors_origins}")


# Middleware to handle OPTIONS preflight requests explicitly
@app.middleware("http")
async def handle_preflight(request: Request, call_next):
    if request.method == "OPTIONS":
        return JSONResponse(
            status_code=200,
            content={"detail": "OK"},
            headers={
                "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "3600",
            }
        )
    response = await call_next(request)
    return response


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join([str(loc) for loc in error.get("loc", [])]),
            "message": error.get("msg"),
            "type": error.get("type"),
        })
    
    logger.warning(f"Validation error: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors if settings.DEBUG else "Invalid request parameters",
            "timestamp": datetime.utcnow().isoformat()
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    error_detail = str(exc) if settings.DEBUG else "Internal server error"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": error_detail,
            "error_code": type(exc).__name__,
            "timestamp": datetime.utcnow().isoformat()
        },
    )


# Health check and root endpoints
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": f"{settings.APP_NAME} API is running",
        "status": "online",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "documentation": "/docs",
        "health": "/health"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT
    }


@app.get("/api/v1/health", tags=["Health"])
async def api_health_check():
    """API-specific health check"""
    return {
        "status": "healthy",
        "api_version": "v1",
        "timestamp": datetime.utcnow().isoformat(),
    }


# API Prefix
API_PREFIX = "/api/v1"

# Include routers
app.include_router(auth.router, prefix=API_PREFIX, tags=["Authentication"])
app.include_router(users.router, prefix=API_PREFIX, tags=["Users"])
app.include_router(tasks.router, prefix=API_PREFIX, tags=["Tasks"])
app.include_router(ai.router, prefix=API_PREFIX, tags=["AI Services"])
app.include_router(study.router, prefix=API_PREFIX, tags=["Study Sessions"])
app.include_router(gamification.router, prefix=API_PREFIX, tags=["Gamification"])

logger.info(f"Routers configured: Auth, Users, Tasks, AI, Study, Gamification")


# Development server runner
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
