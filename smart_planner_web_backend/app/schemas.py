# app/schemas.py - COMPLETE VERSION WITH PROPER ORDERING
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum
from uuid import UUID


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


class FocusMode(str, Enum):
    POMODORO = "pomodoro"
    DEEP_WORK = "deep_work"
    TIME_BLOCKING = "time_blocking"


# Base schemas
class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ==================== USER SCHEMAS ====================
class UserBase(BaseSchema):
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserProfileUpdate(BaseSchema):
    username: Optional[str] = None
    full_name: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    daily_goal_hours: Optional[float] = Field(None, ge=0.5, le=12)
    preferred_focus_mode: Optional[FocusMode] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserPreferencesUpdate(BaseSchema):
    """User preferences update schema"""
    daily_goal_hours: Optional[float] = Field(None, ge=0.5, le=12)
    preferred_focus_mode: Optional[FocusMode] = None
    ai_tutor_enabled: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserOut(UserBase):
    id: UUID
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    daily_goal_hours: float = 2.0
    preferred_focus_mode: FocusMode = FocusMode.POMODORO
    xp_points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    level: int = 1
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserStats(BaseSchema):
    """User statistics for dashboard"""
    total_study_hours: float = Field(0.0, ge=0)
    tasks_completed: int = Field(0, ge=0)
    sessions_completed: int = Field(0, ge=0)
    flashcards_mastered: int = Field(0, ge=0)
    current_streak_days: int = Field(0, ge=0)
    streak_start_date: Optional[date] = None
    study_time_this_week: float = Field(0.0, ge=0)
    focus_score_this_week: float = Field(0.0, ge=0, le=1)
    productivity_trend: str = Field("stable", pattern="^(up|down|stable)$")
    
    model_config = ConfigDict(from_attributes=True)
# ==================== END USER SCHEMAS ====================


# ==================== AUTH SCHEMAS ====================
class LoginRequest(BaseSchema):
    email: EmailStr
    password: str
    remember_me: bool = Field(False, description="Long-lived session token")
    
    model_config = ConfigDict(from_attributes=True)


class UserLogin(LoginRequest):  # Alias for compatibility
    """User login schema"""
    pass


class Token(BaseSchema):
    access_token: str
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")
    token_type: str = "bearer"
    expires_in: int = Field(3600, description="Token expiration in seconds")
    user: UserOut
    
    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseSchema):
    """Decoded token data for authentication"""
    user_id: str
    email: EmailStr
    exp: Optional[int] = None
    scopes: List[str] = Field(default_factory=lambda: ["user"])
    
    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseSchema):
    """User response for authentication endpoints"""
    id: UUID
    email: EmailStr
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PasswordResetRequest(BaseSchema):
    """Password reset request"""
    email: EmailStr
    
    model_config = ConfigDict(from_attributes=True)


class PasswordResetConfirm(BaseSchema):
    """Password reset confirmation"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    model_config = ConfigDict(from_attributes=True)


class ChangePassword(BaseSchema):
    """Change password while logged in"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    model_config = ConfigDict(from_attributes=True)
# ==================== END AUTH SCHEMAS ====================


# ==================== TASK SCHEMAS ====================
class TaskBase(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")
    estimated_minutes: Optional[int] = Field(None, ge=1, le=480)
    deadline: Optional[date] = None
    
    model_config = ConfigDict(from_attributes=True)


class TaskCreate(TaskBase):
    tags: List[str] = Field(default_factory=list)
    subtasks: Optional[List["TaskCreate"]] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class TaskUpdate(BaseSchema):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    estimated_minutes: Optional[int] = Field(None, ge=1, le=480)
    actual_minutes: Optional[int] = Field(None, ge=0)
    deadline: Optional[date] = None
    tags: Optional[List[str]] = None
    ai_feedback: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class TaskOut(TaskBase):
    id: int
    owner_id: UUID
    parent_task_id: Optional[int] = None
    study_session_id: Optional[int] = None
    is_recurring: bool = False
    actual_minutes: Optional[int] = None
    ai_generated: bool = False
    ai_feedback: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    subtasks: List["TaskOut"] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class TaskListOut(BaseSchema):
    """Paginated task list response"""
    items: List[TaskOut] = Field(default_factory=list)
    total: int
    page: int = 1
    per_page: int = 20
    pages: int
    
    model_config = ConfigDict(from_attributes=True)


class TaskAnalytics(BaseSchema):
    """Task completion analytics"""
    total_tasks: int = Field(0, ge=0)
    completed_tasks: int = Field(0, ge=0)
    completion_rate: float = Field(0.0, ge=0, le=1)
    overdue_tasks: int = Field(0, ge=0)
    avg_completion_time_hours: Optional[float] = Field(None, ge=0)
    priority_distribution: Dict[str, int] = Field(default_factory=dict)
    weekly_completion_trend: List[int] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)


class TaskBulkUpdate(BaseSchema):
    """Bulk task update"""
    task_ids: List[int]
    operation: str = Field(..., pattern="^(complete|delete|update)$")
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    
    model_config = ConfigDict(from_attributes=True)
# ==================== END TASK SCHEMAS ====================


# ==================== STUDY SESSION SCHEMAS ====================
class StudySessionBase(BaseSchema):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_start: datetime
    scheduled_end: datetime
    focus_mode: FocusMode = FocusMode.POMODORO
    
    model_config = ConfigDict(from_attributes=True)


class StudySessionCreate(StudySessionBase):
    task_ids: Optional[List[int]] = None
    
    model_config = ConfigDict(from_attributes=True)


class StudySessionUpdate(BaseSchema):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    focus_score: Optional[float] = Field(None, ge=0, le=1)
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class StudySessionOut(StudySessionBase):
    id: int
    user_id: UUID
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    focus_score: Optional[float] = None
    duration_minutes: Optional[int] = None
    tasks: List[TaskOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class StudySessionAnalytics(BaseSchema):
    """Study session analytics"""
    total_sessions: int = Field(0, ge=0)
    total_hours: float = Field(0.0, ge=0)
    avg_focus_score: Optional[float] = Field(None, ge=0, le=1)
    preferred_focus_mode: Optional[str] = None
    best_time_of_day: Optional[str] = None
    weekly_trend: List[float] = Field(default_factory=list)
    productivity_correlation: Optional[float] = Field(None, ge=-1, le=1)
    
    model_config = ConfigDict(from_attributes=True)
# ==================== END STUDY SESSION SCHEMAS ====================


# ==================== GAMIFICATION SCHEMAS ====================
class AchievementOut(BaseSchema):
    id: int
    name: str
    description: str
    icon_url: Optional[str] = None
    xp_reward: int
    category: str
    
    model_config = ConfigDict(from_attributes=True)


class UserAchievementOut(BaseSchema):
    achievement: AchievementOut
    unlocked_at: datetime
    progress: float
    
    model_config = ConfigDict(from_attributes=True)


class LeaderboardEntry(BaseSchema):
    user_id: UUID
    username: Optional[str] = None
    full_name: Optional[str] = None
    xp_points: int
    level: int
    streak: int
    rank: int
    
    model_config = ConfigDict(from_attributes=True)


class Leaderboard(BaseSchema):
    """Complete leaderboard"""
    timeframe: str = Field(..., pattern="^(daily|weekly|monthly|all_time)$")
    entries: List[LeaderboardEntry] = Field(default_factory=list)
    user_rank: Optional[LeaderboardEntry] = None
    total_participants: int = Field(0, ge=0)
    
    model_config = ConfigDict(from_attributes=True)


class XPTransaction(BaseSchema):
    """XP transaction record"""
    id: int
    user_id: UUID
    amount: int
    source: str = Field(..., description="Source of XP: task_complete, streak_bonus, achievement, etc.")
    description: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DashboardStats(BaseSchema):
    """Complete dashboard statistics"""
    user: UserOut
    user_stats: UserStats
    task_analytics: TaskAnalytics
    session_analytics: StudySessionAnalytics
    today_tasks: List[TaskOut] = Field(default_factory=list)
    upcoming_sessions: List[StudySessionOut] = Field(default_factory=list)
    recent_achievements: List[UserAchievementOut] = Field(default_factory=list)
    study_time_today: float = Field(0.0, ge=0)
    daily_goal_progress: float = Field(0.0, ge=0, le=1)
    focus_score_today: Optional[float] = Field(None, ge=0, le=1)
    burnout_risk: str = Field("low", pattern="^(low|medium|high|critical)$")
    
    model_config = ConfigDict(from_attributes=True)
# ==================== END GAMIFICATION SCHEMAS ====================


# ==================== AI SCHEMAS ====================
class AIQuestionRequest(BaseSchema):
    question: str = Field(..., min_length=1, max_length=1000)
    context: Optional[str] = None
    generate_quiz: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class AIResponse(BaseSchema):
    answer: str
    suggested_questions: List[str] = Field(default_factory=list)
    confidence: float = Field(1.0, ge=0, le=1)
    
    model_config = ConfigDict(from_attributes=True)


class AIChatResponse(BaseSchema):
    """AI chat response with sources"""
    response: str
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    suggested_questions: List[str] = Field(default_factory=list)
    confidence: float = Field(1.0, ge=0, le=1)
    tokens_used: int = Field(0, ge=0)
    
    model_config = ConfigDict(from_attributes=True)


class AIConversationCreate(BaseSchema):
    """Create a new AI conversation"""
    title: str = Field(..., min_length=1, max_length=200)
    ai_persona: str = Field("tutor", description="AI persona: tutor, mentor, coach, etc.")
    context_resource_ids: Optional[List[int]] = Field(None, description="Learning resource IDs for context")
    
    model_config = ConfigDict(from_attributes=True)


class AIConversationOut(BaseSchema):
    """AI conversation response"""
    id: int
    user_id: UUID
    title: str
    ai_persona: str
    message_count: int = Field(0, ge=0)
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class QuizCreate(BaseSchema):
    """Create a quiz request"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    quiz_type: str = Field("multiple_choice", pattern="^(multiple_choice|true_false|short_answer)$")
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")
    question_count: int = Field(10, ge=1, le=50)
    source_resource_id: Optional[int] = Field(None, description="Learning resource ID to generate quiz from")
    
    model_config = ConfigDict(from_attributes=True)


class QuizQuestion(BaseSchema):
    """Individual quiz question"""
    question: str
    question_type: str = Field("multiple_choice", pattern="^(multiple_choice|true_false|short_answer)$")
    options: Optional[List[str]] = Field(None, description="For multiple choice questions")
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")
    points: int = Field(10, ge=1, le=100)
    
    model_config = ConfigDict(from_attributes=True)


class QuizOut(BaseSchema):
    """Quiz response"""
    id: int
    user_id: UUID
    title: str
    description: Optional[str] = None
    quiz_type: str
    difficulty: str
    question_count: int
    source_resource_id: Optional[int] = None
    source_type: Optional[str] = None  # resource, topic, document
    questions: List[QuizQuestion] = Field(default_factory=list)
    attempts_count: int = Field(0, ge=0)
    best_score: Optional[float] = Field(None, ge=0, le=100)
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class LearningResourceCreate(BaseSchema):
    """Create a learning resource"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    resource_type: str = Field("document", pattern="^(document|link|text|image)$")
    file_path: Optional[str] = None
    url: Optional[str] = None
    content_text: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)
# ==================== END AI SCHEMAS ====================


# ==================== FLASHCARD SCHEMAS ====================
class FlashcardBase(BaseSchema):
    front: str = Field(..., min_length=1, max_length=1000)
    back: str = Field(..., min_length=1, max_length=2000)
    
    model_config = ConfigDict(from_attributes=True)


class FlashcardCreate(FlashcardBase):
    pass


class FlashcardOut(FlashcardBase):
    id: int
    owner_id: UUID
    interval: int
    next_review: date
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
# ==================== END FLASHCARD SCHEMAS ====================


# ==================== NOTE SCHEMAS ====================
class NoteBase(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    
    model_config = ConfigDict(from_attributes=True)


class NoteCreate(NoteBase):
    generate_ai_summary: bool = True
    
    model_config = ConfigDict(from_attributes=True)


class NoteOut(NoteBase):
    id: int
    owner_id: UUID
    ai_summary: Optional[str] = None
    ai_tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
# ==================== END NOTE SCHEMAS ====================


# ==================== PAGINATION SCHEMA ====================
class PaginatedResponse(BaseSchema):
    items: List[BaseSchema]
    total: int
    page: int = 1
    per_page: int = 20
    pages: int
    
    model_config = ConfigDict(from_attributes=True)
# ==================== END PAGINATION SCHEMA ====================


# Fix recursive references
TaskCreate.model_rebuild()
TaskOut.model_rebuild()