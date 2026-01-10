"""
User routes for Loopync API
Handles user profiles, settings, search, and user management
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import logging

from .deps import get_db, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["Users"])


async def are_friends(user_a: str, user_b: str) -> bool:
    """Check if two users are friends"""
    db = get_db()
    user_a_doc = await db.users.find_one({"id": user_a}, {"_id": 0, "friends": 1})
    if user_a_doc and user_b in user_a_doc.get("friends", []):
        return True
    return False


async def is_blocked(blocker: str, blocked: str) -> bool:
    """Check if blocker has blocked blocked"""
    db = get_db()
    block = await db.user_blocks.find_one({"blockerId": blocker, "blockedId": blocked}, {"_id": 0})
    return block is not None


@router.get("/search")
async def search_users(q: str, limit: int = 20):
    """Search users by name or handle"""
    if not q or len(q.strip()) < 2:
        return []
    
    db = get_db()
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"handle": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]
    }
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).limit(limit).to_list(limit)
    return users


@router.get("")
async def list_users(limit: int = 100, skip: int = 0):
    """Get list of all users for discovery"""
    db = get_db()
    users = await db.users.find({}, {"_id": 0, "password": 0}).skip(skip).limit(limit).to_list(limit)
    return users


@router.get("/handle/{handle}")
async def get_user_by_handle(handle: str):
    """Get user by their handle/username"""
    db = get_db()
    user = await db.users.find_one({"handle": handle}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{userId}")
async def get_user(userId: str):
    """Get user by ID"""
    db = get_db()
    user = await db.users.find_one({"id": userId}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{userId}/profile")
async def get_user_profile(userId: str, currentUserId: str = None):
    """Get user profile with posts, followers, and following counts"""
    db = get_db()
    user = await db.users.find_one({"id": userId}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's posts
    posts = await db.posts.find({"authorId": userId}, {"_id": 0}).sort("createdAt", -1).to_list(100)
    for post in posts:
        post["author"] = user
    
    # Count friendships
    count1 = await db.friendships.count_documents({"userId1": userId})
    count2 = await db.friendships.count_documents({"userId2": userId})
    friends_count = count1 + count2
    
    followers_count = friends_count
    following_count = friends_count
    
    # Check relationship status if currentUserId provided
    relationship_status = None
    if currentUserId and currentUserId != userId:
        is_friend = await are_friends(currentUserId, userId)
        if is_friend:
            relationship_status = "friends"
        else:
            sent_request = await db.friend_requests.find_one({
                "fromUserId": currentUserId,
                "toUserId": userId,
                "status": "pending"
            }, {"_id": 0})
            
            received_request = await db.friend_requests.find_one({
                "fromUserId": userId,
                "toUserId": currentUserId,
                "status": "pending"
            }, {"_id": 0})
            
            if sent_request:
                relationship_status = "pending_sent"
            elif received_request:
                relationship_status = "pending_received"
    
    return {
        "user": user,
        "posts": posts,
        "followersCount": followers_count,
        "followingCount": following_count,
        "postsCount": len(posts),
        "relationshipStatus": relationship_status
    }


@router.put("/{userId}")
async def update_user(userId: str, data: dict):
    """Update user profile"""
    db = get_db()
    allowed_fields = ["name", "handle", "bio", "avatar"]
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    result = await db.users.update_one(
        {"id": userId},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "Profile updated"}


@router.get("/{userId}/settings")
async def get_user_settings(userId: str):
    """Get user settings"""
    db = get_db()
    settings = await db.user_settings.find_one({"userId": userId}, {"_id": 0})
    if not settings:
        return {
            "accountPrivate": False,
            "showOnlineStatus": True,
            "allowMessagesFrom": "everyone",
            "showActivity": True,
            "allowTagging": True,
            "showStories": True,
            "emailNotifications": True,
            "pushNotifications": True,
            "likeNotifications": True,
            "commentNotifications": True,
            "followNotifications": True,
            "messageNotifications": True,
            "darkMode": False
        }
    return settings


@router.put("/{userId}/settings")
async def update_user_settings(userId: str, settings: dict):
    """Update user settings"""
    db = get_db()
    settings["userId"] = userId
    
    await db.user_settings.update_one(
        {"userId": userId},
        {"$set": settings},
        upsert=True
    )
    
    return {"success": True, "message": "Settings saved"}


@router.get("/{userId}/blocked")
async def get_blocked_users(userId: str):
    """Get list of blocked users"""
    db = get_db()
    blocks = await db.user_blocks.find({"blockerId": userId}, {"_id": 0}).limit(1000).to_list(1000)
    
    blocked_users = []
    for block in blocks:
        user = await db.users.find_one({"id": block["blockedId"]}, {"_id": 0, "password": 0})
        if user:
            blocked_users.append(user)
    
    return blocked_users


@router.delete("/{userId}/block/{blockedUserId}")
async def unblock_user(userId: str, blockedUserId: str):
    """Unblock a user"""
    db = get_db()
    result = await db.user_blocks.delete_one({
        "blockerId": userId,
        "blockedId": blockedUserId
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Block not found")
    
    return {"success": True, "message": "User unblocked"}


@router.get("/{userId}/friends")
async def get_user_friends(userId: str):
    """Get user's friends list"""
    db = get_db()
    user = await db.users.find_one({"id": userId}, {"_id": 0, "friends": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    friend_ids = user.get("friends", [])
    if not friend_ids:
        return []
    
    friends = await db.users.find(
        {"id": {"$in": friend_ids}},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    return friends


@router.get("/{userId}/friend-requests")
async def get_friend_requests(userId: str):
    """Get pending friend requests for a user"""
    db = get_db()
    
    # Get received requests
    received = await db.friend_requests.find(
        {"toUserId": userId, "status": "pending"},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with user data
    for request in received:
        from_user = await db.users.find_one({"id": request["fromUserId"]}, {"_id": 0, "password": 0})
        request["fromUser"] = from_user
    
    return received


@router.get("/{userId}/friend-status/{targetUserId}")
async def get_friend_status(userId: str, targetUserId: str):
    """Check friendship status between two users"""
    db = get_db()
    
    is_friend = await are_friends(userId, targetUserId)
    if is_friend:
        return {"status": "friends"}
    
    sent = await db.friend_requests.find_one({
        "fromUserId": userId,
        "toUserId": targetUserId,
        "status": "pending"
    }, {"_id": 0})
    
    if sent:
        return {"status": "pending_sent"}
    
    received = await db.friend_requests.find_one({
        "fromUserId": targetUserId,
        "toUserId": userId,
        "status": "pending"
    }, {"_id": 0})
    
    if received:
        return {"status": "pending_received"}
    
    return {"status": "none"}


@router.get("/{userId}/followers")
async def get_followers(userId: str):
    """Get user's followers"""
    db = get_db()
    user = await db.users.find_one({"id": userId}, {"_id": 0, "followers": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    follower_ids = user.get("followers", [])
    if not follower_ids:
        return []
    
    followers = await db.users.find(
        {"id": {"$in": follower_ids}},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    return followers


@router.get("/{userId}/following")
async def get_following(userId: str):
    """Get users that this user is following"""
    db = get_db()
    user = await db.users.find_one({"id": userId}, {"_id": 0, "following": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    following_ids = user.get("following", [])
    if not following_ids:
        return []
    
    following = await db.users.find(
        {"id": {"$in": following_ids}},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    return following


@router.post("/{userId}/follow")
async def follow_user(userId: str, targetUserId: str):
    """Follow/unfollow a user"""
    db = get_db()
    
    if userId == targetUserId:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    user = await db.users.find_one({"id": userId}, {"_id": 0})
    target = await db.users.find_one({"id": targetUserId}, {"_id": 0})
    
    if not user or not target:
        raise HTTPException(status_code=404, detail="User not found")
    
    following = user.get("following", [])
    
    if targetUserId in following:
        # Unfollow
        await db.users.update_one(
            {"id": userId},
            {"$pull": {"following": targetUserId}}
        )
        await db.users.update_one(
            {"id": targetUserId},
            {"$pull": {"followers": userId}}
        )
        return {"action": "unfollowed", "following": len(following) - 1}
    else:
        # Follow
        await db.users.update_one(
            {"id": userId},
            {"$addToSet": {"following": targetUserId}}
        )
        await db.users.update_one(
            {"id": targetUserId},
            {"$addToSet": {"followers": userId}}
        )
        return {"action": "followed", "following": len(following) + 1}


@router.get("/{userId}/saved-posts")
async def get_saved_posts(userId: str):
    """Get user's saved/bookmarked posts"""
    db = get_db()
    bookmarks = await db.bookmarks.find({"userId": userId}, {"_id": 0}).to_list(100)
    
    post_ids = [b["postId"] for b in bookmarks]
    if not post_ids:
        return []
    
    posts = await db.posts.find({"id": {"$in": post_ids}}, {"_id": 0}).to_list(100)
    
    # Enrich with author data
    for post in posts:
        author = await db.users.find_one({"id": post["authorId"]}, {"_id": 0, "password": 0})
        post["author"] = author
    
    return posts
