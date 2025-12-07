"""
Clear all data from MongoDB to make app fresh
Keeps database structure and indexes intact
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'loopync')

async def clear_all_data():
    """Clear all collections while preserving structure"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🗑️  Starting data cleanup...")
    
    # List of collections to clear
    collections_to_clear = [
        'posts',
        'reels', 
        'users',
        'tribes',
        'messages',
        'conversations',
        'products',
        'videos',
        'orders',
        'venues',
        'events',
        'tickets',
        'rooms',
        'notifications',
        'activities',
        'capsules',
        'comments',
        'bookmarks',
        'wallet_transactions',
        'delivery_requests'
    ]
    
    cleared_count = {}
    
    for collection_name in collections_to_clear:
        try:
            # Get count before deletion
            count = await db[collection_name].count_documents({})
            
            if count > 0:
                # Delete all documents
                result = await db[collection_name].delete_many({})
                cleared_count[collection_name] = result.deleted_count
                print(f"  ✅ Cleared {collection_name}: {result.deleted_count} documents")
            else:
                print(f"  ⚪ {collection_name}: Already empty")
                
        except Exception as e:
            print(f"  ⚠️  Error clearing {collection_name}: {str(e)}")
    
    # Summary
    print("\n📊 Cleanup Summary:")
    total_deleted = sum(cleared_count.values())
    print(f"  Total documents deleted: {total_deleted}")
    print(f"  Collections cleared: {len(cleared_count)}")
    
    # Verify database is empty
    print("\n🔍 Verification:")
    all_collections = await db.list_collection_names()
    for coll in all_collections:
        if coll not in ['system.indexes']:
            count = await db[coll].count_documents({})
            if count > 0:
                print(f"  ⚠️  {coll} still has {count} documents")
            else:
                print(f"  ✅ {coll}: Empty")
    
    client.close()
    print("\n✨ Database is now clean and ready for fresh data!")

if __name__ == "__main__":
    asyncio.run(clear_all_data())
