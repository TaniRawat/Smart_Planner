"""
API request/response schemas
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    daily_goal_hours: float = 2.0


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @validator('password')
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain digit')
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    daily_goal_hours: Optional[float] = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    xp_points: int
    level: int
    current_streak: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Task Schemas
class TaskBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[date] = None
    estimated_minutes: Optional[int] = None


class TaskCreate(TaskBase):
    tags: Optional[List[str]] = []
    subtask_titles: Optional[List[str]] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[date] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None


class TaskResponse(TaskBase):
    id: int
    status: TaskStatus
    owner_id: str
    created_at: datetime
    updated_at: datetime
    actual_minutes: Optional[int] = None
    is_completed: bool

    class Config:
        from_attributes = True


# AI Schemas
class AIBreakdownRequest(BaseModel):
    task_title: str
    task_description: Optional[str] = None
    num_subtasks: int = Field(5, ge=1, le=20)


class AIBreakdownResponse(BaseModel):
    subtasks: List[dict]
    difficulty_level: str
    estimated_total_time: int


class AISummarizeRequest(BaseModel):
    text: str = Field(..., min_length=50, max_length=10000)
    length: str = "medium"  # short, medium, long


class AISummarizeResponse(BaseModel):
    original_text_length: int
    summary: str
    summary_length: int
    confidence: float


# Study Session Schemas
class StudySessionCreate(BaseModel):
    focus_mode: str  # pomodoro, deep_work, time_blocking
    duration_minutes: int = Field(..., ge=5, le=480)
    task_id: Optional[int] = None
    subject: Optional[str] = None


class StudySessionResponse(BaseModel):
    id: int
    user_id: str
    focus_mode: str
    duration_minutes: int
    actual_duration_minutes: Optional[int] = None
    task_id: Optional[int] = None
    subject: Optional[str] = None
    xp_earned: int
    created_at: datetime

    class Config:
        from_attributes = True


# Achievement Schemas
class AchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    badge_url: Optional[str]
    earned_at: datetime


# Gamification Schemas
class GamificationStatsResponse(BaseModel):
    user_id: str
    xp_points: int
    level: int
    current_streak: int
    longest_streak: int
    total_study_hours: float
    tasks_completed: int
    achievements_earned: int
    rank_percentile: float


# Auth Schemas
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class FirebaseLoginRequest(BaseModel):
    id_token: str


# Error Response
class ErrorResponse(BaseModel):
    detail: str
    error_code: str
    timestamp: datetime


# Pagination
class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(50, ge=1, le=100)


class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    skip: int
    limit: int
    has_more: bool
