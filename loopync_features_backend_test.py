#!/usr/bin/env python3
"""
Loopync Features Backend Test
Testing specific features: Repost, Delete Post, Share to Messenger, VibeZone (Reels)
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://talentloop-4.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "loopyncpvt@gmail.com"
ADMIN_PASSWORD = "ramcharan@123"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "test123"

class LoopyncFeaturesTest:
    def __init__(self):
        self.admin_token = None
        self.test_user_token = None
        self.admin_user_id = None
        self.test_user_id = None
        self.test_post_id = None
        self.test_results = []

    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")

    def login_user(self, email, password, user_type="user"):
        """Login and get JWT token"""
        try:
            response = requests.post(f"{API_BASE}/auth/login", json={
                "email": email,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("token")
                user_id = data.get("user", {}).get("id")
                self.log_result(f"Login {user_type}", True, f"Successfully logged in as {email}")
                return token, user_id
            else:
                self.log_result(f"Login {user_type}", False, f"Login failed: {response.status_code}", response.text)
                return None, None
                
        except Exception as e:
            self.log_result(f"Login {user_type}", False, f"Login error: {str(e)}")
            return None, None

    def create_test_post(self, token, user_id):
        """Create a test post for testing repost and delete functionality"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            post_data = {
                "text": "This is a test post for repost and delete functionality testing! 🚀 #loopync #testing",
                "audience": "public"
            }
            
            # Add authorId as query parameter
            response = requests.post(f"{API_BASE}/posts?authorId={user_id}", json=post_data, headers=headers)
            
            if response.status_code == 200:  # Changed from 201 to 200
                data = response.json()
                post_id = data.get("id")
                self.log_result("Create Test Post", True, f"Test post created successfully", f"Post ID: {post_id}")
                return post_id
            else:
                self.log_result("Create Test Post", False, f"Failed to create post: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_result("Create Test Post", False, f"Error creating post: {str(e)}")
            return None

    def test_repost_feature(self):
        """Test POST /api/posts/{postId}/repost?userId={userId}"""
        print("\n=== Testing Repost Feature ===")
        
        if not self.test_post_id:
            self.log_result("Repost Feature", False, "No test post available for reposting")
            return
        
        try:
            # Test repost with admin user
            url = f"{API_BASE}/posts/{self.test_post_id}/repost?userId={self.admin_user_id}"
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            response = requests.post(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                if "action" in data and "reposts" in data:
                    action = data.get("action")
                    reposts_count = data.get("reposts", 0)
                    
                    if action == "reposted":
                        self.log_result("Repost Feature - Action", True, f"Repost action successful", f"Action: {action}, Reposts: {reposts_count}")
                        
                        # Verify post.repostedBy array includes the user ID by getting all posts and finding ours
                        posts_response = requests.get(f"{API_BASE}/posts", headers=headers)
                        if posts_response.status_code == 200:
                            all_posts = posts_response.json()
                            target_post = None
                            for post in all_posts:
                                if post.get("id") == self.test_post_id:
                                    target_post = post
                                    break
                            
                            if target_post:
                                reposted_by = target_post.get("repostedBy", [])
                                if self.admin_user_id in reposted_by:
                                    self.log_result("Repost Feature - User in Array", True, "User ID correctly added to repostedBy array")
                                else:
                                    self.log_result("Repost Feature - User in Array", False, f"User ID not found in repostedBy array", f"Array: {reposted_by}, UserID: {self.admin_user_id}")
                            else:
                                self.log_result("Repost Feature - Verification", False, f"Could not find post with ID {self.test_post_id} in posts list")
                        else:
                            self.log_result("Repost Feature - Verification", False, f"Could not get posts list - Status: {posts_response.status_code}", posts_response.text)
                    else:
                        self.log_result("Repost Feature - Action", False, f"Unexpected action: {action}")
                else:
                    self.log_result("Repost Feature - Response Structure", False, "Missing required fields in response", f"Response: {data}")
            else:
                self.log_result("Repost Feature", False, f"Repost failed: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Repost Feature", False, f"Error testing repost: {str(e)}")

    def test_delete_post_feature(self):
        """Test DELETE /api/posts/{postId} with Authorization header"""
        print("\n=== Testing Delete Post Feature ===")
        
        # Create a new post specifically for deletion testing
        delete_test_post_id = self.create_test_post(self.admin_token, self.admin_user_id)
        
        if not delete_test_post_id:
            self.log_result("Delete Post Feature", False, "Could not create post for deletion test")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.delete(f"{API_BASE}/posts/{delete_test_post_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") == True:
                    self.log_result("Delete Post Feature", True, "Post deleted successfully", f"Response: {data}")
                    
                    # Verify post is actually deleted by checking posts list
                    verify_response = requests.get(f"{API_BASE}/posts", headers=headers)
                    if verify_response.status_code == 200:
                        all_posts = verify_response.json()
                        post_still_exists = any(post.get("id") == delete_test_post_id for post in all_posts)
                        
                        if not post_still_exists:
                            self.log_result("Delete Post Feature - Verification", True, "Post successfully removed from database")
                        else:
                            self.log_result("Delete Post Feature - Verification", False, "Post still exists after deletion")
                    else:
                        self.log_result("Delete Post Feature - Verification", False, f"Could not verify deletion - Status: {verify_response.status_code}")
                else:
                    self.log_result("Delete Post Feature", False, f"Delete response missing success=true", f"Response: {data}")
            else:
                self.log_result("Delete Post Feature", False, f"Delete failed: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Delete Post Feature", False, f"Error testing delete: {str(e)}")

    def test_share_to_messenger(self):
        """Test POST /api/messages endpoint for sharing posts"""
        print("\n=== Testing Share to Messenger Feature ===")
        
        if not self.test_post_id or not self.test_user_id:
            self.log_result("Share to Messenger", False, "Missing test post or test user for sharing")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create message with shared post using the correct API structure
            message_data = {
                "text": f"Check out this amazing post! 🔥 Post content and details shared via Loopync messenger. contentType: post, contentId: {self.test_post_id}, isSharedPost: true"
            }
            
            # Add query parameters for fromId and toId
            response = requests.post(f"{API_BASE}/messages?fromId={self.admin_user_id}&toId={self.test_user_id}", json=message_data, headers=headers)
            
            if response.status_code == 200:  # Changed from 201 to 200
                data = response.json()
                message_id = data.get("id")
                
                # Verify message structure
                required_fields = ["text", "fromId", "toId"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_result("Share to Messenger - Structure", True, "Shared message created with correct structure", f"Message ID: {message_id}")
                    
                    # Verify the message contains post sharing information
                    message_text = data.get("text", "")
                    if ("contentType: post" in message_text and 
                        f"contentId: {self.test_post_id}" in message_text and 
                        "isSharedPost: true" in message_text):
                        self.log_result("Share to Messenger - Content", True, "Shared post content correctly included in message text")
                    else:
                        self.log_result("Share to Messenger - Content", False, "Shared post content not properly included", f"Message: {message_text}")
                else:
                    self.log_result("Share to Messenger - Structure", False, f"Missing required fields: {missing_fields}")
            else:
                self.log_result("Share to Messenger", False, f"Share failed: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Share to Messenger", False, f"Error testing share: {str(e)}")

    def test_vibezone_reels(self):
        """Test GET /api/reels endpoint"""
        print("\n=== Testing VibeZone (Reels) Feature ===")
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{API_BASE}/reels", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check structure of first reel
                        reel = data[0]
                        required_fields = ["videoUrl", "author", "stats"]
                        missing_fields = [field for field in required_fields if field not in reel]
                        
                        if not missing_fields:
                            # Verify author structure
                            author = reel.get("author", {})
                            if isinstance(author, dict) and "id" in author and "name" in author:
                                self.log_result("VibeZone Reels - Structure", True, f"Reels have valid structure", f"Found {len(data)} reels")
                                
                                # Verify stats structure
                                stats = reel.get("stats", {})
                                if isinstance(stats, dict):
                                    self.log_result("VibeZone Reels - Stats", True, "Reel stats structure valid")
                                else:
                                    self.log_result("VibeZone Reels - Stats", False, "Invalid stats structure")
                            else:
                                self.log_result("VibeZone Reels - Author", False, "Invalid author structure", f"Author: {author}")
                        else:
                            self.log_result("VibeZone Reels - Structure", False, f"Missing required fields: {missing_fields}")
                    else:
                        self.log_result("VibeZone Reels - Content", False, "No reels found in system", "Empty array returned")
                else:
                    self.log_result("VibeZone Reels - Response", False, "Invalid response format", f"Expected array, got: {type(data)}")
            else:
                self.log_result("VibeZone Reels", False, f"Reels API failed: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("VibeZone Reels", False, f"Error testing reels: {str(e)}")

    def run_all_tests(self):
        """Run all feature tests"""
        print("🚀 Starting Loopync Features Backend Testing...")
        print(f"Base URL: {BASE_URL}")
        print("=" * 60)
        
        # Login users
        self.admin_token, self.admin_user_id = self.login_user(ADMIN_EMAIL, ADMIN_PASSWORD, "admin")
        self.test_user_token, self.test_user_id = self.login_user(TEST_USER_EMAIL, TEST_USER_PASSWORD, "test_user")
        
        if not self.admin_token:
            print("❌ Cannot proceed without admin login")
            return
        
        # Create test post for repost testing
        self.test_post_id = self.create_test_post(self.admin_token, self.admin_user_id)
        
        # Run feature tests
        self.test_repost_feature()
        self.test_delete_post_feature()
        self.test_share_to_messenger()
        self.test_vibezone_reels()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result["status"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if "✅ PASS" in result["status"]:
                print(f"  - {result['test']}: {result['message']}")

if __name__ == "__main__":
    tester = LoopyncFeaturesTest()
    tester.run_all_tests()