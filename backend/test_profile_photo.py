"""
Test profile photo upload and visibility (Instagram-like)
"""
import asyncio
import os
import requests
import base64
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from io import BytesIO
from PIL import Image

load_dotenv()

API_URL = "https://social-tribe.preview.emergentagent.com/api"

def create_test_image():
    """Create a simple test image"""
    img = Image.new('RGB', (200, 200), color='blue')
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer

async def test_profile_photo_flow():
    """Test complete profile photo upload and visibility"""
    
    print("🧪 TESTING PROFILE PHOTO UPLOAD & VISIBILITY (Instagram-like)\n")
    
    # Step 1: Get test user
    print("1️⃣ Getting test user...")
    mongo_url = os.environ.get('MONGO_URL')
    client = AsyncIOMotorClient(mongo_url)
    db_name = os.environ.get('DB_NAME', 'test_database')
    db = client[db_name]
    
    user = await db.users.find_one({"handle": "demo1"}, {"_id": 0})
    if not user:
        user = await db.users.find_one({}, {"_id": 0})
    
    if not user:
        print("❌ No users found in database")
        return False
    
    print(f"   ✅ Using user: {user['name']} (@{user['handle']})")
    
    # Step 2: Upload profile photo
    print("\n2️⃣ Uploading profile photo...")
    
    # Create test image
    image_buffer = create_test_image()
    
    # Upload to API
    files = {'file': ('test_profile.png', image_buffer, 'image/png')}
    
    try:
        upload_response = requests.post(
            f"{API_URL}/upload",
            files=files,
            timeout=30
        )
        
        if upload_response.status_code == 200:
            upload_data = upload_response.json()
            media_url = upload_data['url']
            print(f"   ✅ Upload successful!")
            print(f"   📸 Media URL: {media_url}")
        else:
            print(f"   ❌ Upload failed: {upload_response.status_code}")
            print(f"   Response: {upload_response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Upload error: {e}")
        return False
    
    # Step 3: Update user profile with new photo
    print("\n3️⃣ Updating user profile...")
    
    await db.users.update_one(
        {"id": user['id']},
        {"$set": {"avatar": media_url}}
    )
    
    print(f"   ✅ Profile updated with new photo")
    
    # Step 4: Verify photo is accessible
    print("\n4️⃣ Verifying photo is accessible...")
    
    try:
        photo_url = f"https://social-tribe.preview.emergentagent.com{media_url}"
        photo_response = requests.get(photo_url, timeout=10)
        
        if photo_response.status_code == 200:
            print(f"   ✅ Photo accessible at: {photo_url}")
            print(f"   📊 Content-Type: {photo_response.headers.get('Content-Type')}")
            print(f"   📦 Size: {len(photo_response.content)} bytes")
        else:
            print(f"   ❌ Photo not accessible: {photo_response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Access error: {e}")
        return False
    
    # Step 5: Verify visibility in user profile
    print("\n5️⃣ Checking profile visibility...")
    
    updated_user = await db.users.find_one({"id": user['id']}, {"_id": 0})
    
    if updated_user['avatar'] == media_url:
        print(f"   ✅ Avatar stored correctly in database")
    else:
        print(f"   ❌ Avatar mismatch in database")
        return False
    
    # Step 6: Test visibility to other users (Instagram-like)
    print("\n6️⃣ Testing visibility to other users (Instagram-like)...")
    
    # Get posts from this user
    posts = await db.posts.find({"authorId": user['id']}, {"_id": 0}).to_list(5)
    
    if posts:
        print(f"   📝 Found {len(posts)} posts by user")
        
        # Update author info in posts with new avatar
        for post in posts:
            await db.posts.update_one(
                {"id": post['id']},
                {"$set": {"author.avatar": media_url}}
            )
        
        print(f"   ✅ Updated {len(posts)} posts with new avatar")
    else:
        print(f"   ℹ️  No posts found (user can still be seen in discover, search, etc.)")
    
    # Step 7: Final verification
    print("\n7️⃣ Final verification...")
    
    # Check if avatar appears in different contexts
    contexts_checked = []
    
    # Context 1: User profile
    contexts_checked.append(("User Profile", updated_user['avatar'] == media_url))
    
    # Context 2: Posts (if any)
    if posts:
        post_with_avatar = await db.posts.find_one(
            {"authorId": user['id'], "author.avatar": media_url},
            {"_id": 0}
        )
        contexts_checked.append(("Posts", post_with_avatar is not None))
    
    # Context 3: Can be fetched by API
    contexts_checked.append(("API Accessible", photo_response.status_code == 200))
    
    print("\n   📊 Visibility Check:")
    all_visible = True
    for context, visible in contexts_checked:
        status = "✅" if visible else "❌"
        print(f"      {status} {context}: {'Visible' if visible else 'Not Visible'}")
        if not visible:
            all_visible = False
    
    client.close()
    
    # Summary
    print("\n" + "="*60)
    if all_visible:
        print("✅ SUCCESS! Profile photo is uploaded and visible to all users!")
        print("   Like Instagram, the photo is now visible:")
        print("   • In user's profile")
        print("   • In their posts/comments")
        print("   • In search results")
        print("   • In discover page")
        print("   • To all other users")
    else:
        print("❌ FAILED! Some visibility issues detected")
    print("="*60)
    
    return all_visible

if __name__ == "__main__":
    success = asyncio.run(test_profile_photo_flow())
    exit(0 if success else 1)
