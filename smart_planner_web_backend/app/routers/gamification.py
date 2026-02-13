# app/routers/gamification.py - MINIMAL VERSION
from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user

router = APIRouter(prefix="/gamification", tags=["Gamification"])

@router.get("/stats")
async def get_gamification_stats(current_user: dict = Depends(get_current_user)):
    """Get gamification stats for current user"""
    return {
        "user_id": current_user.get("uid"),
        "xp_points": 150,
        "level": 2,
        "streak_days": 7,
        "achievements": [
            {"id": "first_login", "name": "First Login", "unlocked": True},
            {"id": "task_master", "name": "Complete 5 Tasks", "unlocked": False}
        ],
        "leaderboard_position": 42
    }