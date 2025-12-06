"""
Script to check if media files exist for the reels
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_media():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    print("🔍 Fetching remaining reels...")
    reels = await db.reels.find({}, {"_id": 0}).to_list(None)
    print(f"Found {len(reels)} reels\n")
    
    for reel in reels:
        video_url = reel.get('videoUrl', '')
        reel_id = reel.get('id', '')
        
        # Extract file_id from /api/media/{file_id}
        if '/api/media/' in video_url:
            file_id = video_url.split('/api/media/')[-1]
            print(f"Reel: {reel_id[:12]}...")
            print(f"  Video URL: {video_url}")
            print(f"  File ID: {file_id}")
            
            # Check if media file exists
            media_file = await db.media_files.find_one({"id": file_id}, {"_id": 0})
            if media_file:
                print(f"  ✅ Media file exists")
                print(f"     Storage: {media_file.get('storage_type', 'mongodb')}")
                print(f"     Content Type: {media_file.get('content_type', 'unknown')}")
                print(f"     Filename: {media_file.get('filename', 'unknown')}")
            else:
                print(f"  ❌ Media file NOT FOUND in database")
            print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_media())
