# Routes package for Loopync API
# This module contains all API route handlers organized by feature

from fastapi import APIRouter

# Import routers
from .auth import router as auth_router
from .users import router as users_router
from .posts import router as posts_router
from .friends import router as friends_router
from .tribes import router as tribes_router
from .reels import router as reels_router
from .capsules import router as capsules_router

# Create main API router
api_router = APIRouter(prefix="/api")

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(posts_router)
api_router.include_router(friends_router)
api_router.include_router(tribes_router)
api_router.include_router(reels_router)
api_router.include_router(capsules_router)

__all__ = [
    "api_router",
    "auth_router",
    "users_router", 
    "posts_router",
    "friends_router",
    "tribes_router",
    "reels_router",
    "capsules_router",
]
