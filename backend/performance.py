"""
Performance Optimization Module for Loopync
Handles caching, query optimization, and high-throughput operations
Designed for 30k+ users and 100k+ requests/minute
"""

import asyncio
import time
import hashlib
import json
from typing import Optional, List, Dict, Any, Callable
from functools import wraps
from datetime import datetime, timezone, timedelta
from collections import OrderedDict
import logging

logger = logging.getLogger(__name__)

# ========== IN-MEMORY LRU CACHE ==========
class LRUCache:
    """Thread-safe LRU Cache with TTL support"""
    
    def __init__(self, max_size: int = 10000, default_ttl: int = 300):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: OrderedDict = OrderedDict()
        self.expiry: Dict[str, float] = {}
        self._lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            if key not in self.cache:
                return None
            
            # Check expiry
            if key in self.expiry and time.time() > self.expiry[key]:
                del self.cache[key]
                del self.expiry[key]
                return None
            
            # Move to end (most recently used)
            self.cache.move_to_end(key)
            return self.cache[key]
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        async with self._lock:
            ttl = ttl or self.default_ttl
            
            # Remove oldest if at capacity
            while len(self.cache) >= self.max_size:
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]
                self.expiry.pop(oldest_key, None)
            
            self.cache[key] = value
            self.expiry[key] = time.time() + ttl
    
    async def delete(self, key: str) -> None:
        async with self._lock:
            self.cache.pop(key, None)
            self.expiry.pop(key, None)
    
    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern (simple prefix match)"""
        async with self._lock:
            keys_to_delete = [k for k in self.cache if k.startswith(pattern)]
            for key in keys_to_delete:
                del self.cache[key]
                self.expiry.pop(key, None)
            return len(keys_to_delete)
    
    async def clear(self) -> None:
        async with self._lock:
            self.cache.clear()
            self.expiry.clear()
    
    def stats(self) -> Dict[str, int]:
        return {
            "size": len(self.cache),
            "max_size": self.max_size
        }


# Global cache instances
posts_cache = LRUCache(max_size=5000, default_ttl=60)  # Posts cached for 1 minute
users_cache = LRUCache(max_size=10000, default_ttl=300)  # Users cached for 5 minutes
trending_cache = LRUCache(max_size=100, default_ttl=120)  # Trending cached for 2 minutes
feed_cache = LRUCache(max_size=2000, default_ttl=30)  # Feed cached for 30 seconds


# ========== CACHE DECORATORS ==========
def cache_key(*args, **kwargs) -> str:
    """Generate cache key from function arguments"""
    key_data = f"{args}:{sorted(kwargs.items())}"
    return hashlib.md5(key_data.encode()).hexdigest()


def cached(cache: LRUCache, prefix: str, ttl: Optional[int] = None):
    """Decorator for caching async function results"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = f"{prefix}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached_value = await cache.get(key)
            if cached_value is not None:
                return cached_value
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache.set(key, result, ttl)
            return result
        return wrapper
    return decorator


# ========== BATCH QUERY UTILITIES ==========
async def batch_get_users(db, user_ids: List[str], fields: Dict = None) -> Dict[str, Dict]:
    """
    Batch fetch users by IDs - eliminates N+1 queries
    Returns dict mapping user_id -> user_data
    """
    if not user_ids:
        return {}
    
    # Deduplicate
    unique_ids = list(set(user_ids))
    
    # Check cache first
    cached_users = {}
    uncached_ids = []
    
    for uid in unique_ids:
        cached = await users_cache.get(f"user:{uid}")
        if cached:
            cached_users[uid] = cached
        else:
            uncached_ids.append(uid)
    
    # Fetch uncached from DB
    if uncached_ids:
        projection = {"_id": 0}
        if fields:
            projection.update(fields)
        
        cursor = db.users.find({"id": {"$in": uncached_ids}}, projection)
        async for user in cursor:
            user_id = user.get("id")
            # Remove sensitive fields
            user.pop("password", None)
            user.pop("resetPasswordToken", None)
            cached_users[user_id] = user
            # Cache for future use
            await users_cache.set(f"user:{user_id}", user, ttl=300)
    
    return cached_users


async def batch_enrich_posts(db, posts: List[Dict]) -> List[Dict]:
    """
    Efficiently enrich posts with author data using batch queries
    Eliminates N+1 query pattern
    """
    if not posts:
        return posts
    
    # Collect all author IDs
    author_ids = list(set(p.get("authorId") for p in posts if p.get("authorId")))
    
    # Batch fetch all authors
    authors_map = await batch_get_users(db, author_ids, {
        "id": 1, "name": 1, "handle": 1, "avatar": 1, "isVerified": 1
    })
    
    # Enrich posts
    for post in posts:
        author_id = post.get("authorId")
        if author_id and author_id in authors_map:
            post["author"] = authors_map[author_id]
    
    return posts


async def batch_enrich_comments(db, comments: List[Dict]) -> List[Dict]:
    """Efficiently enrich comments with author data"""
    if not comments:
        return comments
    
    author_ids = list(set(c.get("authorId") for c in comments if c.get("authorId")))
    authors_map = await batch_get_users(db, author_ids, {
        "id": 1, "name": 1, "handle": 1, "avatar": 1, "isVerified": 1
    })
    
    for comment in comments:
        author_id = comment.get("authorId")
        if author_id and author_id in authors_map:
            comment["author"] = authors_map[author_id]
    
    return comments


# ========== OPTIMIZED QUERIES ==========
async def get_feed_optimized(db, user_id: str, skip: int = 0, limit: int = 20) -> List[Dict]:
    """
    Optimized feed query with caching and batch enrichment
    """
    cache_key = f"feed:{user_id}:{skip}:{limit}"
    
    # Check cache
    cached_feed = await feed_cache.get(cache_key)
    if cached_feed:
        return cached_feed
    
    # Get user's following list
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "following": 1})
    following = user.get("following", []) if user else []
    
    # Include own posts and following's posts
    author_filter = [user_id] + following
    
    # Single optimized query with sort, skip, limit
    posts = await db.posts.find(
        {"authorId": {"$in": author_filter}},
        {"_id": 0}
    ).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    
    # Batch enrich with authors
    posts = await batch_enrich_posts(db, posts)
    
    # Cache result
    await feed_cache.set(cache_key, posts, ttl=30)
    
    return posts


async def get_trending_posts_optimized(db, limit: int = 20) -> List[Dict]:
    """
    Optimized trending posts with caching
    """
    cache_key = f"trending:{limit}"
    
    cached = await trending_cache.get(cache_key)
    if cached:
        return cached
    
    # Get trending posts (most liked in last 24 hours)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    
    posts = await db.posts.find(
        {"createdAt": {"$gte": cutoff}},
        {"_id": 0}
    ).sort("likeCount", -1).limit(limit).to_list(limit)
    
    posts = await batch_enrich_posts(db, posts)
    
    await trending_cache.set(cache_key, posts, ttl=120)
    
    return posts


# ========== CACHE INVALIDATION ==========
async def invalidate_user_cache(user_id: str) -> None:
    """Invalidate all caches related to a user"""
    await users_cache.delete(f"user:{user_id}")
    await feed_cache.delete_pattern(f"feed:{user_id}")


async def invalidate_post_cache(post_id: str = None, author_id: str = None) -> None:
    """Invalidate post-related caches"""
    if post_id:
        await posts_cache.delete(f"post:{post_id}")
    if author_id:
        await feed_cache.delete_pattern(f"feed:{author_id}")
    # Clear trending as it might be affected
    await trending_cache.clear()


# ========== RESPONSE COMPRESSION ==========
def compress_response(data: Any) -> bytes:
    """Compress response data using orjson for speed"""
    try:
        import orjson
        return orjson.dumps(data)
    except ImportError:
        return json.dumps(data).encode()


# ========== CONNECTION POOLING STATS ==========
class PerformanceMonitor:
    """Monitor performance metrics"""
    
    def __init__(self):
        self.request_count = 0
        self.cache_hits = 0
        self.cache_misses = 0
        self.start_time = time.time()
    
    def record_request(self):
        self.request_count += 1
    
    def record_cache_hit(self):
        self.cache_hits += 1
    
    def record_cache_miss(self):
        self.cache_misses += 1
    
    def get_stats(self) -> Dict:
        uptime = time.time() - self.start_time
        rps = self.request_count / uptime if uptime > 0 else 0
        hit_rate = self.cache_hits / (self.cache_hits + self.cache_misses) if (self.cache_hits + self.cache_misses) > 0 else 0
        
        return {
            "uptime_seconds": round(uptime, 2),
            "total_requests": self.request_count,
            "requests_per_second": round(rps, 2),
            "cache_hit_rate": f"{hit_rate * 100:.1f}%",
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "posts_cache": posts_cache.stats(),
            "users_cache": users_cache.stats(),
            "feed_cache": feed_cache.stats()
        }


# Global monitor instance
perf_monitor = PerformanceMonitor()


# ========== DATABASE INDEX RECOMMENDATIONS ==========
RECOMMENDED_INDEXES = [
    {"collection": "posts", "index": [("authorId", 1), ("createdAt", -1)]},
    {"collection": "posts", "index": [("createdAt", -1)]},
    {"collection": "posts", "index": [("likeCount", -1)]},
    {"collection": "posts", "index": [("hashtags", 1)]},
    {"collection": "users", "index": [("id", 1)], "unique": True},
    {"collection": "users", "index": [("email", 1)], "unique": True},
    {"collection": "users", "index": [("handle", 1)]},
    {"collection": "threads", "index": [("participants", 1)]},
    {"collection": "messages", "index": [("threadId", 1), ("createdAt", -1)]},
    {"collection": "notifications", "index": [("userId", 1), ("createdAt", -1)]},
    {"collection": "tribes", "index": [("id", 1)]},
    {"collection": "capsules", "index": [("authorId", 1), ("expiresAt", -1)]},
]


async def ensure_indexes(db) -> None:
    """Create recommended indexes for optimal performance"""
    for idx_config in RECOMMENDED_INDEXES:
        collection = idx_config["collection"]
        index = idx_config["index"]
        unique = idx_config.get("unique", False)
        
        try:
            await db[collection].create_index(index, unique=unique, background=True)
            logger.info(f"Created index on {collection}: {index}")
        except Exception as e:
            logger.warning(f"Index creation warning for {collection}: {e}")


# ========== RATE LIMITING ==========
class RateLimiter:
    """Simple in-memory rate limiter"""
    
    def __init__(self, requests_per_minute: int = 100000):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, List[float]] = {}
        self._lock = asyncio.Lock()
    
    async def is_allowed(self, client_id: str) -> bool:
        """Check if request is allowed"""
        async with self._lock:
            now = time.time()
            minute_ago = now - 60
            
            # Clean old requests
            if client_id in self.requests:
                self.requests[client_id] = [t for t in self.requests[client_id] if t > minute_ago]
            else:
                self.requests[client_id] = []
            
            # Check limit
            if len(self.requests[client_id]) >= self.requests_per_minute:
                return False
            
            self.requests[client_id].append(now)
            return True


# Global rate limiter - 100k+ requests per minute
rate_limiter = RateLimiter(requests_per_minute=100000)
