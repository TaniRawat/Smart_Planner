# app/models.py - COMPLETE VERSION (FIXED)
from datetime import datetime, date
from typing import Optional, List
import uuid
from sqlalchemy import (
    String, Integer, Boolean, DateTime, Date, Text, 
    ForeignKey, Float, JSON, Enum as SQLEnum, Table, Column
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base
import enum


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"


class FocusMode(str, enum.Enum):
    POMODORO = "pomodoro"
    DEEP_WORK = "deep_work"
    TIME_BLOCKING = "time_blocking"


class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


# Association table for many-to-many relationships
task_tags = Table(
    'task_tags',
    Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)


class User(Base):
    """Enhanced User model with gamification"""
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Academic info
    institution: Mapped[Optional[str]] = mapped_column(String(200))
    field_of_study: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Preferences
    daily_goal_hours: Mapped[float] = mapped_column(Float, default=2.0)
    preferred_focus_mode: Mapped[FocusMode] = mapped_column(
        SQLEnum(FocusMode), default=FocusMode.POMODORO
    )
    
    # Gamification
    xp_points: Mapped[int] = mapped_column(Integer, default=0)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    
    # System
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole), default=UserRole.STUDENT
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Relationships
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="owner", cascade="all, delete-orphan")
    study_sessions: Mapped[List["StudySession"]] = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")
    achievements: Mapped[List["UserAchievement"]] = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    flashcards: Mapped[List["Flashcard"]] = relationship("Flashcard", back_populates="owner", cascade="all, delete-orphan")
    notes: Mapped[List["Note"]] = relationship("Note", back_populates="owner", cascade="all, delete-orphan")
    tags: Mapped[List["Tag"]] = relationship("Tag", back_populates="user", cascade="all, delete-orphan")
    learning_resources: Mapped[List["LearningResource"]] = relationship(
        "LearningResource", 
        back_populates="user",
        cascade="all, delete-orphan"
    )


class Task(Base):
    """Enhanced Task model with AI features"""
    __tablename__ = "tasks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    detailed_instructions: Mapped[Optional[str]] = mapped_column(Text)  # AI-generated
    
    # Task attributes
    priority: Mapped[TaskPriority] = mapped_column(
        SQLEnum(TaskPriority), default=TaskPriority.MEDIUM
    )
    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus), default=TaskStatus.TODO
    )
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")  # easy, medium, hard
    
    # Time tracking
    estimated_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    actual_minutes: Mapped[Optional[int]] = mapped_column(Integer)
    due_date: Mapped[Optional[date]] = mapped_column(Date)
    
    # Recurrence
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_rule: Mapped[Optional[str]] = mapped_column(String(100))
    
    # AI features
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_feedback: Mapped[Optional[str]] = mapped_column(Text)
    
    # Foreign keys
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    parent_task_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("tasks.id"))
    study_session_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("study_sessions.id"))
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="tasks")
    parent_task: Mapped[Optional["Task"]] = relationship("Task", remote_side=[id], back_populates="subtasks")
    subtasks: Mapped[List["Task"]] = relationship("Task", back_populates="parent_task", cascade="all, delete-orphan")
    study_session: Mapped[Optional["StudySession"]] = relationship("StudySession", back_populates="tasks")
    tags: Mapped[List["Tag"]] = relationship("Tag", secondary=task_tags, back_populates="tasks")

    @property
    def is_completed(self) -> bool:
        return self.status == TaskStatus.DONE


class Tag(Base):
    """Tag model for organizing tasks"""
    __tablename__ = "tags"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    color: Mapped[str] = mapped_column(String(7), default="#3B82F6")  # Hex color
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"))
    
    tasks: Mapped[List["Task"]] = relationship("Task", secondary=task_tags, back_populates="tags")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="tags")


class StudySession(Base):
    """Study session with focus tracking"""
    __tablename__ = "study_sessions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text)
    
    # Timing
    scheduled_start: Mapped[datetime] = mapped_column(DateTime)
    scheduled_end: Mapped[datetime] = mapped_column(DateTime)
    actual_start: Mapped[Optional[datetime]] = mapped_column(DateTime)
    actual_end: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # Focus metrics
    focus_mode: Mapped[FocusMode] = mapped_column(
        SQLEnum(FocusMode), default=FocusMode.POMODORO
    )
    focus_score: Mapped[Optional[float]] = mapped_column(Float)  # 0-1
    
    # Foreign keys
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="study_sessions")
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="study_session")


class Achievement(Base):
    """Achievement/badge definitions"""
    __tablename__ = "achievements"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(Text)
    icon_url: Mapped[Optional[str]] = mapped_column(String(500))
    xp_reward: Mapped[int] = mapped_column(Integer, default=100)
    category: Mapped[str] = mapped_column(String(50))  # study, streak, social, mastery
    
    user_achievements: Mapped[List["UserAchievement"]] = relationship("UserAchievement", back_populates="achievement", cascade="all, delete-orphan")


class UserAchievement(Base):
    """User achievement unlocks"""
    __tablename__ = "user_achievements"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    achievement_id: Mapped[int] = mapped_column(Integer, ForeignKey("achievements.id"))
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    progress: Mapped[float] = mapped_column(Float, default=1.0)  # 0-1
    
    user: Mapped["User"] = relationship("User", back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship("Achievement", back_populates="user_achievements")


class Flashcard(Base):
    """Flashcards for spaced repetition"""
    __tablename__ = "flashcards"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    front: Mapped[str] = mapped_column(Text)
    back: Mapped[str] = mapped_column(Text)
    
    # Spaced repetition (simplified)
    interval: Mapped[int] = mapped_column(Integer, default=1)  # days
    next_review: Mapped[date] = mapped_column(Date, default=date.today)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="flashcards")


class Note(Base):
    """Study notes"""
    __tablename__ = "notes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    
    # AI enhancements
    ai_summary: Mapped[Optional[str]] = mapped_column(Text)
    ai_tags: Mapped[List[str]] = mapped_column(JSON, default=[])  # FIXED: removed default_factory
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="notes")


class LearningResource(Base):
    """Learning resources uploaded by users"""
    __tablename__ = "learning_resources"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    resource_type: Mapped[str] = mapped_column(String(50), default="document")  # pdf, link, text, image
    file_path: Mapped[Optional[str]] = mapped_column(String(500))  # if uploaded file
    url: Mapped[Optional[str]] = mapped_column(String(500))  # if external link
    content_text: Mapped[Optional[str]] = mapped_column(Text)  # extracted/OCR text
    tags: Mapped[List[str]] = mapped_column(JSON, default=[])  # FIXED: removed default_factory
    ai_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text)
    ai_key_points: Mapped[List[str]] = mapped_column(JSON, default=[])  # FIXED: removed default_factory
    file_size: Mapped[Optional[int]] = mapped_column(Integer)  # in bytes
    mime_type: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="learning_resources")
    
    def __repr__(self) -> str:
        return f"<LearningResource(id={self.id}, title='{self.title[:30]}...', type='{self.resource_type}')>"