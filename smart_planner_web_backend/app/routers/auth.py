"""
Smart Study Planner - Firebase Authentication API Router
Handles login, registration, and token management with Firebase
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr

from app.config import settings
from app.services.firebase_auth import verify_firebase_token, initialize_firebase

logger = logging.getLogger(__name__)

# Security setup
security = HTTPBearer()

# ==================== REQUEST MODELS ====================

class LoginRequest(BaseModel):
    """Simple login request for email/password (for Firebase REST API)"""
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    """Registration request"""
    email: EmailStr
    password: str
    username: Optional[str] = None
    full_name: Optional[str] = None

class FirebaseLoginRequest(BaseModel):
    """Firebase login request"""
    id_token: str

class PhoneLoginRequest(BaseModel):
    """Phone login request"""
    phone_number: str
    verification_id: str
    otp: str

class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str
    new_password: str

class ChangePassword(BaseModel):
    """Change password request"""
    current_password: str
    new_password: str

class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    user: Optional[dict] = None

# ==================== UTILITY FUNCTIONS ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token (optional fallback)"""
    if not settings.SECRET_KEY or settings.SECRET_KEY == "your-secret-key-here-change-in-production":
        # If no JWT secret is set, return a simple token
        return "firebase_auth_only_token"
    
    from jose import jwt
    import uuid
    
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire, 
        "type": "access",
        "jti": str(uuid.uuid4())  # Unique token ID
    })
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.warning(f"JWT creation failed: {e}, using simple token")
        return "firebase_auth_only_token"

# ==================== DEPENDENCIES ====================

async def get_current_firebase_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Validate Firebase token and return user data
    This is the main authentication dependency for protected routes
    """
    try:
        # Verify Firebase token
        firebase_user = await verify_firebase_token(credentials)
        
        # You can optionally create/update user in your local database here
        # For now, just return the Firebase user data
        
        return firebase_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Firebase auth failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate Firebase credentials"
        )

async def get_current_user(
    current_user: dict = Depends(get_current_firebase_user)
) -> dict:
    """Get current active user (wrapper for consistency)"""
    return current_user

# Add this to app/routers/auth.py after the dependencies section

async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """Get current active user (wrapper for compatibility)"""
    return current_user

# ==================== ROUTER ====================

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ==================== ENDPOINTS ====================

@router.get("/test")
async def test_endpoint():
    """Test endpoint"""
    return {
        "message": "Firebase Auth router is working!",
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest
) -> Any:
    """
    Login user with email/password
    For development mode, returns a mock but valid response
    """
    try:
        # Development mode: accept any credentials
        # In production, validate against actual database/Firebase
        import uuid
        from datetime import datetime, timedelta
        
        # Generate a simple token
        token = str(uuid.uuid4()) + "-" + datetime.now().strftime("%Y%m%d%H%M%S")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 86400,  # 24 hours
            "refresh_token": token,
            "user": {
                "id": login_data.email,
                "email": login_data.email,
                "name": login_data.email.split("@")[0],
                "email_verified": True
            }
        }
        
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login failed. Please check your credentials."
        )

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    background_tasks: BackgroundTasks
) -> Any:
    """
    Register a new user
    For development, creates user without validation
    """
    try:
        import uuid
        
        # Generate a simple token
        token = str(uuid.uuid4()) + "-" + datetime.now().strftime("%Y%m%d%H%M%S")
        
        user_info = {
            "id": user_data.email,
            "email": user_data.email,
            "name": user_data.full_name or user_data.username or user_data.email.split("@")[0],
            "email_verified": False
        }
        
        logger.info(f"User registered: {user_data.email}")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": 86400,
            "refresh_token": token,
            "user": user_info
        }
        
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/firebase-login", response_model=TokenResponse)
async def firebase_login(
    login_data: FirebaseLoginRequest
) -> Any:
    """
    Login user using Firebase ID token (from Google, Facebook, etc.)
    """
    try:
        # Verify the Firebase ID token
        firebase_user = await verify_firebase_token(
            HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=login_data.id_token
            )
        )
        
        # Generate a JWT token for our backend (optional)
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": firebase_user.get("uid"),
                "email": firebase_user.get("email"),
                "firebase": True
            },
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": firebase_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Firebase login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase authentication failed"
        )

@router.post("/verify-token")
async def verify_token_endpoint(
    firebase_user: dict = Depends(get_current_firebase_user)
):
    """
    Verify Firebase token and return user info
    This endpoint is useful for testing authentication
    """
    return {
        "message": "Token verified successfully",
        "user": firebase_user,
        "authenticated": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/phone-login", response_model=TokenResponse)
async def phone_login(
    login_data: PhoneLoginRequest
):
    """
    Phone number login (requires Firebase Phone Auth setup)
    This is a simplified version - in production, you'd need to verify the OTP
    """
    try:
        # Note: Phone authentication requires additional setup
        # For now, this is a placeholder
        
        logger.info(f"Phone login attempt for: {login_data.phone_number}")
        
        # Simulate successful verification
        mock_user = {
            "uid": "phone_uid_" + login_data.phone_number.replace("+", ""),
            "phone_number": login_data.phone_number,
            "provider": "phone"
        }
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": mock_user["uid"],
                "phone": mock_user["phone_number"],
                "firebase": True
            },
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": mock_user
        }
        
    except Exception as e:
        logger.error(f"Phone login failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phone authentication failed"
        )

@router.post("/send-otp")
async def send_otp(
    phone_request: PhoneLoginRequest
):
    """
    Send OTP to phone number (simplified)
    """
    # In production, integrate with Firebase Phone Auth
    logger.info(f"Would send OTP to: {phone_request.phone_number}")
    
    return {
        "message": "OTP would be sent to phone number",
        "phone_number": phone_request.phone_number,
        "verification_id": "mock_verification_id_" + datetime.now().strftime("%Y%m%d%H%M%S")
    }

@router.post("/verify-otp")
async def verify_otp(
    verify_request: PhoneLoginRequest
):
    """
    Verify OTP (simplified)
    """
    # In production, verify with Firebase
    if len(verify_request.otp) == 6 and verify_request.otp.isdigit():
        return {
            "message": "OTP verified successfully",
            "verified": True,
            "id_token": "mock_firebase_id_token_for_phone"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )

@router.post("/refresh-token")
async def refresh_token(
    refresh_token: str
):
    """
    Refresh Firebase token
    """
    # Firebase tokens are refreshed client-side
    # This endpoint might not be needed if using Firebase directly
    return {
        "message": "Token refresh handled by Firebase client SDK",
        "note": "Use Firebase SDK's onIdTokenChanged listener"
    }

@router.post("/password-reset/request")
async def request_password_reset(
    request_data: PasswordResetRequest,
    background_tasks: BackgroundTasks
):
    """
    Request password reset email
    """
    # In production, use Firebase Admin SDK to send reset email
    logger.info(f"Password reset requested for: {request_data.email}")
    
    # Simulate background task
    if background_tasks:
        logger.info(f"Would send password reset email to {request_data.email}")
    
    # Always return success to prevent email enumeration
    return {
        "message": "If the email exists, a password reset link has been sent",
        "email": request_data.email
    }

@router.get("/me")
async def read_users_me(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user profile
    """
    return {
        "user": current_user,
        "authenticated": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/logout")
async def logout():
    """
    Logout user
    Note: Firebase tokens are stateless, logout is client-side
    """
    return {
        "message": "Logged out successfully. Please clear tokens on client side.",
        "note": "Firebase tokens cannot be invalidated server-side without additional setup"
    }

@router.get("/health")
async def auth_health():
    """Authentication service health check"""
    return {
        "status": "healthy",
        "service": "firebase-authentication",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "auth_methods": ["firebase_email_password", "firebase_phone", "firebase_social"],
        "firebase_initialized": True
    }

@router.get("/config")
async def get_firebase_config():
    """
    Get Firebase configuration for frontend
    Note: Only expose non-sensitive config
    """
    return {
        "project_id": settings.FIREBASE_PROJECT_ID if hasattr(settings, 'FIREBASE_PROJECT_ID') else None,
        "auth_domain": f"{settings.FIREBASE_PROJECT_ID}.firebaseapp.com" if hasattr(settings, 'FIREBASE_PROJECT_ID') else None,
        "api_key": "Configured in frontend",  # Frontend should get this from their own config
        "auth_methods": {
            "email_password": True,
            "phone": True,
            "google": True,
            "github": False
        }
    }