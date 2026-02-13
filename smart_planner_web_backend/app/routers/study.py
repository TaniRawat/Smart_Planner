# app/routers/study.py - MINIMAL VERSION
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from app.routers.auth import get_current_user

router = APIRouter(prefix="/study", tags=["Study Sessions"])

@router.get("/sessions")
async def get_study_sessions(current_user: dict = Depends(get_current_user)):
    """Get study sessions for current user"""
    mock_sessions = [
        {
            "id": "1",
            "subject": "Mathematics",
            "duration_minutes": 60,
            "date": (datetime.now() - timedelta(days=1)).isoformat(),
            "notes": "Studied calculus"
        },
        {
            "id": "2",
            "subject": "Physics",
            "duration_minutes": 45,
            "date": (datetime.now() - timedelta(days=2)).isoformat(),
            "notes": "Newton's laws"
        }
    ]
    
    return {
        "sessions": mock_sessions,
        "user_id": current_user.get("uid"),
        "total_sessions": len(mock_sessions)
    }

@router.post("/sessions")
async def create_study_session(session_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new study session"""
    new_session = {
        "id": str(len(session_data) + 1),
        **session_data,
        "user_id": current_user.get("uid"),
        "created_at": datetime.now().isoformat()
    }
    
    return {
        "session": new_session,
        "message": "Study session recorded successfully"
    }