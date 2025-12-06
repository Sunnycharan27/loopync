"""
Script to clean up broken reels and keep only working ones
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def cleanup_reels():
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        print("❌ MONGO_URL not found in environment")
        return
    
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    print(f"📦 Using database: {db_name}")
    
    print("🔍 Fetching all reels...")
    all_reels = await db.reels.find({}, {"_id": 0}).to_list(None)
    print(f"Found {len(all_reels)} reels")
    
    # Identify broken reels (old domains, vimeo URLs that won't load)
    broken_domains = [
        'messenger-revamp.preview.emergentagent.com',
        'media-fix-8.preview.emergentagent.com',
        'player.vimeo.com'
    ]
    
    broken_ids = []
    working_ids = []
    
    for reel in all_reels:
        video_url = reel.get('videoUrl', '')
        is_broken = any(domain in video_url for domain in broken_domains)
        
        if is_broken:
            broken_ids.append(reel.get('id'))
            print(f"🗑️  Broken: {reel.get('id')[:8]}... - {video_url[:60]}...")
        else:
            working_ids.append(reel.get('id'))
            print(f"✅ Working: {reel.get('id')[:8]}... - {video_url[:60]}...")
    
    print(f"\n📊 Summary:")
    print(f"  Total reels: {len(all_reels)}")
    print(f"  Broken reels: {len(broken_ids)}")
    print(f"  Working reels: {len(working_ids)}")
    
    if broken_ids:
        print(f"\n🗑️  Deleting {len(broken_ids)} broken reels...")
        result = await db.reels.delete_many({"id": {"$in": broken_ids}})
        print(f"✅ Deleted {result.deleted_count} reels")
    else:
        print("\n✅ No broken reels to delete")
    
    client.close()
    print("\n✅ Cleanup complete!")

if __name__ == "__main__":
    asyncio.run(cleanup_reels())
