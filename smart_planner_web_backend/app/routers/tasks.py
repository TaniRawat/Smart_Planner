# app/routers/tasks.py - MINIMAL VERSION
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.routers.auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

class Task(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    completed: bool = False
    priority: int = 1
    due_date: Optional[datetime] = None
    created_at: datetime = datetime.now()

# Mock data for testing
mock_tasks = [
    {"id": "1", "title": "Complete math homework", "completed": False, "priority": 1},
    {"id": "2", "title": "Read chapter 5", "completed": True, "priority": 2},
    {"id": "3", "title": "Prepare for exam", "completed": False, "priority": 3},
]

@router.get("/")
async def list_tasks(current_user: dict = Depends(get_current_user)):
    """List all tasks for current user"""
    return {
        "tasks": mock_tasks,
        "user_id": current_user.get("uid"),
        "total": len(mock_tasks)
    }

@router.post("/")
async def create_task(task_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new task"""
    new_task = {
        "id": str(len(mock_tasks) + 1),
        "title": task_data.get("title", "Untitled Task"),
        "description": task_data.get("description"),
        "completed": False,
        "priority": task_data.get("priority", 1),
        "user_id": current_user.get("uid"),
        "created_at": datetime.now()
    }
    mock_tasks.append(new_task)
    return {"task": new_task, "message": "Task created successfully"}

@router.get("/{task_id}")
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific task"""
    for task in mock_tasks:
        if task["id"] == task_id:
            return {"task": task}
    raise HTTPException(status_code=404, detail="Task not found")

@router.put("/{task_id}")
async def update_task(task_id: str, updates: dict, current_user: dict = Depends(get_current_user)):
    """Update a task"""
    for task in mock_tasks:
        if task["id"] == task_id:
            task.update(updates)
            return {"task": task, "message": "Task updated successfully"}
    raise HTTPException(status_code=404, detail="Task not found")

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a task"""
    global mock_tasks
    initial_length = len(mock_tasks)
    mock_tasks = [task for task in mock_tasks if task["id"] != task_id]
    
    if len(mock_tasks) < initial_length:
        return {"message": "Task deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Task not found")