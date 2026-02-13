"""
Services package for ScholarSync 2.0
"""

from .ai_service import AIServiceManager, get_ai_service
from .auth_service import (
    send_verification_email, 
    send_password_reset_email,
    send_welcome_email,
    send_streak_notification
)
from .task_service import TaskService

__all__ = [
    "AIServiceManager",
    "get_ai_service",
    "send_verification_email",
    "send_password_reset_email",
    "send_welcome_email",
    "send_streak_notification",
    "TaskService",
]