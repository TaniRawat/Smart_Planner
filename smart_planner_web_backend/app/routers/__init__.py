"""
Routers package for ScholarSync 2.0
"""

from .auth import router as auth_router
from .users import router as users_router
from .tasks import router as tasks_router
from .ai import router as ai_router
from .study import router as study_router
from .gamification import router as gamification_router

__all__ = [
    "auth_router",
    "users_router",
    "tasks_router",
    "ai_router",
    "study_router",
    "gamification_router",
]