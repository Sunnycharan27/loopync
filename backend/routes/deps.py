"""
Common dependencies for route handlers
"""
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
import jwt
import os

# Security scheme
security = HTTPBearer()

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = 'HS256'

def verify_token(token: str) -> Optional[str]:
    """Verify a JWT token and return the user_id if valid"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get('sub')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Database instance - will be set by main server
_db: Optional[AsyncIOMotorDatabase] = None

def set_database(db: AsyncIOMotorDatabase):
    """Set the database instance for routes to use"""
    global _db
    _db = db

def get_db() -> AsyncIOMotorDatabase:
    """Get the database instance"""
    if _db is None:
        raise RuntimeError("Database not initialized")
    return _db

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to get the current authenticated user"""
    from auth_service import AuthService
    
    token = credentials.credentials
    user_id = verify_token(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    db = get_db()
    # Get user from MongoDB
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """Optional user dependency - doesn't require authentication"""
    try:
        return await get_current_user(credentials)
    except Exception:
        return None
