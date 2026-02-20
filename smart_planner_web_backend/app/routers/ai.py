# app/routers/ai.py - MINIMAL VERSION

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import openai
from app.routers.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Tutor"])

# Load OpenAI API key from environment variable
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY not set in environment variables.")
openai.api_key = OPENAI_API_KEY


class SummarizeRequest(BaseModel):
    text: str


class BreakdownRequest(BaseModel):
    title: str
    description: Optional[str] = None
    n_subtasks: int = 5


@router.post("/summarize")
async def summarize_text(
    request: SummarizeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Summarize text using OpenAI"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful study assistant. Summarize the following text."},
                {"role": "user", "content": request.text}
            ],
            max_tokens=256,
            temperature=0.5
        )
        summary = response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {e}")
    return {
        "summary": summary,
        "original_length": len(request.text),
        "summary_length": len(summary),
        "user_id": current_user.get("uid")
    }


@router.post("/breakdown")
async def breakdown_task(
    request: BreakdownRequest,
    current_user: dict = Depends(get_current_user)
):
    """Break down a task into subtasks using OpenAI"""
    prompt = (
        f"Break down the following task into {request.n_subtasks} actionable subtasks. "
        f"Task Title: {request.title}\n"
        f"Description: {request.description or ''}\n"
        "Return the subtasks as a numbered list."
    )
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that breaks down tasks for students."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=512,
            temperature=0.5
        )
        breakdown = response.choices[0].message.content.strip()
        # Parse the numbered list into subtasks
        subtasks = []
        for idx, line in enumerate(breakdown.split('\n')):
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith("-") or line.startswith("•")):
                # Remove leading number/bullet
                title = line.lstrip("0123456789.-• ")
                subtasks.append({
                    "id": idx + 1,
                    "title": title,
                    "description": "",
                    "estimated_time": None,
                    "priority": idx + 1
                })
        if not subtasks:
            # fallback: treat each line as a subtask
            for idx, line in enumerate(breakdown.split('\n')):
                if line.strip():
                    subtasks.append({
                        "id": idx + 1,
                        "title": line.strip(),
                        "description": "",
                        "estimated_time": None,
                        "priority": idx + 1
                    })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {e}")
    return {
        "task_title": request.title,
        "subtasks": subtasks,
        "total_subtasks": len(subtasks),
        "user_id": current_user.get("uid")
    }


@router.get("/health")
async def ai_health():
    """AI service health check"""
    return {
        "status": "healthy",
        "service": "ai-tutor",
        "ai_provider": "openai",
        "note": "Using OpenAI GPT-3.5-turbo"
    }
