#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Production Launch

**Test Environment:**
- Backend URL: https://social-prelaunch.preview.emergentagent.com/api
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
BASE_URL = "https://social-prelaunch.preview.emergentagent.com/api"
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
    
    def log_result(self, test_name, success, details="", error=""):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    Details: {details}")
        if error:
            print(f"    Error: {error}")
        print()
    
    def make_request(self, method, endpoint, data=None, headers=None, files=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        # Add auth header if token available
        if self.token and headers is None:
            headers = {"Authorization": f"Bearer {self.token}"}
        elif self.token and headers:
            headers["Authorization"] = f"Bearer {self.token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params, timeout=10)
            elif method.upper() == "POST":
                if files:
                    response = self.session.post(url, data=data, files=files, headers=headers, params=params, timeout=10)
                else:
                    response = self.session.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, params=params, timeout=10)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, params=params, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            return None
    
    def test_health_check(self):
        """Test health check endpoint - use posts endpoint as health check"""
        response = self.make_request("GET", "/posts")
        
        if response and response.status_code == 200:
            self.log_result("Backend Health Check", True, "Backend is responding")
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Backend Health Check", False, error=error_msg)
            return False
    
    def test_create_test_users(self):
        """Create two test users for social features testing"""
        # Create Test User 1
        user1_data = {
            "email": TEST_EMAIL_1,
            "password": TEST_PASSWORD,
            "name": "Test User One",
            "handle": f"testuser1_{int(time.time())}"
        }
        
        response = self.make_request("POST", "/auth/signup", user1_data)
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.test_user_1_token = result["token"]
                self.test_user_1_id = result["user"]["id"]
                self.log_result("Create Test User 1", True, f"User ID: {self.test_user_1_id}")
            else:
                self.log_result("Create Test User 1", False, error="Invalid signup response")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Test User 1", False, error=error_msg)
            return False
        
        # Create Test User 2
        user2_data = {
            "email": TEST_EMAIL_2,
            "password": TEST_PASSWORD,
            "name": "Test User Two",
            "handle": f"testuser2_{int(time.time())}"
        }
        
        response = self.make_request("POST", "/auth/signup", user2_data)
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.test_user_2_token = result["token"]
                self.test_user_2_id = result["user"]["id"]
                self.log_result("Create Test User 2", True, f"User ID: {self.test_user_2_id}")
                
                # Set token for main user (user 1)
                self.token = self.test_user_1_token
                self.user_id = self.test_user_1_id
                return True
            else:
                self.log_result("Create Test User 2", False, error="Invalid signup response")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Test User 2", False, error=error_msg)
            return False
    
    def test_demo_user_login(self):
        """Test demo user login (fallback if demo user exists)"""
        response = self.make_request("POST", "/auth/login", {
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD
        })
        
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.token = result["token"]
                self.user_id = result["user"]["id"]
                self.log_result("Demo User Login", True, f"User ID: {self.user_id}")
                return True
        
        # Demo user doesn't exist or login failed, that's okay
        self.log_result("Demo User Login", False, error="Demo user not available (expected in fresh database)")
        return False
    
    def test_login_with_created_user(self):
        """Test login with newly created user"""
        if not self.test_user_1_id:
            return False
            
        response = self.make_request("POST", "/auth/login", {
            "email": TEST_EMAIL_1,
            "password": TEST_PASSWORD
        })
        
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                token = result["token"]
                user_id = result["user"]["id"]
                if user_id == self.test_user_1_id:
                    self.log_result("Login with Created User", True, f"User ID: {user_id}")
                    return True
        
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        self.log_result("Login with Created User", False, error=error_msg)
        return False
    
    def test_get_current_user(self):
        """Test GET /auth/me endpoint"""
        response = self.make_request("GET", "/auth/me")
        
        if response and response.status_code == 200:
            user_data = response.json()
            if "id" in user_data and user_data["id"] == self.user_id:
                self.log_result("Get Current User", True, f"Retrieved user: {user_data.get('name', 'Unknown')}")
                return True
        
        error_msg = f"Status: {response.status_code if response else 'No response'}"
        self.log_result("Get Current User", False, error=error_msg)
        return False
    
    def test_jwt_token_validation(self):
        """Test JWT token validation"""
        # Test with valid token
        response = self.make_request("GET", "/auth/me")
        if response and response.status_code == 200:
            self.log_result("JWT Token Valid", True, "Valid token accepted")
        else:
            self.log_result("JWT Token Valid", False, error="Valid token rejected")
            return False
        
        # Test with invalid token
        old_token = self.token
        self.token = "invalid_token"
        response = self.make_request("GET", "/auth/me")
        
        if response and response.status_code == 401:
            self.log_result("JWT Token Invalid Rejection", True, "Invalid token properly rejected")
        else:
            self.log_result("JWT Token Invalid Rejection", False, error="Invalid token not rejected")
        
        # Restore valid token
        self.token = old_token
        return True
    
    def test_posts_crud(self):
        """Test Posts CRUD operations"""
        # Create a text post
        post_data = {
            "text": "This is a test post for backend testing 🚀",
            "audience": "public",
            "hashtags": ["test", "backend"]
        }
        
        response = self.make_request("POST", "/posts", post_data, params={"authorId": self.user_id})
        
        if not response or response.status_code != 200:
            error_msg = f"Create post failed - Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Text Post", False, error=error_msg)
            return False
        
        post_result = response.json()
        self.created_post_id = post_result.get("id")
        
        if not self.created_post_id:
            self.log_result("Create Text Post", False, error="No post ID returned")
            return False
        
        self.log_result("Create Text Post", True, f"Post ID: {self.created_post_id}")
        
        # Get all posts
        response = self.make_request("GET", "/posts")
        if response and response.status_code == 200:
            posts = response.json()
            if isinstance(posts, list) and len(posts) > 0:
                self.log_result("Get All Posts", True, f"Retrieved {len(posts)} posts")
            else:
                self.log_result("Get All Posts", False, error="No posts returned")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get All Posts", False, error=error_msg)
        
        # Like the post
        response = self.make_request("POST", f"/posts/{self.created_post_id}/like", params={"userId": self.user_id})
        if response and response.status_code == 200:
            self.log_result("Like Post", True, "Post liked successfully")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Like Post", False, error=error_msg)
        
        # Unlike the post
        response = self.make_request("POST", f"/posts/{self.created_post_id}/unlike", params={"userId": self.user_id})
        if response and response.status_code == 200:
            self.log_result("Unlike Post", True, "Post unliked successfully")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Unlike Post", False, error=error_msg)
        
        # Add comment to post
        comment_data = {"text": "This is a test comment"}
        response = self.make_request("POST", f"/posts/{self.created_post_id}/comment", comment_data, params={"authorId": self.user_id})
        if response and response.status_code == 200:
            self.log_result("Add Comment to Post", True, "Comment added successfully")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Add Comment to Post", False, error=error_msg)
        
        # Delete the post
        response = self.make_request("DELETE", f"/posts/{self.created_post_id}", params={"userId": self.user_id})
        if response and response.status_code == 200:
            self.log_result("Delete Post", True, "Post deleted successfully")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Delete Post", False, error=error_msg)
        
        return True
    
    def test_reels_api(self):
        """Test Reels/VibeZone APIs"""
        # Create a reel
        reel_data = {
            "videoUrl": "https://example.com/test-video.mp4",
            "thumb": "https://example.com/test-thumb.jpg",
            "caption": "Test reel for backend testing"
        }
        
        response = self.make_request("POST", "/reels", reel_data, params={"authorId": self.user_id})
        
        if not response or response.status_code != 200:
            error_msg = f"Create reel failed - Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Reel", False, error=error_msg)
            return False
        
        reel_result = response.json()
        self.created_reel_id = reel_result.get("id")
        
        if not self.created_reel_id:
            self.log_result("Create Reel", False, error="No reel ID returned")
            return False
        
        self.log_result("Create Reel", True, f"Reel ID: {self.created_reel_id}")
        
        # Get all reels
        response = self.make_request("GET", "/reels")
        if response and response.status_code == 200:
            reels = response.json()
            if isinstance(reels, list):
                self.log_result("Get All Reels", True, f"Retrieved {len(reels)} reels")
            else:
                self.log_result("Get All Reels", False, error="Invalid reels response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get All Reels", False, error=error_msg)
        
        # Like the reel
        response = self.make_request("POST", f"/reels/{self.created_reel_id}/like", params={"userId": self.user_id})
        if response and response.status_code == 200:
            self.log_result("Like Reel", True, "Reel liked successfully")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Like Reel", False, error=error_msg)
        
        # Track view
        response = self.make_request("POST", f"/reels/{self.created_reel_id}/view", params={"userId": self.user_id})
        if response and response.status_code == 200:
            self.log_result("Track Reel View", True, "Reel view tracked successfully")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Track Reel View", False, error=error_msg)
        
        return True
    
    def test_tribes_api(self):
        """Test Tribes APIs"""
        # Create a tribe
        tribe_data = {
            "name": "Test Tribe Backend",
            "description": "A test tribe for backend testing",
            "type": "public",
            "tags": ["testing", "backend"]
        }
        
        response = self.make_request("POST", "/tribes", tribe_data, params={"ownerId": self.user_id})
        
        if not response or response.status_code != 200:
            error_msg = f"Create tribe failed - Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Tribe", False, error=error_msg)
            return False
        
        tribe_result = response.json()
        self.created_tribe_id = tribe_result.get("id")
        
        if not self.created_tribe_id:
            self.log_result("Create Tribe", False, error="No tribe ID returned")
            return False
        
        self.log_result("Create Tribe", True, f"Tribe ID: {self.created_tribe_id}")
        
        # Get all tribes
        response = self.make_request("GET", "/tribes")
        if response and response.status_code == 200:
            tribes = response.json()
            if isinstance(tribes, list):
                self.log_result("Get All Tribes", True, f"Retrieved {len(tribes)} tribes")
            else:
                self.log_result("Get All Tribes", False, error="Invalid tribes response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get All Tribes", False, error=error_msg)
        
        # Join the tribe (with test user 2)
        if self.test_user_2_id:
            response = self.make_request("POST", f"/tribes/{self.created_tribe_id}/join", params={"userId": self.test_user_2_id})
            if response and response.status_code == 200:
                self.log_result("Join Tribe", True, "User joined tribe successfully")
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                self.log_result("Join Tribe", False, error=error_msg)
        
        # Create post in tribe
        tribe_post_data = {
            "text": "This is a test post in the tribe",
            "audience": "tribe"
        }
        
        response = self.make_request("POST", f"/tribes/{self.created_tribe_id}/posts", tribe_post_data, params={"authorId": self.user_id})
        if response and response.status_code == 200:
            self.log_result("Create Tribe Post", True, "Tribe post created successfully")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Create Tribe Post", False, error=error_msg)
        
        # Get tribe details
        response = self.make_request("GET", f"/tribes/{self.created_tribe_id}")
        if response and response.status_code == 200:
            tribe_details = response.json()
            if "id" in tribe_details:
                self.log_result("Get Tribe Details", True, f"Tribe: {tribe_details.get('name', 'Unknown')}")
            else:
                self.log_result("Get Tribe Details", False, error="Invalid tribe details")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get Tribe Details", False, error=error_msg)
        
        return True
    
    def test_messaging_api(self):
        """Test Messaging APIs"""
        if not self.test_user_2_id:
            self.log_result("Messaging Test", False, error="Test user 2 not available")
            return False
        
        # Create DM thread
        thread_data = {
            "participantId": self.test_user_2_id
        }
        
        response = self.make_request("POST", "/dm-threads", thread_data, params={"userId": self.user_id})
        
        if not response or response.status_code != 200:
            error_msg = f"Create DM thread failed - Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create DM Thread", False, error=error_msg)
            return False
        
        thread_result = response.json()
        self.created_thread_id = thread_result.get("id")
        
        if not self.created_thread_id:
            self.log_result("Create DM Thread", False, error="No thread ID returned")
            return False
        
        self.log_result("Create DM Thread", True, f"Thread ID: {self.created_thread_id}")
        
        # Get all DM threads
        response = self.make_request("GET", "/dm-threads", params={"userId": self.user_id})
        if response and response.status_code == 200:
            threads = response.json()
            if isinstance(threads, list):
                self.log_result("Get DM Threads", True, f"Retrieved {len(threads)} threads")
            else:
                self.log_result("Get DM Threads", False, error="Invalid threads response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get DM Threads", False, error=error_msg)
        
        # Send a message
        message_data = {
            "text": "Hello! This is a test message from backend testing."
        }
        
        response = self.make_request("POST", "/dm-messages", message_data, params={"threadId": self.created_thread_id, "senderId": self.user_id})
        if response and response.status_code == 200:
            message_result = response.json()
            message_id = message_result.get("id")
            self.log_result("Send DM Message", True, f"Message ID: {message_id}")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Send DM Message", False, error=error_msg)
        
        # Get messages in thread
        response = self.make_request("GET", f"/dm-messages/{self.created_thread_id}")
        if response and response.status_code == 200:
            messages = response.json()
            if isinstance(messages, list):
                self.log_result("Get DM Messages", True, f"Retrieved {len(messages)} messages")
            else:
                self.log_result("Get DM Messages", False, error="Invalid messages response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get DM Messages", False, error=error_msg)
        
        return True
    
    def test_viberooms_api(self):
        """Test VibeRooms APIs"""
        # Create audio room
        room_data = {
            "name": "Test Audio Room",
            "description": "A test room for backend testing",
            "category": "tech"
        }
        
        response = self.make_request("POST", "/viberooms", room_data, params={"hostId": self.user_id})
        
        if not response or response.status_code != 200:
            error_msg = f"Create VibeRoom failed - Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create VibeRoom", False, error=error_msg)
            return False
        
        room_result = response.json()
        self.created_room_id = room_result.get("id")
        
        if not self.created_room_id:
            self.log_result("Create VibeRoom", False, error="No room ID returned")
            return False
        
        self.log_result("Create VibeRoom", True, f"Room ID: {self.created_room_id}")
        
        # Get all rooms
        response = self.make_request("GET", "/viberooms")
        if response and response.status_code == 200:
            rooms = response.json()
            if isinstance(rooms, list):
                self.log_result("Get All VibeRooms", True, f"Retrieved {len(rooms)} rooms")
            else:
                self.log_result("Get All VibeRooms", False, error="Invalid rooms response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get All VibeRooms", False, error=error_msg)
        
        # Join the room
        response = self.make_request("POST", f"/viberooms/{self.created_room_id}/join", params={"userId": self.user_id})
        if response and response.status_code == 200:
            self.log_result("Join VibeRoom", True, "Joined room successfully")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Join VibeRoom", False, error=error_msg)
        
        # Get Agora token
        response = self.make_request("GET", f"/viberooms/{self.created_room_id}/agora-token", params={"userId": self.user_id})
        if response and response.status_code == 200:
            token_result = response.json()
            if "token" in token_result:
                self.log_result("Get Agora Token", True, "Agora token retrieved successfully")
            else:
                self.log_result("Get Agora Token", False, error="No token in response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get Agora Token", False, error=error_msg)
        
        return True
    
    def test_user_profile_api(self):
        """Test User Profile APIs"""
        # Get user profile
        response = self.make_request("GET", f"/users/{self.user_id}")
        if response and response.status_code == 200:
            user_profile = response.json()
            if "id" in user_profile:
                self.log_result("Get User Profile", True, f"User: {user_profile.get('name', 'Unknown')}")
            else:
                self.log_result("Get User Profile", False, error="Invalid user profile")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get User Profile", False, error=error_msg)
        
        # Update profile
        update_data = {
            "bio": "Updated bio from backend testing"
        }
        
        response = self.make_request("PUT", f"/users/{self.user_id}", update_data)
        if response and response.status_code == 200:
            self.log_result("Update User Profile", True, "Profile updated successfully")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Update User Profile", False, error=error_msg)
        
        # Get user's posts
        response = self.make_request("GET", f"/users/{self.user_id}/posts")
        if response and response.status_code == 200:
            user_posts = response.json()
            if isinstance(user_posts, list):
                self.log_result("Get User Posts", True, f"Retrieved {len(user_posts)} posts")
            else:
                self.log_result("Get User Posts", False, error="Invalid posts response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get User Posts", False, error=error_msg)
        
        # Send friend request (if test user available)
        if self.test_user_2_id:
            response = self.make_request("POST", f"/users/{self.test_user_2_id}/friend-request", params={"fromUserId": self.user_id})
            if response and response.status_code == 200:
                self.log_result("Send Friend Request", True, "Friend request sent successfully")
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                self.log_result("Send Friend Request", False, error=error_msg)
        
        return True
    
    def test_notifications_api(self):
        """Test Notifications APIs"""
        # Get notifications
        response = self.make_request("GET", "/notifications", params={"userId": self.user_id})
        if response and response.status_code == 200:
            notifications = response.json()
            if isinstance(notifications, list):
                self.log_result("Get Notifications", True, f"Retrieved {len(notifications)} notifications")
                
                # Mark first notification as read if available
                if len(notifications) > 0:
                    notification_id = notifications[0].get("id")
                    if notification_id:
                        response = self.make_request("PUT", f"/notifications/{notification_id}/read")
                        if response and response.status_code == 200:
                            self.log_result("Mark Notification Read", True, "Notification marked as read")
                        else:
                            error_msg = f"Status: {response.status_code if response else 'No response'}"
                            self.log_result("Mark Notification Read", False, error=error_msg)
            else:
                self.log_result("Get Notifications", False, error="Invalid notifications response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get Notifications", False, error=error_msg)
        
        return True
    
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
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend API Testing for Production Launch")
        print("=" * 80)
        print(f"📍 API Base URL: {BASE_URL}")
        print("=" * 80)
        
        # Health check first
        if not self.test_health_check():
            print("❌ Backend health check failed. Stopping tests.")
            return
        
        # Try demo user login first, if fails create test users
        demo_login_success = self.test_demo_user_login()
        
        if not demo_login_success:
            # Create test users since demo user doesn't exist
            if not self.test_create_test_users():
                print("❌ Failed to create test users. Stopping tests.")
                return
        
        # Authentication tests
        self.test_login_with_created_user()
        self.test_get_current_user()
        self.test_jwt_token_validation()
        
        # Core functionality tests
        self.test_posts_crud()
        self.test_reels_api()
        self.test_tribes_api()
        self.test_messaging_api()
        self.test_viberooms_api()
        self.test_user_profile_api()
        self.test_notifications_api()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 BACKEND TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['error']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"  • {result['test']}")
        
        print("\n" + "=" * 80)
        
        # Critical issues summary
        critical_failures = [r for r in self.test_results if not r["success"] and any(word in r["test"].lower() for word in ["auth", "login", "signup", "health"])]
        
        if critical_failures:
            print("🚨 CRITICAL ISSUES FOUND:")
            for failure in critical_failures:
                print(f"  • {failure['test']}: {failure['error']}")
        
        if passed_tests == total_tests:
            print("\n🎉 ALL TESTS PASSED - BACKEND IS PRODUCTION READY!")
        elif failed_tests <= 2:
            print(f"\n⚠️ MINOR ISSUES FOUND - {failed_tests} tests failed")
        else:
            print(f"\n❌ MAJOR ISSUES FOUND - {failed_tests} tests failed")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)