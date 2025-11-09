#!/usr/bin/env python3
"""
COMPREHENSIVE BACKEND API TESTING - Production Readiness Verification

🎯 **TESTING SCOPE**: Complete backend API testing as per review request

**PRIORITY TESTS**:
1. Profile Picture Upload (CRITICAL - reported as broken)
2. Authentication (login with demo credentials)
3. Posts (get all posts, verify media URLs)
4. Media Serving (test serving existing media files)
5. WebSocket/Calling (test call initiation)
6. Reels (get reels, verify video URLs)
7. Vibe Capsules (get capsules, verify media URLs)

**API BASE URL**: https://media-fix-8.preview.emergentagent.com
**TEST CREDENTIALS**: demo@loopync.com / password123
"""

import requests
import json
import sys
import io
import time
from datetime import datetime
from PIL import Image

# Configuration
BASE_URL = "https://media-fix-8.preview.emergentagent.com/api"
TEST_EMAIL = "demo@loopync.com"
TEST_PASSWORD = "password123"

class ComprehensiveBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.friends = []
        self.uploaded_media_id = None
        
    def log(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def login(self):
        """Test Priority 2: Authentication - Login with demo credentials"""
        self.log("🔐 TEST 2: Authentication - Logging in with demo credentials...")
        
        response = self.session.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("token")
            user_data = data.get("user", {})
            self.user_id = user_data.get("id")
            
            self.log(f"✅ Login successful!")
            self.log(f"   User ID: {self.user_id}")
            self.log(f"   User Name: {user_data.get('name')}")
            self.log(f"   User Email: {user_data.get('email')}")
            self.log(f"   JWT Token: {self.token[:50]}...")
            
            # Set authorization header for future requests
            self.session.headers.update({
                "Authorization": f"Bearer {self.token}"
            })
            return True
        else:
            self.log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
            return False
    
    def test_protected_endpoints(self):
        """Test JWT token validation on protected endpoints"""
        self.log("🔒 Testing JWT token validation...")
        
        # Test with valid token
        response = self.session.get(f"{BASE_URL}/auth/me")
        if response.status_code == 200:
            user_data = response.json()
            self.log(f"✅ Protected endpoint accessible with valid token")
            self.log(f"   User: {user_data.get('name')} ({user_data.get('email')})")
        else:
            self.log(f"❌ Protected endpoint failed with valid token: {response.status_code}", "ERROR")
            return False
        
        # Test with invalid token
        old_auth = self.session.headers.get("Authorization")
        self.session.headers["Authorization"] = "Bearer invalid_token"
        
        response = self.session.get(f"{BASE_URL}/auth/me")
        if response.status_code == 401:
            self.log("✅ Invalid token properly rejected with 401")
        else:
            self.log(f"❌ Invalid token not rejected properly: {response.status_code}", "ERROR")
            return False
        
        # Restore valid token
        self.session.headers["Authorization"] = old_auth
        return True
    
    def test_profile_picture_upload(self):
        """Test Priority 1: Profile Picture Upload (CRITICAL - reported as broken)"""
        self.log("\n📸 TEST 1: Profile Picture Upload (CRITICAL)")
        
        # Create a test image
        self.log("   Creating test image...")
        img = Image.new('RGB', (100, 100), color='red')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Test file upload
        self.log("   Uploading test image to /api/upload...")
        files = {'file': ('test_avatar.png', img_buffer, 'image/png')}
        
        # Remove Content-Type header for file upload
        headers = dict(self.session.headers)
        if 'Content-Type' in headers:
            del headers['Content-Type']
        
        response = self.session.post(f"{BASE_URL}/upload", files=files, headers=headers)
        
        self.log(f"   Upload response status: {response.status_code}")
        
        if response.status_code == 200:
            upload_data = response.json()
            media_url = upload_data.get('url')
            media_id = upload_data.get('id')
            
            self.log(f"✅ File upload successful!")
            self.log(f"   Media URL: {media_url}")
            self.log(f"   Media ID: {media_id}")
            
            # Verify URL format is relative
            if media_url and media_url.startswith('/api/media/'):
                self.log("✅ Media URL uses correct relative format (/api/media/{id})")
            else:
                self.log(f"❌ Media URL format incorrect: {media_url}", "ERROR")
                return False
            
            self.uploaded_media_id = media_id
            
            # Test updating user profile with uploaded avatar
            self.log("   Updating user profile with uploaded avatar...")
            
            # Restore Content-Type for JSON requests
            self.session.headers.update({"Content-Type": "application/json"})
            
            response = self.session.put(f"{BASE_URL}/users/{self.user_id}/profile", json={
                "avatar": media_url
            })
            
            if response.status_code == 200:
                self.log("✅ Profile avatar updated successfully")
                
                # Verify avatar appears in user data
                response = self.session.get(f"{BASE_URL}/users")
                if response.status_code == 200:
                    users = response.json()
                    demo_user = next((u for u in users if u.get('id') == self.user_id), None)
                    
                    if demo_user and demo_user.get('avatar') == media_url:
                        self.log("✅ Avatar appears correctly in user response")
                        return True
                    else:
                        self.log(f"❌ Avatar not found in user response: {demo_user.get('avatar') if demo_user else 'User not found'}", "ERROR")
                        return False
                else:
                    self.log(f"❌ Failed to verify avatar in user list: {response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to update profile avatar: {response.status_code} - {response.text}", "ERROR")
                return False
        else:
            self.log(f"❌ File upload failed: {response.status_code} - {response.text}", "ERROR")
            return False
    
    def test_posts_api(self):
        """Test Priority 3: Posts - Get all posts and verify media URLs"""
        self.log("\n📝 TEST 3: Posts API")
        
        # Get all posts
        self.log("   Getting all posts...")
        response = self.session.get(f"{BASE_URL}/posts")
        
        if response.status_code == 200:
            posts = response.json()
            self.log(f"✅ Retrieved {len(posts)} posts")
            
            # Verify posts structure and media URLs
            posts_with_media = 0
            relative_urls = 0
            
            for i, post in enumerate(posts[:5]):  # Check first 5 posts
                self.log(f"   Post {i+1}: ID {post.get('id')}")
                
                # Check if post has author data
                author = post.get('author')
                if author:
                    self.log(f"     Author: {author.get('name')} ({author.get('handle')})")
                else:
                    self.log(f"     ❌ Missing author data", "ERROR")
                
                # Check media URL if present
                media_url = post.get('media')
                if media_url:
                    posts_with_media += 1
                    self.log(f"     Media URL: {media_url}")
                    
                    if media_url.startswith('/api/media/'):
                        relative_urls += 1
                        self.log(f"     ✅ Media URL uses relative format")
                    else:
                        self.log(f"     ❌ Media URL not relative: {media_url}", "ERROR")
            
            self.log(f"   Posts with media: {posts_with_media}")
            self.log(f"   Relative URLs: {relative_urls}/{posts_with_media}")
            
            # Test creating a new post with media
            if self.uploaded_media_id:
                self.log("   Creating new post with uploaded media...")
                
                new_post_data = {
                    "text": f"Test post with media - {datetime.now().strftime('%H:%M:%S')}",
                    "media": f"/api/media/{self.uploaded_media_id}",
                    "hashtags": ["test", "backend"]
                }
                
                response = self.session.post(f"{BASE_URL}/posts", 
                                           json=new_post_data,
                                           params={"authorId": self.user_id})
                
                if response.status_code == 200:
                    new_post = response.json()
                    self.log(f"✅ New post created: {new_post.get('id')}")
                    self.log(f"   Media URL: {new_post.get('media')}")
                    return True
                else:
                    self.log(f"❌ Failed to create post: {response.status_code} - {response.text}", "ERROR")
                    return False
            else:
                self.log("   Skipping post creation (no uploaded media)")
                return True
        else:
            self.log(f"❌ Failed to get posts: {response.status_code} - {response.text}", "ERROR")
            return False
    
    def test_media_serving(self):
        """Test Priority 4: Media Serving - Test serving existing media files"""
        self.log("\n🖼️ TEST 4: Media Serving")
        
        if not self.uploaded_media_id:
            self.log("❌ No uploaded media to test serving", "ERROR")
            return False
        
        # Test serving the uploaded media file
        media_url = f"/api/media/{self.uploaded_media_id}"
        self.log(f"   Testing media serving: {media_url}")
        
        # Remove authorization header for media serving (should be public)
        headers = dict(self.session.headers)
        if 'Authorization' in headers:
            del headers['Authorization']
        
        response = self.session.get(f"{BASE_URL}/media/{self.uploaded_media_id}", headers=headers)
        
        self.log(f"   Response status: {response.status_code}")
        
        if response.status_code == 200:
            # Check content-type header
            content_type = response.headers.get('content-type', '')
            self.log(f"   Content-Type: {content_type}")
            
            if content_type.startswith('image/'):
                self.log("✅ Correct content-type header for image")
            else:
                self.log(f"❌ Incorrect content-type: {content_type}", "ERROR")
                return False
            
            # Check if file data is returned
            content_length = len(response.content)
            self.log(f"   Content length: {content_length} bytes")
            
            if content_length > 0:
                self.log("✅ File data returned successfully")
                
                # Restore authorization header
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                return True
            else:
                self.log("❌ No file data returned", "ERROR")
                return False
        else:
            self.log(f"❌ Media serving failed: {response.status_code} - {response.text}", "ERROR")
            return False
    
    def test_webrtc_calling(self):
        """Test Priority 5: WebSocket/Calling - Test call initiation"""
        self.log("\n📞 TEST 5: WebSocket/Calling")
        
        # Get friends list first
        self.log("   Getting friends list for calling test...")
        response = self.session.get(f"{BASE_URL}/users/{self.user_id}/friends")
        
        if response.status_code == 200:
            friends = response.json()
            self.log(f"   Found {len(friends)} friends")
            
            if not friends:
                self.log("❌ No friends available for calling test", "ERROR")
                return False
            
            friend = friends[0]
            friend_id = friend.get('id')
            friend_name = friend.get('name')
            
            self.log(f"   Testing call initiation to {friend_name} (ID: {friend_id})")
            
            # Test call initiation
            call_data = {
                "callerId": self.user_id,
                "recipientId": friend_id,
                "callType": "audio"
            }
            
            response = self.session.post(f"{BASE_URL}/calls/initiate", json=call_data)
            
            if response.status_code == 200:
                call_response = response.json()
                self.log("✅ Call initiation successful!")
                
                # Verify WebRTC response format
                required_fields = ["callId", "channelName", "appId"]
                for field in required_fields:
                    if field in call_response:
                        self.log(f"   ✅ {field}: {str(call_response[field])[:50]}")
                    else:
                        self.log(f"   ❌ Missing field: {field}", "ERROR")
                        return False
                
                return True
            else:
                self.log(f"❌ Call initiation failed: {response.status_code} - {response.text}", "ERROR")
                return False
        else:
            self.log(f"❌ Failed to get friends: {response.status_code} - {response.text}", "ERROR")
            return False
    
    def test_call_management(self):
        """Test Priority 2: Call Management"""
        self.log("\n📱 TEST 5: Call Management (Answer/End)")
        
        if not self.friends:
            self.log("❌ No friends available for testing", "ERROR")
            return False
        
        # First, initiate a call
        friend = self.friends[0]
        response = self.session.post(f"{BASE_URL}/calls/initiate", json={
            "callerId": self.user_id,
            "recipientId": friend.get('id'),
            "callType": "audio"
        })
        
        if response.status_code != 200:
            self.log(f"❌ Failed to initiate call: {response.text}", "ERROR")
            return False
        
        call_data = response.json()
        call_id = call_data.get('callId')
        
        # Test answering the call (using recipient's perspective)
        recipient_id = friend.get('id')
        self.log(f"   Testing answer call (ID: {call_id}) as recipient ({recipient_id})")
        response = self.session.post(f"{BASE_URL}/calls/{call_id}/answer", params={"userId": recipient_id})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'ongoing':
                self.log("   ✅ Call answered successfully, status changed to 'ongoing'")
            else:
                self.log(f"   ❌ Call status not updated correctly: {data.get('status')}", "ERROR")
                return False
        else:
            self.log(f"   ❌ Failed to answer call: {response.text}", "ERROR")
            return False
        
        # Test ending the call (caller can end it)
        self.log(f"   Testing end call (ID: {call_id}) as caller ({self.user_id})")
        response = self.session.post(f"{BASE_URL}/calls/{call_id}/end", params={"userId": self.user_id})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('message') == 'Call ended':
                self.log(f"   ✅ Call ended successfully, duration: {data.get('duration')} seconds")
            else:
                self.log(f"   ❌ Call end response invalid: {data}", "ERROR")
                return False
        else:
            self.log(f"   ❌ Failed to end call: {response.text}", "ERROR")
            return False
        
        self.log("✅ Call management working correctly")
        return True
    
    def test_call_history(self):
        """Test Priority 3: Call History"""
        self.log("\n📋 TEST 6: Call History")
        
        response = self.session.get(f"{BASE_URL}/calls/history/{self.user_id}")
        
        if response.status_code == 200:
            calls = response.json()
            self.log(f"   ✅ Retrieved {len(calls)} calls from history")
            
            if calls:
                # Verify call structure
                call = calls[0]
                required_fields = ["id", "callerId", "recipientId", "callType", "status", "startedAt"]
                
                for field in required_fields:
                    if field in call:
                        self.log(f"   ✅ {field}: {call[field]}")
                    else:
                        self.log(f"   ❌ Missing field: {field}", "ERROR")
                        return False
                
                # Check if caller and recipient data is enriched
                if 'caller' in call and 'recipient' in call:
                    self.log("   ✅ Call history includes enriched user data")
                else:
                    self.log("   ❌ Call history missing user data enrichment", "ERROR")
                    return False
            
            self.log("✅ Call history working correctly")
            return True
        else:
            self.log(f"❌ Failed to get call history: {response.text}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all call functionality tests"""
        self.log("🚀 Starting CRITICAL CALL FUNCTIONALITY TESTING")
        self.log("=" * 80)
        
        # Login first
        if not self.login():
            return False
        
        # Get friends list
        if not self.get_friends():
            return False
        
        # Run all tests
        tests = [
            ("Audio Call Initiation", self.test_audio_call_initiation),
            ("Video Call Initiation", self.test_video_call_initiation),
            ("Error Scenarios", self.test_error_scenarios),
            ("Agora Token Generation", self.test_agora_token_generation),
            ("Call Management", self.test_call_management),
            ("Call History", self.test_call_history)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                    self.log(f"✅ {test_name}: PASSED")
                else:
                    self.log(f"❌ {test_name}: FAILED", "ERROR")
            except Exception as e:
                self.log(f"❌ {test_name}: EXCEPTION - {str(e)}", "ERROR")
        
        # Summary
        self.log("\n" + "=" * 80)
        self.log(f"🎯 CALL FUNCTIONALITY TEST RESULTS")
        self.log(f"   Tests Passed: {passed}/{total}")
        self.log(f"   Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED - CALL FUNCTIONALITY IS WORKING!")
            return True
        else:
            self.log("⚠️  SOME TESTS FAILED - CALL FUNCTIONALITY NEEDS FIXES")
            return False

if __name__ == "__main__":
    tester = CallTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)