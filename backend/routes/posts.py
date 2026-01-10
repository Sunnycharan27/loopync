"""
Posts routes for Loopync API
Handles post creation, likes, comments, reposts, and feed operations
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import logging

from .deps import get_db, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/posts", tags=["Posts"])


class PostCreate(BaseModel):
    text: str
    media: Optional[str] = None
    music: Optional[dict] = None
    audience: str = "public"
    hashtags: List[str] = []


class CommentCreate(BaseModel):
    text: str


@router.get("")
async def get_posts(limit: int = 50, skip: int = 0):
    """Get posts for the feed"""
    db = get_db()
    
    posts = await db.posts.find({}, {"_id": 0}).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with author data
    for post in posts:
        author = await db.users.find_one({"id": post.get("authorId")}, {"_id": 0, "password": 0})
        post["author"] = author
        post["likeCount"] = len(post.get("likedBy", []))
    
    return posts


@router.post("")
async def create_post(authorId: str, post: PostCreate):
    """Create a new post"""
    import uuid
    
    db = get_db()
    
    new_post = {
        "id": str(uuid.uuid4()),
        "authorId": authorId,
        "text": post.text,
        "media": post.media,
        "music": post.music,
        "audience": post.audience,
        "hashtags": post.hashtags,
        "stats": {"likes": 0, "quotes": 0, "reposts": 0, "replies": 0, "shares": 0},
        "likedBy": [],
        "repostedBy": [],
        "sharedBy": [],
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.insert_one(new_post)
    
    # Enrich with author data
    author = await db.users.find_one({"id": authorId}, {"_id": 0, "password": 0})
    new_post["author"] = author
    new_post["likeCount"] = 0
    
    # Remove _id if present
    new_post.pop("_id", None)
    
    return new_post


@router.post("/{postId}/like")
async def like_post(postId: str, userId: str):
    """Like or unlike a post"""
    db = get_db()
    
    post = await db.posts.find_one({"id": postId}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    liked_by = post.get("likedBy", [])
    
    if userId in liked_by:
        # Unlike
        await db.posts.update_one(
            {"id": postId},
            {
                "$pull": {"likedBy": userId},
                "$inc": {"stats.likes": -1}
            }
        )
        return {"action": "unliked", "likes": len(liked_by) - 1}
    else:
        # Like
        await db.posts.update_one(
            {"id": postId},
            {
                "$addToSet": {"likedBy": userId},
                "$inc": {"stats.likes": 1}
            }
        )
        return {"action": "liked", "likes": len(liked_by) + 1}


@router.post("/{postId}/repost")
async def repost(postId: str, userId: str):
    """Repost or unrepost"""
    db = get_db()
    
    post = await db.posts.find_one({"id": postId}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    reposted_by = post.get("repostedBy", [])
    
    if userId in reposted_by:
        await db.posts.update_one(
            {"id": postId},
            {
                "$pull": {"repostedBy": userId},
                "$inc": {"stats.reposts": -1}
            }
        )
        return {"action": "unreposted", "reposts": len(reposted_by) - 1}
    else:
        await db.posts.update_one(
            {"id": postId},
            {
                "$addToSet": {"repostedBy": userId},
                "$inc": {"stats.reposts": 1}
            }
        )
        return {"action": "reposted", "reposts": len(reposted_by) + 1}


@router.get("/{postId}/comments")
async def get_comments(postId: str):
    """Get comments for a post"""
    db = get_db()
    
    comments = await db.comments.find({"postId": postId}, {"_id": 0}).sort("createdAt", -1).to_list(100)
    
    # Enrich with author data
    for comment in comments:
        author = await db.users.find_one({"id": comment.get("authorId")}, {"_id": 0, "password": 0})
        comment["author"] = author
    
    return comments


@router.delete("/{postId}")
async def delete_post(postId: str, current_user: dict = Depends(get_current_user)):
    """Delete a post (owner only)"""
    db = get_db()
    
    post = await db.posts.find_one({"id": postId}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.get("authorId") != current_user.get("id"):
        raise HTTPException(status_code=403, detail="You can only delete your own posts")
    
    await db.posts.delete_one({"id": postId})
    await db.comments.delete_many({"postId": postId})
    
    return {"success": True, "message": "Post deleted"}


@router.post("/{postId}/comments")
async def add_comment(postId: str, authorId: str, comment: CommentCreate):
    """Add a comment to a post"""
    import uuid
    
    db = get_db()
    
    post = await db.posts.find_one({"id": postId}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_comment = {
        "id": str(uuid.uuid4()),
        "postId": postId,
        "authorId": authorId,
        "text": comment.text,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.comments.insert_one(new_comment)
    
    # Update post stats
    await db.posts.update_one(
        {"id": postId},
        {"$inc": {"stats.replies": 1}}
    )
    
    # Enrich with author data
    author = await db.users.find_one({"id": authorId}, {"_id": 0, "password": 0})
    new_comment["author"] = author
    new_comment.pop("_id", None)
    
    return new_comment


@router.post("/{postId}/save")
async def save_post(postId: str, userId: str):
    """Save or unsave a post"""
    db = get_db()
    
    existing = await db.bookmarks.find_one({"userId": userId, "postId": postId}, {"_id": 0})
    
    if existing:
        await db.bookmarks.delete_one({"userId": userId, "postId": postId})
        return {"action": "unsaved"}
    else:
        await db.bookmarks.insert_one({
            "userId": userId,
            "postId": postId,
            "createdAt": datetime.now(timezone.utc).isoformat()
        })
        return {"action": "saved"}


@router.post("/{postId}/bookmark")
async def bookmark_post(postId: str, userId: str):
    """Bookmark a post (alias for save)"""
    return await save_post(postId, userId)


@router.get("/{postId}/replies")
async def get_replies(postId: str):
    """Get replies to a post"""
    db = get_db()
    
    replies = await db.posts.find({"replyToPostId": postId}, {"_id": 0}).sort("createdAt", -1).to_list(100)
    
    for reply in replies:
        author = await db.users.find_one({"id": reply.get("authorId")}, {"_id": 0, "password": 0})
        reply["author"] = author
    
    return replies


@router.post("/{postId}/reply")
async def reply_to_post(postId: str, authorId: str, post: PostCreate):
    """Reply to a post"""
    import uuid
    
    db = get_db()
    
    parent = await db.posts.find_one({"id": postId}, {"_id": 0})
    if not parent:
        raise HTTPException(status_code=404, detail="Post not found")
    
    new_reply = {
        "id": str(uuid.uuid4()),
        "authorId": authorId,
        "text": post.text,
        "media": post.media,
        "music": post.music,
        "audience": post.audience,
        "hashtags": post.hashtags,
        "replyToPostId": postId,
        "stats": {"likes": 0, "quotes": 0, "reposts": 0, "replies": 0, "shares": 0},
        "likedBy": [],
        "repostedBy": [],
        "sharedBy": [],
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.insert_one(new_reply)
    
    # Update parent stats
    await db.posts.update_one(
        {"id": postId},
        {"$inc": {"stats.replies": 1}}
    )
    
    author = await db.users.find_one({"id": authorId}, {"_id": 0, "password": 0})
    new_reply["author"] = author
    new_reply.pop("_id", None)
    
    return new_reply


@router.post("/{postId}/quote")
async def quote_post(postId: str, authorId: str, post: PostCreate):
    """Quote a post"""
    import uuid
    
    db = get_db()
    
    quoted = await db.posts.find_one({"id": postId}, {"_id": 0})
    if not quoted:
        raise HTTPException(status_code=404, detail="Post not found")
    
    quoted_author = await db.users.find_one({"id": quoted.get("authorId")}, {"_id": 0, "password": 0})
    quoted["author"] = quoted_author
    
    new_quote = {
        "id": str(uuid.uuid4()),
        "authorId": authorId,
        "text": post.text,
        "media": post.media,
        "music": post.music,
        "audience": post.audience,
        "hashtags": post.hashtags,
        "quotedPostId": postId,
        "quotedPost": quoted,
        "stats": {"likes": 0, "quotes": 0, "reposts": 0, "replies": 0, "shares": 0},
        "likedBy": [],
        "repostedBy": [],
        "sharedBy": [],
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.insert_one(new_quote)
    
    # Update quoted post stats
    await db.posts.update_one(
        {"id": postId},
        {"$inc": {"stats.quotes": 1}}
    )
    
    author = await db.users.find_one({"id": authorId}, {"_id": 0, "password": 0})
    new_quote["author"] = author
    new_quote.pop("_id", None)
    
    return new_quote
