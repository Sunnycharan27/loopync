"""
Add demo reels with working external video URLs
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime, timezone
from uuid import uuid4

load_dotenv()

async def add_demo_reels():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    # First, get a real user from the database
    user = await db.users.find_one({}, {"_id": 0})
    if not user:
        print("❌ No users found in database")
        return
    
    print(f"✅ Using user: {user.get('name')} ({user.get('id')})")
    
    # Sample working video URLs (using Big Buck Bunny demo videos)
    demo_videos = [
        {
            "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "caption": "🎬 Demo Reel 1 - Testing VibeZone! #vibezone #demo",
        },
        {
            "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            "caption": "✨ Demo Reel 2 - Amazing content! #video #social",
        },
        {
            "url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
            "caption": "🚀 Demo Reel 3 - Let's go viral! #trending #reels",
        },
    ]
    
    print("\n🎬 Adding demo reels...")
    for i, video in enumerate(demo_videos):
        reel = {
            "id": str(uuid4()),
            "authorId": user.get("id"),
            "videoUrl": video["url"],
            "thumb": video["url"],  # Using video URL as thumb
            "caption": video["caption"],
            "stats": {
                "views": 0,
                "likes": 0,
                "comments": 0
            },
            "likedBy": [],
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "author": {
                "id": user.get("id"),
                "handle": user.get("handle"),
                "name": user.get("name"),
                "avatar": user.get("avatar", f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.get('handle')}")
            }
        }
        
        await db.reels.insert_one(reel)
        print(f"  ✅ Added: {video['caption'][:40]}...")
    
    client.close()
    print("\n✅ Demo reels added successfully!")

if __name__ == "__main__":
    asyncio.run(add_demo_reels())
