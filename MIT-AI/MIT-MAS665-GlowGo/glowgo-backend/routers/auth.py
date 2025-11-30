"""
Authentication router for Google OAuth and JWT token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from schemas.auth import (
    GoogleLoginRequest,
    GoogleLoginResponse,
    UserResponse,
    ErrorResponse
)
from models.user import User
from utils.db import get_db
from utils.auth import (
    decode_google_id_token,
    get_user_info_from_access_token,
    generate_jwt_token,
    get_current_user
)


router = APIRouter(tags=["authentication"])


@router.post(
    "/google-login",
    response_model=GoogleLoginResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or expired token"},
        500: {"model": ErrorResponse, "description": "Server error"}
    }
)
async def google_login(
    request: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with Google OAuth ID token OR Access Token
    
    Flow:
    1. Verify Google ID token (if present) or Access Token with Google's servers
    2. Extract user information from token
    3. Check if user exists in database
    4. Create new user if doesn't exist, update if exists
    5. Generate JWT token for session management
    6. Return JWT token and user data
    
    Args:
        request: GoogleLoginRequest with id_token and/or access_token
        db: Database session
        
    Returns:
        GoogleLoginResponse with access_token and user data
        
    Raises:
        HTTPException: If token is invalid or database error occurs
    """
    try:
        # Step 1: Verify Token
        google_user_info = None
        
        if request.id_token:
            # Verify ID Token
            google_user_info = await decode_google_id_token(request.id_token)
        elif request.access_token:
            # Verify Access Token
            google_user_info = await get_user_info_from_access_token(request.access_token)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either id_token or access_token is required"
            )
        
        # Extract user information
        email = google_user_info.get("email")
        google_id = google_user_info.get("google_id")
        given_name = google_user_info.get("given_name", "")
        family_name = google_user_info.get("family_name", "")
        picture = google_user_info.get("picture")
        
        if not email or not google_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and Google ID are required from token"
            )
        
        # Step 2: Check if user exists
        user = db.query(User).filter(
            (User.email == email) | (User.google_id == google_id)
        ).first()
        
        if user:
            # Step 3a: Update existing user
            user.google_id = google_id
            user.first_name = given_name or user.first_name
            user.last_name = family_name or user.last_name
            user.profile_photo_url = picture or user.profile_photo_url
            if request.access_token:
                user.google_access_token = request.access_token
            user.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(user)
            
        else:
            # Step 3b: Create new user
            user = User(
                email=email,
                google_id=google_id,
                first_name=given_name or "User",
                last_name=family_name or "",
                profile_photo_url=picture,
                google_access_token=request.access_token
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Step 4: Generate JWT token
        access_token = generate_jwt_token(str(user.id))
        
        # Step 5: Return response
        return GoogleLoginResponse(
            success=True,
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                profile_photo_url=user.profile_photo_url,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (from token verification)
        raise
        
    except Exception as e:
        # Log error (in production, use proper logging)
        print(f"Error during Google login: {str(e)}")
        
        # Rollback transaction
        db.rollback()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during authentication"
        )


@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized - invalid or missing token"},
        404: {"model": ErrorResponse, "description": "User not found"}
    }
)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user profile"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        profile_photo_url=current_user.profile_photo_url,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )
