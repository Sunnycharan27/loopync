"""
Check video file sizes in the database
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_sizes():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    file_ids = [
        '072476e5-83da-48cd-9fd5-0c0f3298fa6b',
        '9c3b961a-64cf-4b4b-96ed-f41847606fce'
    ]
    
    for file_id in file_ids:
        media = await db.media_files.find_one({"id": file_id}, {"_id": 0})
        if media:
            file_data_len = len(media.get('file_data', ''))
            size_mb = file_data_len / (1024 * 1024)
            print(f"File: {file_id}")
            print(f"  Size: {size_mb:.2f} MB (base64 encoded)")
            print(f"  Content Type: {media.get('content_type')}")
            print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_sizes())
