"""
Capsules (Stories) routes for Loopync API
Handles 24-hour temporary content (VibeCapsules)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging

from .deps import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/capsules", tags=["Capsules"])


class CapsuleCreate(BaseModel):
    mediaUrl: str
    mediaType: str = "image"  # image, video
    caption: str = ""
    music: Optional[dict] = None
    duration: int = 5  # Display duration in seconds
    filters: List[str] = []


@router.get("")
async def get_capsules(limit: int = 50):
    """Get active capsules (stories) from followed users"""
    db = get_db()
    
    # Get capsules that haven't expired
    now = datetime.now(timezone.utc).isoformat()
    capsules = await db.vibe_capsules.find(
        {"expiresAt": {"$gt": now}},
        {"_id": 0}
    ).sort("createdAt", -1).to_list(limit)
    
    # Group by author
    author_capsules = {}
    for capsule in capsules:
        author_id = capsule.get("authorId")
        if author_id not in author_capsules:
            author = await db.users.find_one({"id": author_id}, {"_id": 0, "password": 0})
            author_capsules[author_id] = {
                "author": author,
                "capsules": [],
                "latestAt": capsule.get("createdAt")
            }
        author_capsules[author_id]["capsules"].append(capsule)
    
    # Convert to list and sort by latest
    result = list(author_capsules.values())
    result.sort(key=lambda x: x["latestAt"], reverse=True)
    
    return result


@router.post("")
async def create_capsule(authorId: str, capsule: CapsuleCreate):
    """Create a new capsule (story)"""
    db = get_db()
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=24)
    
    new_capsule = {
        "id": str(uuid.uuid4()),
        "authorId": authorId,
        "mediaUrl": capsule.mediaUrl,
        "mediaType": capsule.mediaType,
        "caption": capsule.caption,
        "music": capsule.music,
        "duration": capsule.duration,
        "filters": capsule.filters,
        "views": 0,
        "viewedBy": [],
        "reactions": {},
        "createdAt": now.isoformat(),
        "expiresAt": expires_at.isoformat()
    }
    
    await db.vibe_capsules.insert_one(new_capsule)
    
    author = await db.users.find_one({"id": authorId}, {"_id": 0, "password": 0})
    new_capsule["author"] = author
    new_capsule.pop("_id", None)
    
    return new_capsule


@router.post("/{capsuleId}/view")
async def view_capsule(capsuleId: str, userId: str = None):
    """Record a view on a capsule"""
    db = get_db()
    
    update = {"$inc": {"views": 1}}
    if userId:
        update["$addToSet"] = {"viewedBy": userId}
    
    await db.vibe_capsules.update_one({"id": capsuleId}, update)
    return {"success": True}


@router.post("/{capsuleId}/react")
async def react_to_capsule(capsuleId: str, userId: str, reaction: str = "like"):
    """Add a reaction to a capsule"""
    db = get_db()
    
    capsule = await db.vibe_capsules.find_one({"id": capsuleId}, {"_id": 0})
    if not capsule:
        raise HTTPException(status_code=404, detail="Capsule not found")
    
    reactions = capsule.get("reactions", {})
    if reaction not in reactions:
        reactions[reaction] = []
    
    if userId in reactions[reaction]:
        # Remove reaction
        reactions[reaction].remove(userId)
        action = "removed"
    else:
        # Add reaction
        reactions[reaction].append(userId)
        action = "added"
    
    await db.vibe_capsules.update_one(
        {"id": capsuleId},
        {"$set": {"reactions": reactions}}
    )
    
    return {"action": action, "reaction": reaction}


@router.get("/{authorId}/insights")
async def get_capsule_insights(authorId: str):
    """Get insights for a user's capsules"""
    db = get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Get active capsules
    active = await db.vibe_capsules.find(
        {"authorId": authorId, "expiresAt": {"$gt": now}},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate totals
    total_views = sum(c.get("views", 0) for c in active)
    total_reactions = sum(
        sum(len(users) for users in c.get("reactions", {}).values())
        for c in active
    )
    unique_viewers = set()
    for c in active:
        unique_viewers.update(c.get("viewedBy", []))
    
    return {
        "activeCapsules": len(active),
        "totalViews": total_views,
        "uniqueViewers": len(unique_viewers),
        "totalReactions": total_reactions,
        "capsules": active
    }


@router.delete("/{capsuleId}")
async def delete_capsule(capsuleId: str, userId: str):
    """Delete a capsule - only owner can delete"""
    db = get_db()
    
    capsule = await db.vibe_capsules.find_one({"id": capsuleId}, {"_id": 0})
    if not capsule:
        raise HTTPException(status_code=404, detail="Capsule not found")
    
    if capsule.get("authorId") != userId:
        raise HTTPException(status_code=403, detail="You can only delete your own capsules")
    
    await db.vibe_capsules.delete_one({"id": capsuleId})
    return {"success": True, "message": "Capsule deleted"}
