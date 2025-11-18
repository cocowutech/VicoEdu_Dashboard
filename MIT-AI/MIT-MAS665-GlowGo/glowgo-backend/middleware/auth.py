"""
Authentication middleware for FastAPI
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
import jwt

from config import settings


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to verify JWT tokens on protected routes
    
    This middleware extracts JWT tokens from the Authorization header
    and attaches the user_id to the request state for use in route handlers.
    
    Note: This is optional - we're using dependency injection with
    get_current_user() instead, which is more flexible.
    """
    
    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        # Paths that don't require authentication
        self.exclude_paths = exclude_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/auth/google-login",
            "/api/auth/logout",
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for excluded paths
        if request.url.path in self.exclude_paths:
            return await call_next(request)
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            # No auth header - let the endpoint handle it
            # (some endpoints may be optional auth)
            return await call_next(request)
        
        try:
            # Parse Bearer token
            scheme, token = auth_header.split()
            
            if scheme.lower() != "bearer":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication scheme"
                )
            
            # Verify token
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            # Attach user_id to request state
            request.state.user_id = payload.get("user_id")
            
        except ValueError:
            # Invalid header format
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Authorization header format"
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Continue to route handler
        response = await call_next(request)
        return response

