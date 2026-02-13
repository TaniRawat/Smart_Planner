# app/services/firebase_auth.py
import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            # Create credentials from environment variables
            cred_dict = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{os.getenv('FIREBASE_CLIENT_EMAIL', '').replace('@', '%40')}"
            }
            
            # Validate required fields
            if not cred_dict["project_id"] or not cred_dict["private_key"]:
                raise ValueError("Missing Firebase credentials in environment variables")
            
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully")
            
    except Exception as e:
        print(f"⚠️ Firebase initialization warning: {e}")
        # Don't raise in development mode

async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Verify token and return user data
    
    In development mode: accepts any Bearer token
    In production: verifies Firebase ID token
    """
    try:
        import uuid
        from ..config import settings
        
        # Development mode: accept any token
        if settings.ENVIRONMENT == "development" or settings.DEBUG:
            # Extract email-like identifier from token if possible
            token = credentials.credentials
            user_id_str = token.split('-')[0][:20]
            
            # Generate a consistent UUID for this user ID
            user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{user_id_str}.dev"))
            
            return {
                "uid": user_uuid,
                "email": f"{user_id_str}@dev.local",
                "phone_number": None,
                "name": user_id_str,
                "picture": None
            }
        
        # Production mode: verify Firebase token
        decoded_token = auth.verify_id_token(
            credentials.credentials,
            check_revoked=True
        )
        
        # Extract user information
        user = {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "phone_number": decoded_token.get("phone_number"),
            "name": decoded_token.get("name"),
            "picture": decoded_token.get("picture")
        }
        
        return user
        
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )