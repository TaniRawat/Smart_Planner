"""
ScholarSync 2.0 - Task Service
Handles business logic for task management with AI integration
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import User, Task, Tag
from app.schemas import TaskCreate, TaskUpdate
from app.services.ai_service import AIServiceManager

class TaskService:
    """Service for task-related business logic"""
    
    def __init__(self, db: AsyncSession, ai_service: AIServiceManager):
        self.db = db
        self.ai_service = ai_service
    
    async def create_task(self, task_in: TaskCreate, user: User) -> Task:
        """Create a new task with AI assistance"""
        # Create task object
        task_data = task_in.model_dump(exclude={"tags", "subtasks", "is_recurring", "recurrence_rule"})
        task = Task(**task_data, owner_id=user.id)
        
        # Handle tags
        if task_in.tags:
            for tag_name in task_in.tags:
                tag = await self._get_or_create_tag(tag_name, user.id)
                task.tags.append(tag)
        
        # Handle subtasks (simplified - would need recursion in real implementation)
        if task_in.subtasks:
            # In a real app, you'd create subtask objects
            pass
        
        # Get AI suggestions for task breakdown if description is provided
        if task_in.description and len(task_in.description) > 50:
            try:
                suggestions = await self.ai_service.breakdown_task(
                    task_in.title, 
                    task_in.description
                )
                # Store suggestions in task metadata or as subtasks
                task.detailed_instructions = "\n".join([
                    f"- {s['title']} ({s.get('estimated_time', '?')} min)"
                    for s in suggestions[:3]
                ])
            except:
                pass  # AI service might fail, but don't fail the whole operation
        
        self.db.add(task)
        await self.db.flush()
        await self.db.refresh(task)
        
        return task
    
    async def update_task(self, task: Task, task_in: TaskUpdate, user: User) -> Task:
        """Update an existing task with AI feedback"""
        update_data = task_in.model_dump(exclude_unset=True, exclude={"tags", "ai_feedback"})
        
        # Update task fields
        for field, value in update_data.items():
            if hasattr(task, field):
                setattr(task, field, value)
        
        # Update tags if provided
        if task_in.tags is not None:
            task.tags.clear()
            for tag_name in task_in.tags:
                tag = await self._get_or_create_tag(tag_name, user.id)
                task.tags.append(tag)
        
        # Get AI feedback if task completed
        if task_in.status == "done" and task.status != "done" and task.description:
            try:
                feedback = await self.ai_service.get_task_feedback(
                    task.title,
                    task.description,
                    task.actual_minutes or task.estimated_minutes
                )
                task.ai_feedback = feedback
            except:
                pass  # AI service might fail
        
        task.updated_at = datetime.now(timezone.utc)
        
        await self.db.flush()
        await self.db.refresh(task)
        
        return task
    
    async def complete_task(self, task: Task, user: User) -> Dict[str, Any]:
        """Complete a task and calculate XP rewards"""
        task.status = "done"
        task.completed_at = datetime.now(timezone.utc)
        task.updated_at = datetime.now(timezone.utc)
        
        # Calculate XP based on difficulty
        xp_reward = 10
        if task.difficulty == "hard":
            xp_reward = 25
        elif task.difficulty == "medium":
            xp_reward = 15
        
        # Time efficiency bonus
        if task.estimated_minutes and task.actual_minutes:
            efficiency = task.estimated_minutes / max(task.actual_minutes, 1)
            if efficiency > 1.2:  # Finished 20% faster
                xp_reward += 5
            elif efficiency < 0.8:  # Took 20% longer
                xp_reward = max(xp_reward - 5, 5)
        
        # Check for achievement conditions
        achievements_unlocked = await self._check_task_achievements(task, user)
        
        return {
            "task": task,
            "xp_reward": xp_reward,
            "achievements_unlocked": achievements_unlocked
        }
    
    async def get_task_suggestions(self, user: User, limit: int = 5) -> List[Dict[str, Any]]:
        """Get AI-generated task suggestions based on user's study patterns"""
        # This would analyze user's tasks, study sessions, and preferences
        # For now, return generic suggestions
        
        suggestions = []
        
        # Example suggestions based on user profile
        if user.field_of_study:
            suggestions.append({
                "title": f"Review {user.field_of_study} fundamentals",
                "description": "Spend 30 minutes reviewing core concepts",
                "estimated_minutes": 30,
                "priority": "medium",
                "category": "review"
            })
        
        suggestions.append({
            "title": "Create weekly study plan",
            "description": "Plan your study sessions for the upcoming week",
            "estimated_minutes": 20,
            "priority": "high",
            "category": "planning"
        })
        
        suggestions.append({
            "title": "Review flashcards",
            "description": "Go through your flashcards for spaced repetition",
            "estimated_minutes": 15,
            "priority": "low",
            "category": "review"
        })
        
        return suggestions[:limit]
    
    async def _get_or_create_tag(self, tag_name: str, user_id: str) -> Tag:
        """Get existing tag or create new one"""
        result = await self.db.execute(
            select(Tag)
            .where(Tag.name == tag_name)
            .where(Tag.user_id == user_id)
        )
        tag = result.scalar_one_or_none()
        
        if not tag:
            tag = Tag(name=tag_name, user_id=user_id)
            self.db.add(tag)
        
        return tag
    
    async def _check_task_achievements(self, task: Task, user: User) -> List[str]:
        """Check and unlock achievements related to task completion"""
        achievements = []
        
        # Check for various achievement conditions
        # In a real app, you'd query Achievement table and check criteria
        
        # Example: First task completed
        result = await self.db.execute(
            select(Task)
            .where(Task.owner_id == user.id)
            .where(Task.status == "done")
        )
        completed_tasks = result.scalars().all()
        
        if len(completed_tasks) == 1:
            achievements.append("First Task Completed")
        
        # Example: 10 tasks completed
        if len(completed_tasks) == 10:
            achievements.append("Productivity Pro")
        
        # Example: Completed a hard task
        if task.difficulty == "hard":
            achievements.append("Challenge Accepted")
        
        # Example: Perfect timing
        if task.estimated_minutes and task.actual_minutes:
            if abs(task.estimated_minutes - task.actual_minutes) <= 5:
                achievements.append("Time Management Expert")
        
        return achievements