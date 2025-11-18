from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Google OAuth Schemas

class GoogleLoginRequest(BaseModel):
    """Request schema for Google OAuth login"""
    id_token: str = Field(..., description="Google ID token from OAuth flow")


class UserResponse(BaseModel):
    """User response schema"""
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    profile_photo_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class GoogleLoginResponse(BaseModel):
    """Response schema for successful Google login"""
    success: bool = True
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: str
    code: str


# JWT Token Schemas

class Token(BaseModel):
    """JWT token response schema"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data"""
    user_id: Optional[str] = None
    exp: Optional[datetime] = None


# User Management Schemas

class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    first_name: str
    last_name: str
    google_id: Optional[str] = None
    profile_photo_url: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema for updating user"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile_photo_url: Optional[str] = None


