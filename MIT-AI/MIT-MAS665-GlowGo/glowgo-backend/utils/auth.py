"""
Authentication utilities for Google OAuth and JWT token management
"""

from datetime import datetime, timedelta
from typing import Optional
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from config import settings
from models.user import User
from utils.db import get_db


# Security scheme for JWT Bearer tokens
security = HTTPBearer()


async def decode_google_id_token(token: str) -> dict:
    """
    Decode and verify Google ID token
    
    Args:
        token: Google ID token string
        
    Returns:
        dict: Decoded token payload with user info
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Verify the token with Google's public keys
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        
        # Verify the token is for our app
        if idinfo['aud'] != settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token audience",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Extract user information
        return {
            "email": idinfo.get("email"),
            "given_name": idinfo.get("given_name", ""),
            "family_name": idinfo.get("family_name", ""),
            "picture": idinfo.get("picture"),
            "google_id": idinfo.get("sub"),  # Google user ID
        }
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # Other errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def generate_jwt_token(user_id: str) -> str:
    """
    Generate JWT token for user session
    
    Args:
        user_id: User UUID as string
        
    Returns:
        str: JWT token
    """
    # Calculate expiration time
    expiration = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRY_DAYS)
    
    # Create payload
    payload = {
        "user_id": user_id,
        "exp": expiration,
        "iat": datetime.utcnow(),
    }
    
    # Generate token
    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token


def verify_jwt_token(token: str) -> str:
    """
    Verify JWT token and extract user_id
    
    Args:
        token: JWT token string
        
    Returns:
        str: User ID from token
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Decode and verify token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Extract user_id
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user_id",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_id
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    
    This is a FastAPI dependency that can be used in route handlers
    to require authentication and get the current user.
    
    Args:
        credentials: HTTP Bearer credentials from request header
        db: Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Extract token from credentials
    token = credentials.credentials
    
    # Verify token and get user_id
    user_id = verify_jwt_token(token)
    
    # Query user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None
    
    This is useful for endpoints that work with or without authentication.
    
    Args:
        credentials: Optional HTTP Bearer credentials
        db: Database session
        
    Returns:
        Optional[User]: Current user if authenticated, None otherwise
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None

