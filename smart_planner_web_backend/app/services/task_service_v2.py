"""
Task Service - Complete CRUD and business logic
"""

from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from ..models import Task, User, Tag, TaskStatus, TaskPriority
from ..schemas_v2 import TaskCreate, TaskUpdate, TaskResponse

logger = logging.getLogger(__name__)


class TaskService:
    """Complete task management service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_task(
        self, 
        task_in: TaskCreate, 
        user_id: str
    ) -> Task:
        """Create a new task"""
        try:
            due_date = task_in.due_date
            if isinstance(due_date, datetime):
                due_date = due_date.date()

            task = Task(
                title=task_in.title,
                description=task_in.description,
                priority=task_in.priority,
                due_date=due_date,
                estimated_minutes=task_in.estimated_minutes,
                owner_id=user_id,
                status=TaskStatus.TODO
            )
            
            # Handle tags
            if task_in.tags:
                for tag_name in task_in.tags:
                    stmt = select(Tag).where(
                        and_(Tag.name == tag_name, Tag.user_id == user_id)
                    )
                    result = await self.db.execute(stmt)
                    tag = result.scalar_one_or_none()
                    
                    if not tag:
                        tag = Tag(name=tag_name, user_id=user_id)
                        self.db.add(tag)
                    
                    task.tags.append(tag)
            
            self.db.add(task)
            await self.db.flush()
            await self.db.commit()
            await self.db.refresh(task)
            
            logger.info(f"Task created: {task.id} for user {user_id}")
            return task
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating task: {e}")
            raise

    async def get_task(self, task_id: int, user_id: str) -> Optional[Task]:
        """Get a specific task"""
        stmt = select(Task).where(
            and_(Task.id == task_id, Task.owner_id == user_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_tasks(
        self,
        user_id: str,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None
    ) -> tuple[List[Task], int]:
        """Get paginated user tasks with filters"""
        filters = [Task.owner_id == user_id]
        
        if status:
            filters.append(Task.status == status)
        if priority:
            filters.append(Task.priority == priority)
        if search:
            filters.append(
                or_(
                    Task.title.ilike(f"%{search}%"),
                    Task.description.ilike(f"%{search}%")
                )
            )
        
        # Get total count
        count_stmt = select(Task).where(and_(*filters))
        count_result = await self.db.execute(count_stmt)
        total = len(count_result.scalars().all())
        
        # Get paginated results
        stmt = (
            select(Task)
            .where(and_(*filters))
            .order_by(desc(Task.due_date), desc(Task.priority))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        tasks = result.scalars().all()
        
        return tasks, total

    async def update_task(
        self,
        task_id: int,
        task_update: TaskUpdate,
        user_id: str
    ) -> Optional[Task]:
        """Update a task"""
        task = await self.get_task(task_id, user_id)
        if not task:
            return None
        
        update_data = task_update.model_dump(exclude_unset=True)

        if "due_date" in update_data and isinstance(update_data["due_date"], datetime):
            update_data["due_date"] = update_data["due_date"].date()
        
        for field, value in update_data.items():
            setattr(task, field, value)
        
        task.updated_at = datetime.utcnow()
        
        try:
            await self.db.commit()
            await self.db.refresh(task)
            logger.info(f"Task updated: {task_id}")
            return task
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating task: {e}")
            raise

    async def delete_task(self, task_id: int, user_id: str) -> bool:
        """Delete a task"""
        task = await self.get_task(task_id, user_id)
        if not task:
            return False
        
        try:
            await self.db.delete(task)
            await self.db.commit()
            logger.info(f"Task deleted: {task_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting task: {e}")
            raise

    async def complete_task(
        self,
        task_id: int,
        user_id: str,
        actual_time_minutes: Optional[int] = None
    ) -> Optional[Task]:
        """Mark task as complete"""
        task = await self.get_task(task_id, user_id)
        if not task:
            return None
        
        task.status = TaskStatus.DONE
        task.completed_at = datetime.utcnow()
        if actual_time_minutes:
            task.actual_minutes = actual_time_minutes
        
        try:
            await self.db.commit()
            await self.db.refresh(task)
            logger.info(f"Task marked complete: {task_id}")
            return task
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error completing task: {e}")
            raise

    async def get_overdue_tasks(self, user_id: str) -> List[Task]:
        """Get all overdue tasks"""
        stmt = select(Task).where(
            and_(
                Task.owner_id == user_id,
                Task.due_date < datetime.utcnow(),
                Task.status != TaskStatus.DONE
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_tasks_by_priority(
        self,
        user_id: str,
        priority: TaskPriority
    ) -> List[Task]:
        """Get tasks by priority"""
        stmt = select(Task).where(
            and_(
                Task.owner_id == user_id,
                Task.priority == priority,
                Task.status != TaskStatus.DONE
            )
        ).order_by(Task.due_date)
        result = await self.db.execute(stmt)
        return result.scalars().all()
