# app/routers/users.py - MINIMAL VERSION for Firebase
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.routers.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

class UserProfile(BaseModel):
    uid: str
    email: Optional[str] = None
    name: Optional[str] = None
    phone_number: Optional[str] = None
    picture: Optional[str] = None
    email_verified: bool = False

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile from Firebase"""
    return {
        "user": current_user,
        "profile": UserProfile(**current_user).dict(),
        "message": "User profile retrieved successfully"
    }

@router.get("/{user_id}")
async def get_user_by_id(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user by ID (simplified for Firebase)"""
    # In production, you might check if current_user has permission to view this user
    # For now, return the current user if IDs match
    if user_id == current_user.get("uid"):
        return {
            "user": current_user,
            "message": "User found"
        }
    else:
        raise HTTPException(
            status_code=404,
            detail="User not found or insufficient permissions"
        )

@router.put("/me")
async def update_user_profile(
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile (simplified - in production, update in Firebase)"""
    # Note: Updating Firebase user profiles requires Admin SDK
    # This is a placeholder for future implementation
    return {
        "message": "Profile update endpoint",
        "note": "In production, update user in Firebase Auth",
        "current_user": current_user,
        "update_data": update_data
    }

@router.get("/")
async def list_users(current_user: dict = Depends(get_current_user)):
    """List users (simplified - in production, would require admin permissions)"""
    # This would normally require admin permissions
    # For now, just return current user
    return {
        "users": [current_user],
        "total": 1,
        "message": "Users list (admin functionality not implemented)"
    }

@router.get("/health")
async def users_health():
    """Users service health check"""
    return {
        "status": "healthy",
        "service": "users",
        "database": "firebase-auth"
    }