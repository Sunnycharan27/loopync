# Routes package for Loopync API
# This module contains all API route handlers organized by feature

from fastapi import APIRouter

# Main router for all API routes
api_router = APIRouter(prefix="/api")

# Import and include all routers
# These will be added as we migrate routes from server.py
