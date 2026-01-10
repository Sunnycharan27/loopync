"""
Friends routes for Loopync API
Handles friend requests, accepting/rejecting requests, and removing friends
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone
import uuid
import logging

from .deps import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/friends", tags=["Friends"])


class FriendRequestCreate(BaseModel):
    fromUserId: str
    toUserId: str


def get_canonical_friend_order(user_a: str, user_b: str) -> tuple:
    """Return users in canonical order (lexicographic)"""
    return (user_a, user_b) if user_a < user_b else (user_b, user_a)


@router.post("/request")
async def send_friend_request(req: FriendRequestCreate):
    """Send a friend request"""
    db = get_db()
    
    if req.fromUserId == req.toUserId:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
    
    # Check if already friends
    from_user = await db.users.find_one({"id": req.fromUserId}, {"_id": 0, "friends": 1})
    if from_user and req.toUserId in from_user.get("friends", []):
        raise HTTPException(status_code=400, detail="Already friends")
    
    # Check for existing request
    existing = await db.friend_requests.find_one({
        "fromUserId": req.fromUserId,
        "toUserId": req.toUserId,
        "status": "pending"
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already sent")
    
    # Check for reverse request (they already sent us one)
    reverse = await db.friend_requests.find_one({
        "fromUserId": req.toUserId,
        "toUserId": req.fromUserId,
        "status": "pending"
    }, {"_id": 0})
    
    if reverse:
        # Auto-accept - they sent us a request too
        user1, user2 = get_canonical_friend_order(req.fromUserId, req.toUserId)
        
        await db.friendships.insert_one({
            "userId1": user1,
            "userId2": user2,
            "createdAt": datetime.now(timezone.utc).isoformat()
        })
        
        # Update both users' friends lists
        await db.users.update_one(
            {"id": req.fromUserId},
            {"$addToSet": {"friends": req.toUserId}}
        )
        await db.users.update_one(
            {"id": req.toUserId},
            {"$addToSet": {"friends": req.fromUserId}}
        )
        
        # Update the existing request status
        await db.friend_requests.update_one(
            {"id": reverse["id"]},
            {"$set": {"status": "accepted"}}
        )
        
        return {"status": "friends", "message": "You are now friends!"}
    
    # Create new friend request
    new_request = {
        "id": str(uuid.uuid4()),
        "fromUserId": req.fromUserId,
        "toUserId": req.toUserId,
        "status": "pending",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.friend_requests.insert_one(new_request)
    
    # Update users' pending lists
    await db.users.update_one(
        {"id": req.fromUserId},
        {"$addToSet": {"friendRequestsSent": req.toUserId}}
    )
    await db.users.update_one(
        {"id": req.toUserId},
        {"$addToSet": {"friendRequestsReceived": req.fromUserId}}
    )
    
    return {"status": "pending", "message": "Friend request sent"}


@router.post("/accept")
async def accept_friend_request(req: FriendRequestCreate):
    """Accept a friend request"""
    db = get_db()
    
    # Find the pending request
    request = await db.friend_requests.find_one({
        "fromUserId": req.fromUserId,
        "toUserId": req.toUserId,
        "status": "pending"
    }, {"_id": 0})
    
    if not request:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Create friendship
    user1, user2 = get_canonical_friend_order(req.fromUserId, req.toUserId)
    
    await db.friendships.insert_one({
        "userId1": user1,
        "userId2": user2,
        "createdAt": datetime.now(timezone.utc).isoformat()
    })
    
    # Update both users' friends lists
    await db.users.update_one(
        {"id": req.fromUserId},
        {
            "$addToSet": {"friends": req.toUserId},
            "$pull": {"friendRequestsSent": req.toUserId}
        }
    )
    await db.users.update_one(
        {"id": req.toUserId},
        {
            "$addToSet": {"friends": req.fromUserId},
            "$pull": {"friendRequestsReceived": req.fromUserId}
        }
    )
    
    # Update request status
    await db.friend_requests.update_one(
        {"id": request["id"]},
        {"$set": {"status": "accepted"}}
    )
    
    return {"status": "friends", "message": "Friend request accepted"}


@router.post("/reject")
async def reject_friend_request(req: FriendRequestCreate):
    """Reject a friend request"""
    db = get_db()
    
    result = await db.friend_requests.delete_one({
        "fromUserId": req.fromUserId,
        "toUserId": req.toUserId,
        "status": "pending"
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Update users' pending lists
    await db.users.update_one(
        {"id": req.fromUserId},
        {"$pull": {"friendRequestsSent": req.toUserId}}
    )
    await db.users.update_one(
        {"id": req.toUserId},
        {"$pull": {"friendRequestsReceived": req.fromUserId}}
    )
    
    return {"status": "rejected", "message": "Friend request rejected"}


@router.delete("/remove")
async def remove_friend(user1Id: str, user2Id: str):
    """Remove a friend"""
    db = get_db()
    
    # Delete friendship
    canonical_user1, canonical_user2 = get_canonical_friend_order(user1Id, user2Id)
    
    await db.friendships.delete_one({
        "userId1": canonical_user1,
        "userId2": canonical_user2
    })
    
    # Update both users' friends lists regardless of whether friendship document existed
    await db.users.update_one(
        {"id": user1Id},
        {"$pull": {"friends": user2Id}}
    )
    await db.users.update_one(
        {"id": user2Id},
        {"$pull": {"friends": user1Id}}
    )
    
    return {"status": "removed", "message": "Friend removed"}
