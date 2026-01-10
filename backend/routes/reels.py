"""
Reels routes for Loopync API
Handles short-form video content (reels/shorts)
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging

from .deps import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reels", tags=["Reels"])


class ReelCreate(BaseModel):
    videoUrl: str
    caption: str = ""
    thumbnail: Optional[str] = None
    music: Optional[dict] = None
    hashtags: List[str] = []
    duration: int = 0


class CommentCreate(BaseModel):
    text: str


@router.get("")
async def get_reels(limit: int = 50, skip: int = 0, userId: str = None):
    """Get reels for the feed"""
    db = get_db()
    
    query = {}
    if userId:
        query["authorId"] = userId
    
    reels = await db.reels.find(query, {"_id": 0}).sort("createdAt", -1).skip(skip).to_list(limit)
    
    for reel in reels:
        author = await db.users.find_one({"id": reel.get("authorId")}, {"_id": 0, "password": 0})
        reel["author"] = author
        reel["likeCount"] = len(reel.get("likedBy", []))
        reel["viewCount"] = reel.get("views", 0)
    
    return reels


@router.post("")
async def create_reel(authorId: str, reel: ReelCreate):
    """Create a new reel"""
    db = get_db()
    
    new_reel = {
        "id": str(uuid.uuid4()),
        "authorId": authorId,
        "videoUrl": reel.videoUrl,
        "caption": reel.caption,
        "thumbnail": reel.thumbnail,
        "music": reel.music,
        "hashtags": reel.hashtags,
        "duration": reel.duration,
        "views": 0,
        "likedBy": [],
        "stats": {"likes": 0, "comments": 0, "shares": 0},
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reels.insert_one(new_reel)
    
    author = await db.users.find_one({"id": authorId}, {"_id": 0, "password": 0})
    new_reel["author"] = author
    new_reel.pop("_id", None)
    
    return new_reel


@router.get("/{reelId}")
async def get_reel(reelId: str):
    """Get a specific reel"""
    db = get_db()
    
    reel = await db.reels.find_one({"id": reelId}, {"_id": 0})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    
    author = await db.users.find_one({"id": reel.get("authorId")}, {"_id": 0, "password": 0})
    reel["author"] = author
    reel["likeCount"] = len(reel.get("likedBy", []))
    
    return reel


@router.post("/{reelId}/like")
async def like_reel(reelId: str, userId: str):
    """Like or unlike a reel"""
    db = get_db()
    
    reel = await db.reels.find_one({"id": reelId}, {"_id": 0})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    
    liked_by = reel.get("likedBy", [])
    
    if userId in liked_by:
        await db.reels.update_one(
            {"id": reelId},
            {
                "$pull": {"likedBy": userId},
                "$inc": {"stats.likes": -1}
            }
        )
        return {"action": "unliked", "likes": len(liked_by) - 1}
    else:
        await db.reels.update_one(
            {"id": reelId},
            {
                "$addToSet": {"likedBy": userId},
                "$inc": {"stats.likes": 1}
            }
        )
        return {"action": "liked", "likes": len(liked_by) + 1}


@router.post("/{reelId}/view")
async def view_reel(reelId: str):
    """Increment view count for a reel"""
    db = get_db()
    
    await db.reels.update_one({"id": reelId}, {"$inc": {"views": 1}})
    return {"success": True}


@router.get("/{reelId}/comments")
async def get_reel_comments(reelId: str):
    """Get comments for a reel"""
    db = get_db()
    
    comments = await db.reel_comments.find({"reelId": reelId}, {"_id": 0}).sort("createdAt", -1).to_list(100)
    
    for comment in comments:
        author = await db.users.find_one({"id": comment.get("authorId")}, {"_id": 0, "password": 0})
        comment["author"] = author
    
    return comments


@router.post("/{reelId}/comments")
async def add_reel_comment(reelId: str, authorId: str, comment: CommentCreate):
    """Add a comment to a reel"""
    db = get_db()
    
    reel = await db.reels.find_one({"id": reelId}, {"_id": 0})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    
    new_comment = {
        "id": str(uuid.uuid4()),
        "reelId": reelId,
        "authorId": authorId,
        "text": comment.text,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reel_comments.insert_one(new_comment)
    await db.reels.update_one({"id": reelId}, {"$inc": {"stats.comments": 1}})
    
    author = await db.users.find_one({"id": authorId}, {"_id": 0, "password": 0})
    new_comment["author"] = author
    new_comment.pop("_id", None)
    
    return new_comment


@router.delete("/{reelId}")
async def delete_reel(reelId: str, userId: str):
    """Delete a reel - only owner can delete"""
    db = get_db()
    
    reel = await db.reels.find_one({"id": reelId}, {"_id": 0})
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    
    if reel.get("authorId") != userId:
        raise HTTPException(status_code=403, detail="You can only delete your own reels")
    
    await db.reels.delete_one({"id": reelId})
    await db.reel_comments.delete_many({"reelId": reelId})
    
    return {"success": True, "message": "Reel deleted"}
