"""
Authentication schemas for Google OAuth and User management
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Google OAuth Schemas

class GoogleLoginRequest(BaseModel):
    """Request schema for Google OAuth login"""
    id_token: Optional[str] = Field(None, description="Google ID token from OAuth flow")
    access_token: Optional[str] = Field(None, description="Google Access Token for Calendar API")


class UserResponse(BaseModel):
    """User response schema"""
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    profile_photo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class GoogleLoginResponse(BaseModel):
    """Response schema for Google login"""
    success: bool
    access_token: str
    token_type: str
    user: UserResponse


class ErrorResponse(BaseModel):
    """Standard error response schema"""
    detail: str
