"""
Seed messaging data for testing - create DM threads and messages
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
from uuid import uuid4

load_dotenv()

async def seed_messages():
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    print("🔍 Fetching users...")
    users = await db.users.find({}, {"_id": 0}).to_list(None)
    
    if len(users) < 2:
        print("❌ Need at least 2 users. Please run seed_data.py first.")
        client.close()
        return
    
    print(f"✅ Found {len(users)} users")
    
    # Clear existing threads and messages
    await db.dm_threads.delete_many({})
    await db.dm_messages.delete_many({})
    print("🗑️  Cleared existing threads and messages")
    
    # Create threads between first user and others
    main_user = users[0]  # Demo User
    other_users = users[1:4] if len(users) > 4 else users[1:]  # Up to 3 other users
    
    print(f"\n📱 Creating DM threads for {main_user['name']}...")
    
    threads_created = 0
    messages_created = 0
    
    for other_user in other_users:
        thread_id = str(uuid4())
        
        # Create some messages
        sample_messages = [
            {
                "sender": other_user,
                "text": f"Hey! Let's catch up soon 😊",
                "time_offset": 60  # 1 hour ago
            },
            {
                "sender": main_user,
                "text": "Sounds great! When are you free?",
                "time_offset": 45
            },
            {
                "sender": other_user,
                "text": "How about tomorrow evening?",
                "time_offset": 30
            },
            {
                "sender": main_user,
                "text": "Perfect! Let's meet at 6 PM",
                "time_offset": 15
            },
            {
                "sender": other_user,
                "text": "See you then! 👍",
                "time_offset": 5
            }
        ]
        
        # Create messages in database
        thread_messages = []
        for i, msg_data in enumerate(sample_messages):
            message_id = str(uuid4())
            created_at = datetime.now(timezone.utc) - timedelta(minutes=msg_data["time_offset"])
            
            message = {
                "id": message_id,
                "threadId": thread_id,
                "senderId": msg_data["sender"]["id"],
                "text": msg_data["text"],
                "createdAt": created_at.isoformat(),
                "readBy": [msg_data["sender"]["id"]],  # Sender has read it
                "reactions": []
            }
            
            await db.dm_messages.insert_one(message)
            thread_messages.append(message)
            messages_created += 1
        
        # Create thread
        last_message = thread_messages[-1]
        thread = {
            "id": thread_id,
            "participants": [main_user["id"], other_user["id"]],
            "participantDetails": [
                {
                    "id": main_user["id"],
                    "name": main_user["name"],
                    "handle": main_user["handle"],
                    "avatar": main_user.get("avatar", f"https://api.dicebear.com/7.x/avataaars/svg?seed={main_user['handle']}")
                },
                {
                    "id": other_user["id"],
                    "name": other_user["name"],
                    "handle": other_user["handle"],
                    "avatar": other_user.get("avatar", f"https://api.dicebear.com/7.x/avataaars/svg?seed={other_user['handle']}")
                }
            ],
            "lastMessage": {
                "id": last_message["id"],
                "text": last_message["text"],
                "senderId": last_message["senderId"],
                "createdAt": last_message["createdAt"]
            },
            "lastMessageAt": last_message["createdAt"],
            "createdAt": thread_messages[0]["createdAt"],
            "unreadCount": {
                main_user["id"]: 0,  # Main user has read all
                other_user["id"]: 0
            }
        }
        
        await db.dm_threads.insert_one(thread)
        threads_created += 1
        
        print(f"  ✅ Thread with {other_user['name']}: {len(thread_messages)} messages")
    
    client.close()
    
    print(f"\n✅ Seeding complete!")
    print(f"   Created {threads_created} threads")
    print(f"   Created {messages_created} messages")
    print(f"\n📱 Test with user: {main_user['handle']} (ID: {main_user['id']})")

if __name__ == "__main__":
    asyncio.run(seed_messages())
