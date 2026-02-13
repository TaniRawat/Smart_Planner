# app/main.py - FIXED VERSION
import logging
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status, Depends, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from .config import settings
from .routers import auth
from .services.firebase_auth import verify_firebase_token, initialize_firebase

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

TASK_STORE = [
    {
        "id": 1,
        "title": "Complete math homework",
        "description": "",
        "priority": 3,
        "deadline": None,
        "done": False,
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "id": 2,
        "title": "Read chapter 5",
        "description": "",
        "priority": 3,
        "deadline": None,
        "done": True,
        "created_at": datetime.utcnow().isoformat(),
    },
]
NEXT_TASK_ID = 3


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    Handles Firebase initialization (no SQL database).
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    # Initialize Firebase (NO SQL DATABASE INITIALIZATION)
    try:
        initialize_firebase()
        logger.info("Firebase initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        # Don't raise - continue without Firebase for development
        if settings.ENVIRONMENT.value == "production":
            raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    # No SQL database engine to dispose


# Create FastAPI app
app = FastAPI(
    title="Smart Study Planner API",
    description="AI-powered student productivity platform with Firebase authentication",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# FIX: Handle CORS_ORIGINS - Convert string to list if needed
cors_origins = []

# If CORS_ORIGINS is a string (comma-separated), split it
if isinstance(settings.CORS_ORIGINS, str):
    cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
elif isinstance(settings.CORS_ORIGINS, list):
    cors_origins = settings.CORS_ORIGINS
else:
    # Default origins if not specified
    cors_origins = ["http://localhost:5173"]

# Add additional development origins
additional_origins = [
    "http://localhost:5173",  # Vite/React default
    "http://127.0.0.1:5173",  # Vite/React alternative
    "http://localhost:3000",  # React default
    "http://127.0.0.1:3000",  # React alternative
    "http://localhost:8080",  # Vue default
    "http://127.0.0.1:8080",  # Vue alternative
    "http://localhost:4200",  # Angular default
    "http://127.0.0.1:4200",  # Angular alternative
]

# Add unique origins only
for origin in additional_origins:
    if origin not in cors_origins:
        cors_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for request validation errors.
    Returns detailed error information in development mode.
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join([str(loc) for loc in error.get("loc", [])]),
            "message": error.get("msg"),
            "type": error.get("type"),
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors if settings.DEBUG else "Invalid request parameters"
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled errors.
    Logs detailed error in development, generic message in production.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    error_detail = str(exc) if settings.DEBUG else "Internal server error"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": error_detail,
            "type": type(exc).__name__
        },
    )


# API prefix configuration
API_PREFIX = "/api/v1"

# Include authentication router
app.include_router(auth.router, prefix=API_PREFIX, tags=["Authentication"])

# ==================== CREATE MINIMAL ROUTERS ====================
# Since other routers might not exist yet, create minimal ones

# Users router
users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.get("/me")
async def get_current_user_endpoint(current_user: dict = Depends(verify_firebase_token)):
    """Get current user from Firebase"""
    return {
        "user": current_user,
        "message": "User profile retrieved from Firebase"
    }

@users_router.get("/")
async def list_users(current_user: dict = Depends(verify_firebase_token)):
    """List users (placeholder)"""
    return {
        "users": [current_user],
        "total": 1,
        "message": "Users endpoint"
    }

app.include_router(users_router, prefix=API_PREFIX)

# Tasks router
tasks_router = APIRouter(prefix="/tasks", tags=["Tasks"])

@tasks_router.get("/")
async def get_tasks(current_user: dict = Depends(verify_firebase_token)):
    """Get tasks for current user"""
    return {
        "tasks": TASK_STORE,
        "user_id": current_user.get("uid"),
        "total": len(TASK_STORE)
    }

@tasks_router.post("/")
async def create_task(task_data: dict, current_user: dict = Depends(verify_firebase_token)):
    """Create a new task"""
    global NEXT_TASK_ID
    task = {
        "id": NEXT_TASK_ID,
        "title": task_data.get("title"),
        "description": task_data.get("description", ""),
        "priority": task_data.get("priority", 3),
        "deadline": task_data.get("deadline"),
        "done": False,
        "created_at": datetime.utcnow().isoformat(),
        "user_id": current_user.get("uid"),
    }
    NEXT_TASK_ID += 1
    TASK_STORE.insert(0, task)
    return {
        "task": task,
        "message": "Task created successfully"
    }


@tasks_router.patch("/{task_id}")
async def update_task(task_id: int, updates: dict, current_user: dict = Depends(verify_firebase_token)):
    """Update an existing task"""
    task = next((item for item in TASK_STORE if item["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if "title" in updates:
        task["title"] = updates["title"]
    if "description" in updates:
        task["description"] = updates["description"]
    if "priority" in updates:
        task["priority"] = updates["priority"]
    if "deadline" in updates:
        task["deadline"] = updates["deadline"]
    if "done" in updates:
        task["done"] = bool(updates["done"])
    if "completed" in updates:
        task["done"] = bool(updates["completed"])

    return {
        "task": task,
        "message": "Task updated successfully"
    }


@tasks_router.delete("/{task_id}")
async def delete_task_endpoint(task_id: int, current_user: dict = Depends(verify_firebase_token)):
    """Delete a task"""
    for idx, item in enumerate(TASK_STORE):
        if item["id"] == task_id:
            TASK_STORE.pop(idx)
            return {"success": True}
    raise HTTPException(status_code=404, detail="Task not found")

app.include_router(tasks_router, prefix=API_PREFIX)

# AI router
ai_router = APIRouter(prefix="/ai", tags=["AI Tutor"])

@ai_router.post("/summarize")
async def summarize_text(request: dict, current_user: dict = Depends(verify_firebase_token)):
    """Summarize text"""
    return {
        "summary": f"Summary of text: {request.get('text', '')[:100]}...",
        "original_length": len(request.get('text', '')),
        "user_id": current_user.get("uid")
    }

@ai_router.post("/breakdown")
async def breakdown_task(request: dict, current_user: dict = Depends(verify_firebase_token)):
    """Break down task into subtasks"""
    return {
        "subtasks": [
            {"id": 1, "title": f"Subtask 1 for {request.get('title', 'Task')}"},
            {"id": 2, "title": f"Subtask 2 for {request.get('title', 'Task')}"}
        ],
        "user_id": current_user.get("uid")
    }

app.include_router(ai_router, prefix=API_PREFIX)

# Study router
study_router = APIRouter(prefix="/study", tags=["Study Sessions"])

@study_router.get("/sessions")
async def get_study_sessions(current_user: dict = Depends(verify_firebase_token)):
    """Get study sessions"""
    return {
        "sessions": [
            {"id": 1, "subject": "Math", "duration": 60},
            {"id": 2, "subject": "Physics", "duration": 45}
        ],
        "user_id": current_user.get("uid")
    }

app.include_router(study_router, prefix=API_PREFIX)

# Gamification router
gamification_router = APIRouter(prefix="/gamification", tags=["Gamification"])

@gamification_router.get("/stats")
async def get_gamification_stats(current_user: dict = Depends(verify_firebase_token)):
    """Get gamification stats"""
    return {
        "user_id": current_user.get("uid"),
        "xp_points": 150,
        "level": 2,
        "streak_days": 7
    }

app.include_router(gamification_router, prefix=API_PREFIX)

# ==================== BASIC ENDPOINTS ====================

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Smart Study Planner API is working!",
        "status": "online",
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT.value if hasattr(settings.ENVIRONMENT, 'value') else str(settings.ENVIRONMENT),
        "authentication": "Firebase Auth",
        "documentation": "/docs",
        "openapi_schema": "/openapi.json",
        "endpoints": [
            "/api/v1/auth/*",
            "/api/v1/users/*",
            "/api/v1/tasks/*",
            "/api/v1/ai/*",
            "/api/v1/study/*",
            "/api/v1/gamification/*"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "database": "firebase",
        "auth_providers": {
            "firebase": "enabled"
        }
    }


@app.get("/api/v1/health")
async def api_health_check():
    """API-specific health check"""
    return {
        "status": "healthy",
        "api_version": "v1",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "database": "firebase",
        "endpoints": [
            "/api/v1/auth/*",
            "/api/v1/users/*",
            "/api/v1/tasks/*",
            "/api/v1/study/*",
            "/api/v1/ai/*",
            "/api/v1/gamification/*"
        ]
    }

# ==================== ADDITIONAL TEST ENDPOINTS ====================

@app.get("/test")
async def test_endpoint():
    """Test endpoint"""
    return {"message": "Test endpoint is working"}

@app.post("/api/v1/auth/login-test")
async def login_test(email: str, password: str):
    """Test login endpoint (for frontend testing)"""
    return {
        "message": "Login successful",
        "access_token": "test_token_123",
        "token_type": "bearer",
        "user": {
            "email": email,
            "name": email.split("@")[0],
            "uid": "test_uid_123"
        }
    }

# Development server
if __name__ == "__main__":
    import uvicorn
    
    # Determine port from settings or use default
    port = getattr(settings, 'PORT', 8000)
    host = getattr(settings, 'HOST', '0.0.0.0')
    
    uvicorn.run(
        app,  # Use the app object directly
        host=host,
        port=port,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )