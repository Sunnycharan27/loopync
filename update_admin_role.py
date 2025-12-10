#!/usr/bin/env python3
"""
Script to update user role to admin in MongoDB
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def update_admin_role(user_id):
    """Update user role to admin"""
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Update user role to admin
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": "admin"}}
    )
    
    if result.modified_count > 0:
        print(f"✅ Successfully updated user {user_id} role to admin")
    else:
        print(f"❌ Failed to update user {user_id} role")
        
    # Verify the update
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "role": 1, "name": 1})
    if user:
        print(f"📋 User role is now: {user.get('role')} for {user.get('name')}")
    
    client.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python update_admin_role.py <user_id>")
        sys.exit(1)
        
    user_id = sys.argv[1]
    asyncio.run(update_admin_role(user_id))