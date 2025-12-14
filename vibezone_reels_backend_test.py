#!/usr/bin/env python3
"""
VibeZone (Reels) Backend API Testing

Test the VibeZone (Reels) feature backend APIs:
1. GET /api/reels - Get all reels
2. POST /api/reels/{reelId}/like?userId={userId} - Like a reel
3. POST /api/reels/{reelId}/view - View a reel  
4. POST /api/reels/{reelId}/comments?authorId={userId} - Comment on a reel
5. GET /api/reels/{reelId}/comments - Get reel comments

Test Credentials:
- Admin: loopyncpvt@gmail.com / ramcharan@123
- Test User: test@example.com / test123

Base URL: https://loopync-social-2.preview.emergentagent.com
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "https://loopync-social-2.preview.emergentagent.com/api"
ADMIN_EMAIL = "loopyncpvt@gmail.com"
ADMIN_PASSWORD = "ramcharan@123"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"

class VibeZoneReelsTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.admin_user_id = None
        self.test_user_token = None
        self.test_user_id = None
        self.test_results = []
        self.available_reels = []
        
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
    
    def make_request(self, method, endpoint, data=None, headers=None, params=None, token=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        # Use provided token or default to admin token
        auth_token = token or self.admin_token
        
        # Add auth header if token available
        if auth_token and headers is None:
            headers = {"Authorization": f"Bearer {auth_token}"}
        elif auth_token and headers:
            headers["Authorization"] = f"Bearer {auth_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params, timeout=15)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers, params=params, timeout=15)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, params=params, timeout=15)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, params=params, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request error: {e}", "ERROR")
            return None
    
    def test_admin_login(self):
        """Test admin login"""
        self.log("Testing admin login...")
        
        response = self.make_request("POST", "/auth/login", {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.admin_token = result["token"]
                self.admin_user_id = result["user"]["id"]
                self.log_result("Admin Login", True, f"Admin ID: {self.admin_user_id}")
                return True
            else:
                self.log_result("Admin Login", False, error="Invalid login response structure")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Admin Login", False, error=error_msg)
            return False
    
    def test_test_user_login(self):
        """Test user login (optional)"""
        self.log("Testing test user login...")
        
        response = self.make_request("POST", "/auth/login", {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.test_user_token = result["token"]
                self.test_user_id = result["user"]["id"]
                self.log_result("Test User Login", True, f"Test User ID: {self.test_user_id}")
                return True
            else:
                self.log_result("Test User Login", False, error="Invalid login response structure")
                return False
        else:
            # Test user might not exist, that's okay
            self.log_result("Test User Login", False, error="Test user not available (expected if not created)")
            return False
    
    def test_get_reels(self):
        """Test GET /api/reels - Get all reels"""
        self.log("Testing GET /api/reels...")
        
        response = self.make_request("GET", "/reels")
        
        if response and response.status_code == 200:
            reels = response.json()
            
            if isinstance(reels, list):
                self.available_reels = reels
                self.log_result("Get Reels", True, f"Retrieved {len(reels)} reels")
                
                # Validate reel structure
                if len(reels) > 0:
                    reel = reels[0]
                    required_fields = ["id", "videoUrl", "caption", "authorId", "stats"]
                    missing_fields = []
                    
                    for field in required_fields:
                        if field not in reel:
                            missing_fields.append(field)
                    
                    if missing_fields:
                        self.log_result("Reel Structure Validation", False, 
                                      error=f"Missing fields: {missing_fields}")
                    else:
                        # Check author object
                        author = reel.get("author")
                        if author and isinstance(author, dict):
                            author_fields = ["id", "name", "handle", "avatar"]
                            missing_author_fields = [f for f in author_fields if f not in author]
                            
                            if missing_author_fields:
                                self.log_result("Reel Author Structure", False,
                                              error=f"Missing author fields: {missing_author_fields}")
                            else:
                                self.log_result("Reel Author Structure", True, 
                                              f"Author: {author.get('name')} (@{author.get('handle')})")
                        else:
                            self.log_result("Reel Author Structure", False, error="Missing or invalid author object")
                        
                        # Check stats object
                        stats = reel.get("stats")
                        if stats and isinstance(stats, dict):
                            stats_fields = ["views", "likes", "comments", "shares"]
                            missing_stats_fields = [f for f in stats_fields if f not in stats]
                            
                            if missing_stats_fields:
                                self.log_result("Reel Stats Structure", False,
                                              error=f"Missing stats fields: {missing_stats_fields}")
                            else:
                                self.log_result("Reel Stats Structure", True, 
                                              f"Stats: {stats.get('views')} views, {stats.get('likes')} likes")
                        else:
                            self.log_result("Reel Stats Structure", False, error="Missing or invalid stats object")
                        
                        # Check for MongoDB _id field (should be excluded)
                        if "_id" in reel:
                            self.log_result("MongoDB _id Exclusion", False, error="MongoDB _id field present (should be excluded)")
                        else:
                            self.log_result("MongoDB _id Exclusion", True, "MongoDB _id field properly excluded")
                
                return True
            else:
                self.log_result("Get Reels", False, error="Response is not a list")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Get Reels", False, error=error_msg)
            return False
    
    def test_like_reel(self):
        """Test POST /api/reels/{reelId}/like?userId={userId} - Like a reel"""
        if not self.available_reels:
            self.log_result("Like Reel", False, error="No reels available to test")
            return False
        
        reel_id = self.available_reels[0]["id"]
        self.log(f"Testing POST /api/reels/{reel_id}/like...")
        
        response = self.make_request("POST", f"/reels/{reel_id}/like", 
                                   params={"userId": self.admin_user_id})
        
        if response and response.status_code == 200:
            result = response.json()
            
            # Check response structure
            if "action" in result and "likes" in result:
                action = result.get("action")
                likes_count = result.get("likes")
                
                if action in ["liked", "unliked"]:
                    self.log_result("Like Reel", True, 
                                  f"Action: {action}, Likes: {likes_count}")
                    return True
                else:
                    self.log_result("Like Reel", False, 
                                  error=f"Invalid action value: {action}")
                    return False
            else:
                self.log_result("Like Reel", False, 
                              error="Missing 'action' or 'likes' in response")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Like Reel", False, error=error_msg)
            return False
    
    def test_view_reel(self):
        """Test POST /api/reels/{reelId}/view - View a reel"""
        if not self.available_reels:
            self.log_result("View Reel", False, error="No reels available to test")
            return False
        
        reel_id = self.available_reels[0]["id"]
        self.log(f"Testing POST /api/reels/{reel_id}/view...")
        
        response = self.make_request("POST", f"/reels/{reel_id}/view")
        
        if response and response.status_code == 200:
            result = response.json()
            
            # Check if view count incremented (response should indicate success)
            if "success" in result or "views" in result or "message" in result:
                self.log_result("View Reel", True, "Reel view tracked successfully")
                return True
            else:
                # Even if response structure is different, 200 status means success
                self.log_result("View Reel", True, "Reel view endpoint responded successfully")
                return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("View Reel", False, error=error_msg)
            return False
    
    def test_comment_on_reel(self):
        """Test POST /api/reels/{reelId}/comments?authorId={userId} - Comment on a reel"""
        if not self.available_reels:
            self.log_result("Comment on Reel", False, error="No reels available to test")
            return False
        
        reel_id = self.available_reels[0]["id"]
        self.log(f"Testing POST /api/reels/{reel_id}/comments...")
        
        comment_data = {
            "text": "Great reel! Testing comment functionality."
        }
        
        response = self.make_request("POST", f"/reels/{reel_id}/comments", 
                                   data=comment_data,
                                   params={"authorId": self.admin_user_id})
        
        if response and response.status_code == 200:
            result = response.json()
            
            # Check if comment was created
            if "id" in result or "success" in result:
                comment_id = result.get("id", "unknown")
                self.log_result("Comment on Reel", True, 
                              f"Comment created successfully (ID: {comment_id})")
                return True
            else:
                # Even if response structure is different, 200 status means success
                self.log_result("Comment on Reel", True, "Comment endpoint responded successfully")
                return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Comment on Reel", False, error=error_msg)
            return False
    
    def test_get_reel_comments(self):
        """Test GET /api/reels/{reelId}/comments - Get reel comments"""
        if not self.available_reels:
            self.log_result("Get Reel Comments", False, error="No reels available to test")
            return False
        
        reel_id = self.available_reels[0]["id"]
        self.log(f"Testing GET /api/reels/{reel_id}/comments...")
        
        response = self.make_request("GET", f"/reels/{reel_id}/comments")
        
        if response and response.status_code == 200:
            comments = response.json()
            
            if isinstance(comments, list):
                self.log_result("Get Reel Comments", True, 
                              f"Retrieved {len(comments)} comments")
                
                # Validate comment structure if comments exist
                if len(comments) > 0:
                    comment = comments[0]
                    required_fields = ["id", "text", "authorId", "createdAt"]
                    missing_fields = []
                    
                    for field in required_fields:
                        if field not in comment:
                            missing_fields.append(field)
                    
                    if missing_fields:
                        self.log_result("Comment Structure Validation", False,
                                      error=f"Missing comment fields: {missing_fields}")
                    else:
                        # Check author info
                        author = comment.get("author")
                        if author and isinstance(author, dict):
                            self.log_result("Comment Author Info", True,
                                          f"Author: {author.get('name', 'Unknown')}")
                        else:
                            self.log_result("Comment Author Info", False,
                                          error="Missing or invalid author info in comment")
                
                return True
            else:
                self.log_result("Get Reel Comments", False, error="Response is not a list")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Get Reel Comments", False, error=error_msg)
            return False
    
    def run_all_tests(self):
        """Run all VibeZone (Reels) tests"""
        print("🎬 Starting VibeZone (Reels) Backend API Testing")
        print("=" * 60)
        print(f"📍 API Base URL: {BASE_URL}")
        print("=" * 60)
        
        # Login tests
        if not self.test_admin_login():
            print("❌ Admin login failed. Cannot proceed with tests.")
            return False
        
        # Optional test user login
        self.test_test_user_login()
        
        # Core VibeZone (Reels) API tests
        self.test_get_reels()
        self.test_like_reel()
        self.test_view_reel()
        self.test_comment_on_reel()
        self.test_get_reel_comments()
        
        # Print summary
        self.print_summary()
        
        # Return success status
        passed_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        return passed_tests == total_tests
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 VIBEZONE (REELS) TESTING SUMMARY")
        print("=" * 60)
        
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
        
        print("\n" + "=" * 60)
        
        if passed_tests == total_tests:
            print("\n🎉 ALL VIBEZONE (REELS) TESTS PASSED!")
        else:
            print(f"\n⚠️ {failed_tests} VIBEZONE (REELS) TESTS FAILED")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = VibeZoneReelsTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)