"""
Tribes routes for Loopync API
Handles tribe creation, membership, posts, and tribe-specific content
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging

from .deps import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tribes", tags=["Tribes"])


class TribeCreate(BaseModel):
    name: str
    tags: List[str] = []
    type: str = "public"
    category: str = "default"
    description: str = ""
    avatar: str = ""
    coverImage: str = ""


class TribeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    type: Optional[str] = None
    category: Optional[str] = None
    avatar: Optional[str] = None
    coverImage: Optional[str] = None


@router.get("")
async def get_tribes(limit: int = 50):
    """Get list of all tribes"""
    db = get_db()
    tribes = await db.tribes.find({}, {"_id": 0}).sort("memberCount", -1).to_list(limit)
    return tribes


@router.get("/{tribeId}")
async def get_tribe(tribeId: str):
    """Get a specific tribe by ID"""
    db = get_db()
    tribe = await db.tribes.find_one({"id": tribeId}, {"_id": 0})
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
    return tribe


@router.post("")
async def create_tribe(tribe: TribeCreate, ownerId: str):
    """Create a new tribe"""
    db = get_db()
    
    tribe_obj = {
        "id": str(uuid.uuid4()),
        "name": tribe.name,
        "tags": tribe.tags,
        "type": tribe.type,
        "category": tribe.category,
        "description": tribe.description,
        "avatar": tribe.avatar or "https://api.dicebear.com/7.x/shapes/svg?seed=tribe",
        "coverImage": tribe.coverImage,
        "ownerId": ownerId,
        "members": [ownerId],
        "memberCount": 1,
        "invitedBy": [],
        "shareCount": 0,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tribes.insert_one(tribe_obj)
    tribe_obj.pop('_id', None)
    return tribe_obj


@router.put("/{tribeId}")
async def update_tribe(tribeId: str, updates: TribeUpdate, userId: str):
    """Update tribe settings - only owner can update"""
    db = get_db()
    
    tribe = await db.tribes.find_one({"id": tribeId}, {"_id": 0})
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
    
    if tribe.get("ownerId") != userId:
        raise HTTPException(status_code=403, detail="Only the tribe owner can update settings")
    
    update_dict = {}
    for field, value in updates.model_dump().items():
        if value is not None:
            update_dict[field] = value
    
    if update_dict:
        await db.tribes.update_one({"id": tribeId}, {"$set": update_dict})
    
    updated_tribe = await db.tribes.find_one({"id": tribeId}, {"_id": 0})
    return updated_tribe


@router.delete("/{tribeId}")
async def delete_tribe(tribeId: str, userId: str):
    """Delete a tribe - only owner can delete"""
    db = get_db()
    
    tribe = await db.tribes.find_one({"id": tribeId}, {"_id": 0})
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
    
    if tribe.get("ownerId") != userId:
        raise HTTPException(status_code=403, detail="Only the tribe owner can delete the tribe")
    
    await db.posts.delete_many({"tribeId": tribeId})
    await db.tribes.delete_one({"id": tribeId})
    
    return {"message": "Tribe deleted successfully"}


@router.get("/{tribeId}/members")
async def get_tribe_members(tribeId: str):
    """Get tribe members with their profiles"""
    db = get_db()
    
    tribe = await db.tribes.find_one({"id": tribeId}, {"_id": 0})
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
    
    member_ids = tribe.get("members", [])
    members = await db.users.find({"id": {"$in": member_ids}}, {"_id": 0, "password": 0}).to_list(100)
    return members


@router.post("/{tribeId}/join")
async def join_tribe(tribeId: str, userId: str):
    """Join a tribe"""
    db = get_db()
    
    tribe = await db.tribes.find_one({"id": tribeId}, {"_id": 0})
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
    
    members = tribe.get("members", [])
    if userId in members:
        return {"message": "Already a member", "memberCount": len(members)}
    
    members.append(userId)
    await db.tribes.update_one({"id": tribeId}, {"$set": {"members": members, "memberCount": len(members)}})
    return {"message": "Joined", "memberCount": len(members)}


@router.post("/{tribeId}/leave")
async def leave_tribe(tribeId: str, userId: str):
    """Leave a tribe"""
    db = get_db()
    
    tribe = await db.tribes.find_one({"id": tribeId}, {"_id": 0})
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
    
    members = tribe.get("members", [])
    if userId not in members:
        return {"message": "Not a member", "memberCount": len(members)}
    
    members.remove(userId)
    await db.tribes.update_one({"id": tribeId}, {"$set": {"members": members, "memberCount": len(members)}})
    return {"message": "Left", "memberCount": len(members)}


@router.get("/{tribeId}/posts")
async def get_tribe_posts(tribeId: str, limit: int = 50):
    """Get posts for a tribe"""
    db = get_db()
    
    tribe = await db.tribes.find_one({"id": tribeId}, {"_id": 0})
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
    
    posts = await db.posts.find({"tribeId": tribeId}, {"_id": 0}).sort("createdAt", -1).to_list(limit)
    for post in posts:
        author = await db.users.find_one({"id": post["authorId"]}, {"_id": 0, "password": 0})
        post["author"] = author
    return posts


@router.post("/{tribeId}/posts")
async def create_tribe_post(tribeId: str, post_data: dict):
    """Create a post in a tribe"""
    db = get_db()
    
    tribe = await db.tribes.find_one({"id": tribeId}, {"_id": 0})
    if not tribe:
        raise HTTPException(status_code=404, detail="Tribe not found")
    
    authorId = post_data.get("authorId")
    if authorId not in tribe.get("members", []):
        raise HTTPException(status_code=403, detail="You must be a member to post")
    
    new_post = {
        "id": str(uuid.uuid4()),
        "tribeId": tribeId,
        "authorId": authorId,
        "text": post_data.get("text", ""),
        "media": post_data.get("media"),
        "mediaUrl": post_data.get("mediaUrl"),
        "music": post_data.get("music"),
        "stats": {"likes": 0, "quotes": 0, "reposts": 0, "replies": 0, "shares": 0},
        "likedBy": [],
        "repostedBy": [],
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.insert_one(new_post)
    
    author = await db.users.find_one({"id": authorId}, {"_id": 0, "password": 0})
    new_post["author"] = author
    new_post.pop("_id", None)
    
    return new_post
