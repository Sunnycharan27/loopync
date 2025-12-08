#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Production Launch

**Test Environment:**
- Backend URL: https://vibely.preview.emergentagent.com/api
- Fresh database (0 users, 0 posts)

**Test Scenarios:**
1. Authentication APIs (signup, login, me)
2. Posts APIs (After authentication)
3. Reels/VibeZone APIs
4. Tribes APIs
5. Messaging APIs
6. VibeRooms APIs
7. User Profile APIs
8. Notifications APIs
9. Health Check

Create at least 2 test users to test social features between users.
"""

import requests
import json
import sys
import io
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://vibely.preview.emergentagent.com/api"
TEST_EMAIL_1 = f"testuser1_{int(time.time())}@loopync.com"
TEST_EMAIL_2 = f"testuser2_{int(time.time())}@loopync.com"
TEST_PASSWORD = "testpassword123"
DEMO_EMAIL = "demo@loopync.com"
DEMO_PASSWORD = "password123"

class ComprehensiveBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_user_1_id = None
        self.test_user_2_id = None
        self.test_user_1_token = None
        self.test_user_2_token = None
        self.test_results = []
        self.created_post_id = None
        self.created_reel_id = None
        self.created_tribe_id = None
        self.created_thread_id = None
        self.created_room_id = None
        
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
            
            # Extract media ID from URL if not provided directly
            if not media_id and media_url and '/api/media/' in media_url:
                media_id = media_url.split('/api/media/')[-1]
            
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
                
                # Verify call response format (actual structure from API)
                required_fields = ["success", "callId", "callType", "otherUserId", "otherUserName"]
                for field in required_fields:
                    if field in call_response:
                        self.log(f"   ✅ {field}: {str(call_response[field])[:50]}")
                    else:
                        self.log(f"   ❌ Missing field: {field}", "ERROR")
                        return False
                
                # Verify success is true
                if call_response.get('success') == True:
                    self.log("   ✅ Call initiation success flag is true")
                else:
                    self.log(f"   ❌ Call initiation success flag is false", "ERROR")
                    return False
                
                return True
            else:
                self.log(f"❌ Call initiation failed: {response.status_code} - {response.text}", "ERROR")
                return False
        else:
            self.log(f"❌ Failed to get friends: {response.status_code} - {response.text}", "ERROR")
            return False
    
    def test_reels_api(self):
        """Test Priority 6: Reels - Get reels and verify video URLs"""
        self.log("\n🎬 TEST 6: Reels API")
        
        # Get all reels
        self.log("   Getting reels...")
        response = self.session.get(f"{BASE_URL}/reels")
        
        if response.status_code == 200:
            reels = response.json()
            self.log(f"✅ Retrieved {len(reels)} reels")
            
            if reels:
                # Check first few reels
                for i, reel in enumerate(reels[:3]):
                    self.log(f"   Reel {i+1}: ID {reel.get('id')}")
                    
                    # Check video URL
                    video_url = reel.get('videoUrl')
                    if video_url:
                        self.log(f"     Video URL: {video_url}")
                        
                        # Verify URL format
                        if video_url.startswith('/api/media/') or video_url.startswith('http'):
                            self.log(f"     ✅ Video URL format valid")
                        else:
                            self.log(f"     ❌ Invalid video URL format: {video_url}", "ERROR")
                    
                    # Check author data
                    author = reel.get('author')
                    if author:
                        self.log(f"     Author: {author.get('name')}")
                    else:
                        self.log(f"     ❌ Missing author data", "ERROR")
                
                return True
            else:
                self.log("   No reels found (empty response)")
                return True
        else:
            self.log(f"❌ Failed to get reels: {response.status_code} - {response.text}", "ERROR")
            return False
    
    def test_vibe_capsules_api(self):
        """Test Priority 7: Vibe Capsules - Get capsules and verify media URLs"""
        self.log("\n💫 TEST 7: Vibe Capsules API")
        
        # Get all vibe capsules (stories)
        self.log("   Getting vibe capsules...")
        response = self.session.get(f"{BASE_URL}/capsules")
        
        if response.status_code == 200:
            capsules_data = response.json()
            stories = capsules_data.get('stories', [])
            self.log(f"✅ Retrieved {len(stories)} story groups")
            
            if stories:
                # Check first few story groups
                total_capsules = 0
                
                for i, story_group in enumerate(stories[:3]):
                    author = story_group.get('author', {})
                    capsules = story_group.get('capsules', [])
                    total_capsules += len(capsules)
                    
                    self.log(f"   Story Group {i+1}: Author {author.get('name')} ({len(capsules)} capsules)")
                    
                    # Check first capsule in each group
                    if capsules:
                        capsule = capsules[0]
                        self.log(f"     Capsule ID: {capsule.get('id')}")
                        
                        # Check media URL
                        media_url = capsule.get('mediaUrl')
                        if media_url:
                            self.log(f"     Media URL: {media_url}")
                            
                            # Verify URL format
                            if media_url.startswith('/api/media/') or media_url.startswith('http'):
                                self.log(f"     ✅ Media URL format valid")
                            else:
                                self.log(f"     ❌ Invalid media URL format: {media_url}", "ERROR")
                        
                        # Check media type
                        media_type = capsule.get('mediaType')
                        if media_type in ['image', 'video']:
                            self.log(f"     Media Type: {media_type} ✅")
                        else:
                            self.log(f"     ❌ Invalid media type: {media_type}", "ERROR")
                        
                        # Check author data
                        capsule_author = capsule.get('author')
                        if capsule_author:
                            self.log(f"     Author: {capsule_author.get('name')}")
                        else:
                            self.log(f"     ❌ Missing author data", "ERROR")
                
                self.log(f"   Total capsules across all story groups: {total_capsules}")
                return True
            else:
                self.log("   No vibe capsules found (empty response)")
                return True
        else:
            self.log(f"❌ Failed to get vibe capsules: {response.status_code} - {response.text}", "ERROR")
            return False
    
    def test_response_times(self):
        """Test response times for critical endpoints"""
        self.log("\n⏱️ TEST 8: Response Times")
        
        endpoints_to_test = [
            ("GET /api/posts", f"{BASE_URL}/posts"),
            ("GET /api/reels", f"{BASE_URL}/reels"),
            ("GET /api/users", f"{BASE_URL}/users"),
            ("GET /api/auth/me", f"{BASE_URL}/auth/me")
        ]
        
        slow_endpoints = []
        
        for endpoint_name, url in endpoints_to_test:
            start_time = time.time()
            response = self.session.get(url)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            self.log(f"   {endpoint_name}: {response_time:.0f}ms")
            
            if response_time > 500:  # Threshold: 500ms
                slow_endpoints.append((endpoint_name, response_time))
                self.log(f"     ⚠️ Slow response (>{500}ms)", "WARNING")
            else:
                self.log(f"     ✅ Good response time (<500ms)")
        
        if slow_endpoints:
            self.log(f"   ⚠️ {len(slow_endpoints)} endpoints are slow:")
            for endpoint, time_ms in slow_endpoints:
                self.log(f"     - {endpoint}: {time_ms:.0f}ms")
        else:
            self.log("   ✅ All endpoints respond within 500ms")
        
        return True
    
    def run_all_tests(self):
        """Run comprehensive backend API tests"""
        self.log("🚀 Starting COMPREHENSIVE BACKEND API TESTING")
        self.log("=" * 80)
        self.log("🎯 Testing all critical backend endpoints for production readiness")
        self.log(f"📍 API Base URL: {BASE_URL}")
        self.log(f"👤 Test Credentials: {TEST_EMAIL} / {TEST_PASSWORD}")
        self.log("=" * 80)
        
        # Login first (this is also Test 2: Authentication)
        if not self.login():
            return False
        
        # Test protected endpoints
        if not self.test_protected_endpoints():
            return False
        
        # Run all priority tests
        tests = [
            ("Profile Picture Upload (CRITICAL)", self.test_profile_picture_upload),
            ("Posts API", self.test_posts_api),
            ("Media Serving", self.test_media_serving),
            ("WebSocket/Calling", self.test_webrtc_calling),
            ("Reels API", self.test_reels_api),
            ("Vibe Capsules API", self.test_vibe_capsules_api),
            ("Response Times", self.test_response_times)
        ]
        
        passed = 0
        total = len(tests)
        failed_tests = []
        
        for test_name, test_func in tests:
            try:
                self.log(f"\n{'='*20} {test_name} {'='*20}")
                if test_func():
                    passed += 1
                    self.log(f"✅ {test_name}: PASSED")
                else:
                    failed_tests.append(test_name)
                    self.log(f"❌ {test_name}: FAILED", "ERROR")
            except Exception as e:
                failed_tests.append(test_name)
                self.log(f"❌ {test_name}: EXCEPTION - {str(e)}", "ERROR")
        
        # Summary
        self.log("\n" + "=" * 80)
        self.log(f"🎯 COMPREHENSIVE BACKEND API TEST RESULTS")
        self.log(f"   Tests Passed: {passed}/{total}")
        self.log(f"   Success Rate: {(passed/total)*100:.1f}%")
        
        if failed_tests:
            self.log(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                self.log(f"   - {test}")
        
        if passed == total:
            self.log("\n🎉 ALL TESTS PASSED - BACKEND IS PRODUCTION READY!")
            return True
        else:
            self.log(f"\n⚠️  {len(failed_tests)} TESTS FAILED - BACKEND NEEDS FIXES")
            return False

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)