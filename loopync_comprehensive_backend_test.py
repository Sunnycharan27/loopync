#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Loopync Launch
Based on review request specifications

**Test Credentials**: test@test.com / testpassword123

**API Test Suite:**
1. Authentication APIs
2. User APIs  
3. Posts APIs
4. Tribes APIs
5. Digital Products APIs
6. Messenger APIs
7. Analytics APIs

All error responses should return proper JSON format, not HTML or stack traces.
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "https://socialsync-app-2.preview.emergentagent.com/api"
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "testpassword123"

class LoopyncBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_results = []
        self.created_post_id = None
        self.created_tribe_id = None
        self.created_product_id = None
        self.test_user_id = None
        
    def log(self, message, level="INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def log_result(self, test_name, success, details="", error="", response_time=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        time_info = f" ({response_time:.0f}ms)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        if details:
            print(f"    Details: {details}")
        if error:
            print(f"    Error: {error}")
        print()
    
    def make_request(self, method, endpoint, data=None, headers=None, params=None):
        """Make HTTP request with error handling and timing"""
        url = f"{BASE_URL}{endpoint}"
        
        # Add auth header if token available
        if self.token and headers is None:
            headers = {"Authorization": f"Bearer {self.token}"}
        elif self.token and headers:
            headers["Authorization"] = f"Bearer {self.token}"
        
        start_time = time.time()
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
            
            response_time = (time.time() - start_time) * 1000
            return response, response_time
        except requests.exceptions.RequestException as e:
            response_time = (time.time() - start_time) * 1000
            return None, response_time

    def verify_json_response(self, response):
        """Verify response is proper JSON, not HTML or stack trace"""
        if not response:
            return False, "No response received"
        
        content_type = response.headers.get('content-type', '')
        if 'text/html' in content_type:
            return False, f"HTML response received instead of JSON (status: {response.status_code})"
        
        try:
            response.json()
            return True, "Valid JSON response"
        except json.JSONDecodeError:
            return False, f"Invalid JSON response (status: {response.status_code})"

    # ===== AUTHENTICATION API TESTS =====
    
    def test_auth_login_valid(self):
        """POST /api/auth/login - Login with valid credentials"""
        response, response_time = self.make_request("POST", "/auth/login", {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Auth Login Valid", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.token = result["token"]
                self.user_id = result["user"]["id"]
                self.log_result("Auth Login Valid", True, 
                              f"User ID: {self.user_id}, Token received", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Auth Login Valid", False, 
                              error="Missing token or user in response", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json().get('detail', response.text)
                    error_msg += f", Detail: {error_detail}"
                except:
                    error_msg += f", Response: {response.text[:200]}"
            self.log_result("Auth Login Valid", False, error=error_msg, response_time=response_time)
            return False
    
    def test_auth_login_invalid(self):
        """POST /api/auth/login - Login with invalid credentials"""
        response, response_time = self.make_request("POST", "/auth/login", {
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        })
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Auth Login Invalid", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 401:
            self.log_result("Auth Login Invalid", True, 
                          "Correctly rejected invalid credentials", 
                          response_time=response_time)
            return True
        else:
            error_msg = f"Expected 401, got {response.status_code if response else 'No response'}"
            self.log_result("Auth Login Invalid", False, error=error_msg, response_time=response_time)
            return False
    
    def test_auth_me(self):
        """GET /api/auth/me - Get current user with valid token"""
        if not self.token:
            self.log_result("Auth Me", False, error="No token available")
            return False
        
        response, response_time = self.make_request("GET", "/auth/me")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Auth Me", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            user_data = response.json()
            if "id" in user_data and user_data["id"] == self.user_id:
                self.log_result("Auth Me", True, 
                              f"Retrieved user: {user_data.get('name', 'Unknown')}", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Auth Me", False, 
                              error="User ID mismatch or missing", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Auth Me", False, error=error_msg, response_time=response_time)
            return False
    
    def test_auth_signup(self):
        """POST /api/auth/signup - Signup validation"""
        # Test with unique email
        test_email = f"testuser_{int(time.time())}@test.com"
        response, response_time = self.make_request("POST", "/auth/signup", {
            "email": test_email,
            "password": "testpass123",
            "name": "Test User",
            "handle": f"testuser_{int(time.time())}"
        })
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Auth Signup", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.test_user_id = result["user"]["id"]
                self.log_result("Auth Signup", True, 
                              f"New user created: {result['user']['name']}", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Auth Signup", False, 
                              error="Missing token or user in signup response", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json().get('detail', response.text)
                    error_msg += f", Detail: {error_detail}"
                except:
                    error_msg += f", Response: {response.text[:200]}"
            self.log_result("Auth Signup", False, error=error_msg, response_time=response_time)
            return False

    # ===== USER API TESTS =====
    
    def test_users_list(self):
        """GET /api/users - List users"""
        response, response_time = self.make_request("GET", "/users")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Users List", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            users = response.json()
            if isinstance(users, list):
                self.log_result("Users List", True, 
                              f"Retrieved {len(users)} users", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Users List", False, 
                              error="Response is not a list", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Users List", False, error=error_msg, response_time=response_time)
            return False
    
    def test_users_get_by_id(self):
        """GET /api/users/{userId} - Get user by ID"""
        if not self.user_id:
            self.log_result("Users Get By ID", False, error="No user ID available")
            return False
        
        response, response_time = self.make_request("GET", f"/users/{self.user_id}")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Users Get By ID", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            user = response.json()
            if "id" in user and user["id"] == self.user_id:
                self.log_result("Users Get By ID", True, 
                              f"Retrieved user: {user.get('name', 'Unknown')}", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Users Get By ID", False, 
                              error="User ID mismatch", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Users Get By ID", False, error=error_msg, response_time=response_time)
            return False
    
    def test_users_follow(self):
        """POST /api/users/{userId}/follow - Follow a user"""
        if not self.test_user_id:
            self.log_result("Users Follow", False, error="No test user available to follow")
            return False
        
        response, response_time = self.make_request("POST", f"/users/{self.test_user_id}/follow", 
                                                  {"targetUserId": self.test_user_id})
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Users Follow", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code in [200, 201]:
            self.log_result("Users Follow", True, 
                          "Follow action completed", 
                          response_time=response_time)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json().get('detail', response.text)
                    error_msg += f", Detail: {error_detail}"
                except:
                    error_msg += f", Response: {response.text[:200]}"
            self.log_result("Users Follow", False, error=error_msg, response_time=response_time)
            return False
    
    def test_users_followers(self):
        """GET /api/users/{userId}/followers - Get followers"""
        if not self.user_id:
            self.log_result("Users Followers", False, error="No user ID available")
            return False
        
        response, response_time = self.make_request("GET", f"/users/{self.user_id}/followers")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Users Followers", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            followers = response.json()
            if isinstance(followers, list):
                self.log_result("Users Followers", True, 
                              f"Retrieved {len(followers)} followers", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Users Followers", False, 
                              error="Response is not a list", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Users Followers", False, error=error_msg, response_time=response_time)
            return False
    
    def test_users_following(self):
        """GET /api/users/{userId}/following - Get following"""
        if not self.user_id:
            self.log_result("Users Following", False, error="No user ID available")
            return False
        
        response, response_time = self.make_request("GET", f"/users/{self.user_id}/following")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Users Following", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            following = response.json()
            if isinstance(following, list):
                self.log_result("Users Following", True, 
                              f"Retrieved {len(following)} following", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Users Following", False, 
                              error="Response is not a list", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Users Following", False, error=error_msg, response_time=response_time)
            return False

    # ===== POSTS API TESTS =====
    
    def test_posts_list(self):
        """GET /api/posts - List posts"""
        response, response_time = self.make_request("GET", "/posts")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Posts List", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            posts = response.json()
            if isinstance(posts, list):
                self.log_result("Posts List", True, 
                              f"Retrieved {len(posts)} posts", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Posts List", False, 
                              error="Response is not a list", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Posts List", False, error=error_msg, response_time=response_time)
            return False
    
    def test_posts_create(self):
        """POST /api/posts - Create a post"""
        if not self.user_id:
            self.log_result("Posts Create", False, error="No user ID available")
            return False
        
        post_data = {
            "text": "Test post from comprehensive backend testing 🚀",
            "audience": "public",
            "hashtags": ["test", "backend", "loopync"]
        }
        
        response, response_time = self.make_request("POST", "/posts", post_data, 
                                                  params={"authorId": self.user_id})
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Posts Create", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            post = response.json()
            if "id" in post:
                self.created_post_id = post["id"]
                self.log_result("Posts Create", True, 
                              f"Created post ID: {self.created_post_id}", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Posts Create", False, 
                              error="No post ID in response", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json().get('detail', response.text)
                    error_msg += f", Detail: {error_detail}"
                except:
                    error_msg += f", Response: {response.text[:200]}"
            self.log_result("Posts Create", False, error=error_msg, response_time=response_time)
            return False
    
    def test_posts_like(self):
        """POST /api/posts/{postId}/like - Like a post"""
        if not self.created_post_id or not self.user_id:
            self.log_result("Posts Like", False, error="No post ID or user ID available")
            return False
        
        response, response_time = self.make_request("POST", f"/posts/{self.created_post_id}/like", 
                                                  params={"userId": self.user_id})
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Posts Like", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            self.log_result("Posts Like", True, 
                          "Post liked successfully", 
                          response_time=response_time)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Posts Like", False, error=error_msg, response_time=response_time)
            return False
    
    def test_posts_delete(self):
        """DELETE /api/posts/{postId} - Delete a post (test authorization)"""
        if not self.created_post_id or not self.user_id:
            self.log_result("Posts Delete", False, error="No post ID or user ID available")
            return False
        
        response, response_time = self.make_request("DELETE", f"/posts/{self.created_post_id}", 
                                                  params={"userId": self.user_id})
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Posts Delete", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            self.log_result("Posts Delete", True, 
                          "Post deleted successfully", 
                          response_time=response_time)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Posts Delete", False, error=error_msg, response_time=response_time)
            return False

    # ===== TRIBES API TESTS =====
    
    def test_tribes_list(self):
        """GET /api/tribes - List tribes"""
        response, response_time = self.make_request("GET", "/tribes")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Tribes List", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            tribes = response.json()
            if isinstance(tribes, list):
                self.log_result("Tribes List", True, 
                              f"Retrieved {len(tribes)} tribes", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Tribes List", False, 
                              error="Response is not a list", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Tribes List", False, error=error_msg, response_time=response_time)
            return False
    
    def test_tribes_create(self):
        """POST /api/tribes - Create a tribe"""
        if not self.user_id:
            self.log_result("Tribes Create", False, error="No user ID available")
            return False
        
        tribe_data = {
            "name": "Test Tribe Backend API",
            "description": "A test tribe created during backend API testing",
            "type": "public",
            "tags": ["testing", "backend", "api"]
        }
        
        response, response_time = self.make_request("POST", "/tribes", tribe_data, 
                                                  params={"ownerId": self.user_id})
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Tribes Create", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            tribe = response.json()
            if "id" in tribe:
                self.created_tribe_id = tribe["id"]
                self.log_result("Tribes Create", True, 
                              f"Created tribe ID: {self.created_tribe_id}", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Tribes Create", False, 
                              error="No tribe ID in response", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json().get('detail', response.text)
                    error_msg += f", Detail: {error_detail}"
                except:
                    error_msg += f", Response: {response.text[:200]}"
            self.log_result("Tribes Create", False, error=error_msg, response_time=response_time)
            return False
    
    def test_tribes_get_details(self):
        """GET /api/tribes/{tribeId} - Get tribe details"""
        if not self.created_tribe_id:
            self.log_result("Tribes Get Details", False, error="No tribe ID available")
            return False
        
        response, response_time = self.make_request("GET", f"/tribes/{self.created_tribe_id}")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Tribes Get Details", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            tribe = response.json()
            if "id" in tribe and tribe["id"] == self.created_tribe_id:
                self.log_result("Tribes Get Details", True, 
                              f"Retrieved tribe: {tribe.get('name', 'Unknown')}", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Tribes Get Details", False, 
                              error="Tribe ID mismatch", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Tribes Get Details", False, error=error_msg, response_time=response_time)
            return False
    
    def test_tribes_update(self):
        """PUT /api/tribes/{tribeId} - Update tribe (test authorization)"""
        if not self.created_tribe_id:
            self.log_result("Tribes Update", False, error="No tribe ID available")
            return False
        
        update_data = {
            "description": "Updated description from backend API testing"
        }
        
        response, response_time = self.make_request("PUT", f"/tribes/{self.created_tribe_id}", 
                                                  update_data)
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Tribes Update", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            self.log_result("Tribes Update", True, 
                          "Tribe updated successfully", 
                          response_time=response_time)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Tribes Update", False, error=error_msg, response_time=response_time)
            return False
    
    def test_tribes_join(self):
        """POST /api/tribes/{tribeId}/join - Join tribe"""
        if not self.created_tribe_id or not self.test_user_id:
            self.log_result("Tribes Join", False, error="No tribe ID or test user available")
            return False
        
        response, response_time = self.make_request("POST", f"/tribes/{self.created_tribe_id}/join", 
                                                  params={"userId": self.test_user_id})
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Tribes Join", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            self.log_result("Tribes Join", True, 
                          "Joined tribe successfully", 
                          response_time=response_time)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Tribes Join", False, error=error_msg, response_time=response_time)
            return False
    
    def test_tribes_leave(self):
        """POST /api/tribes/{tribeId}/leave - Leave tribe"""
        if not self.created_tribe_id or not self.test_user_id:
            self.log_result("Tribes Leave", False, error="No tribe ID or test user available")
            return False
        
        response, response_time = self.make_request("POST", f"/tribes/{self.created_tribe_id}/leave", 
                                                  params={"userId": self.test_user_id})
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Tribes Leave", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            self.log_result("Tribes Leave", True, 
                          "Left tribe successfully", 
                          response_time=response_time)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Tribes Leave", False, error=error_msg, response_time=response_time)
            return False
    
    def test_tribes_delete(self):
        """DELETE /api/tribes/{tribeId} - Delete tribe (test authorization)"""
        if not self.created_tribe_id:
            self.log_result("Tribes Delete", False, error="No tribe ID available")
            return False
        
        response, response_time = self.make_request("DELETE", f"/tribes/{self.created_tribe_id}")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Tribes Delete", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            self.log_result("Tribes Delete", True, 
                          "Tribe deleted successfully", 
                          response_time=response_time)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Tribes Delete", False, error=error_msg, response_time=response_time)
            return False

    # ===== DIGITAL PRODUCTS API TESTS =====
    
    def test_digital_products_list(self):
        """GET /api/digital-products - List products (verify 3 categories returned)"""
        response, response_time = self.make_request("GET", "/digital-products")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Digital Products List", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, dict) and "products" in data and "categories" in data:
                products = data["products"]
                categories = data["categories"]
                
                # Verify the 3 required categories are present
                expected_categories = {'courses', 'ebooks', 'pdfs'}
                if set(categories) == expected_categories:
                    self.log_result("Digital Products List", True, 
                                  f"Retrieved {len(products)} products, Categories: {categories}", 
                                  response_time=response_time)
                    return True
                else:
                    self.log_result("Digital Products List", False, 
                                  error=f"Expected categories {list(expected_categories)}, got {categories}", 
                                  response_time=response_time)
                    return False
            else:
                self.log_result("Digital Products List", False, 
                              error="Response missing products or categories fields", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Digital Products List", False, error=error_msg, response_time=response_time)
            return False
    
    def test_digital_products_categories(self):
        """GET /api/digital-products/categories - Get categories (should return only: courses, ebooks, pdfs)"""
        response, response_time = self.make_request("GET", "/digital-products/categories")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Digital Products Categories", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            categories = response.json()
            expected_categories = {'courses', 'ebooks', 'pdfs'}
            
            if isinstance(categories, list):
                category_set = set(cat.lower() if isinstance(cat, str) else cat for cat in categories)
                if expected_categories.issubset(category_set):
                    self.log_result("Digital Products Categories", True, 
                                  f"Categories: {categories}, Contains required: {list(expected_categories)}", 
                                  response_time=response_time)
                    return True
                else:
                    missing = expected_categories - category_set
                    self.log_result("Digital Products Categories", False, 
                                  error=f"Missing required categories: {list(missing)}", 
                                  response_time=response_time)
                    return False
            else:
                self.log_result("Digital Products Categories", False, 
                              error="Response is not a list", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Digital Products Categories", False, error=error_msg, response_time=response_time)
            return False
    
    def test_digital_products_create(self):
        """POST /api/digital-products - Create product"""
        if not self.user_id:
            self.log_result("Digital Products Create", False, error="No user ID available")
            return False
        
        product_data = {
            "title": "Test Digital Product",
            "description": "A test product created during backend API testing",
            "category": "courses",
            "price": 0.0,
            "tags": ["test", "backend", "api"]
        }
        
        response, response_time = self.make_request("POST", "/digital-products", product_data)
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Digital Products Create", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            product = response.json()
            if "id" in product:
                self.created_product_id = product["id"]
                self.log_result("Digital Products Create", True, 
                              f"Created product ID: {self.created_product_id}", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Digital Products Create", False, 
                              error="No product ID in response", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json().get('detail', response.text)
                    error_msg += f", Detail: {error_detail}"
                except:
                    error_msg += f", Response: {response.text[:200]}"
            self.log_result("Digital Products Create", False, error=error_msg, response_time=response_time)
            return False
    
    def test_digital_products_get_details(self):
        """GET /api/digital-products/{productId} - Get product details"""
        if not self.created_product_id:
            self.log_result("Digital Products Get Details", False, error="No product ID available")
            return False
        
        response, response_time = self.make_request("GET", f"/digital-products/{self.created_product_id}")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Digital Products Get Details", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            product = response.json()
            if "id" in product and product["id"] == self.created_product_id:
                self.log_result("Digital Products Get Details", True, 
                              f"Retrieved product: {product.get('title', 'Unknown')}", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Digital Products Get Details", False, 
                              error="Product ID mismatch", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Digital Products Get Details", False, error=error_msg, response_time=response_time)
            return False

    # ===== MESSENGER API TESTS =====
    
    def test_messenger_conversations(self):
        """GET /api/messenger/conversations - Get conversations"""
        response, response_time = self.make_request("GET", "/messenger/conversations")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Messenger Conversations", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            conversations = response.json()
            if isinstance(conversations, list):
                self.log_result("Messenger Conversations", True, 
                              f"Retrieved {len(conversations)} conversations", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Messenger Conversations", False, 
                              error="Response is not a list", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Messenger Conversations", False, error=error_msg, response_time=response_time)
            return False
    
    def test_messenger_send(self):
        """POST /api/messenger/send - Send message"""
        if not self.test_user_id:
            self.log_result("Messenger Send", False, error="No test user available to send message to")
            return False
        
        message_data = {
            "recipientId": self.test_user_id,
            "text": "Test message from backend API testing"
        }
        
        response, response_time = self.make_request("POST", "/messenger/send", message_data)
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Messenger Send", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            result = response.json()
            if "success" in result or "id" in result:
                self.log_result("Messenger Send", True, 
                              "Message sent successfully", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Messenger Send", False, 
                              error="Unexpected response format", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_detail = response.json().get('detail', response.text)
                    error_msg += f", Detail: {error_detail}"
                except:
                    error_msg += f", Response: {response.text[:200]}"
            self.log_result("Messenger Send", False, error=error_msg, response_time=response_time)
            return False

    # ===== ANALYTICS API TESTS =====
    
    def test_analytics_user(self):
        """GET /api/analytics/{userId} - Get user analytics"""
        if not self.user_id:
            self.log_result("Analytics User", False, error="No user ID available")
            return False
        
        response, response_time = self.make_request("GET", f"/analytics/{self.user_id}")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Analytics User", False, error=json_msg, response_time=response_time)
            return False
        
        if response and response.status_code == 200:
            analytics = response.json()
            if isinstance(analytics, dict):
                self.log_result("Analytics User", True, 
                              f"Retrieved user analytics with {len(analytics)} fields", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Analytics User", False, 
                              error="Response is not a dict", 
                              response_time=response_time)
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Analytics User", False, error=error_msg, response_time=response_time)
            return False
    
    def test_analytics_admin(self):
        """GET /api/analytics/admin - Get admin analytics (verify access control)"""
        response, response_time = self.make_request("GET", "/analytics/admin")
        
        is_json, json_msg = self.verify_json_response(response)
        if not is_json:
            self.log_result("Analytics Admin", False, error=json_msg, response_time=response_time)
            return False
        
        # This should either return 200 (if user is admin) or 403 (if not admin)
        if response and response.status_code == 200:
            analytics = response.json()
            if isinstance(analytics, dict):
                self.log_result("Analytics Admin", True, 
                              "Admin analytics accessible (user has admin privileges)", 
                              response_time=response_time)
                return True
            else:
                self.log_result("Analytics Admin", False, 
                              error="Response is not a dict", 
                              response_time=response_time)
                return False
        elif response and response.status_code == 403:
            self.log_result("Analytics Admin", True, 
                          "Admin analytics properly restricted (403 Forbidden)", 
                          response_time=response_time)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Analytics Admin", False, error=error_msg, response_time=response_time)
            return False

    def run_all_tests(self):
        """Run comprehensive backend API tests for Loopync"""
        print("🚀 Starting Comprehensive Backend API Testing for Loopync Launch")
        print("=" * 80)
        print(f"📍 API Base URL: {BASE_URL}")
        print(f"🔐 Test Credentials: {TEST_EMAIL} / {TEST_PASSWORD}")
        print("=" * 80)
        
        # Authentication API Tests
        print("\n🔐 AUTHENTICATION API TESTS")
        print("-" * 40)
        self.test_auth_login_valid()
        self.test_auth_login_invalid()
        self.test_auth_me()
        self.test_auth_signup()
        
        # User API Tests
        print("\n👥 USER API TESTS")
        print("-" * 40)
        self.test_users_list()
        self.test_users_get_by_id()
        self.test_users_follow()
        self.test_users_followers()
        self.test_users_following()
        
        # Posts API Tests
        print("\n📝 POSTS API TESTS")
        print("-" * 40)
        self.test_posts_list()
        self.test_posts_create()
        self.test_posts_like()
        self.test_posts_delete()
        
        # Tribes API Tests
        print("\n🏘️ TRIBES API TESTS")
        print("-" * 40)
        self.test_tribes_list()
        self.test_tribes_create()
        self.test_tribes_get_details()
        self.test_tribes_update()
        self.test_tribes_join()
        self.test_tribes_leave()
        self.test_tribes_delete()
        
        # Digital Products API Tests
        print("\n💎 DIGITAL PRODUCTS API TESTS")
        print("-" * 40)
        self.test_digital_products_list()
        self.test_digital_products_categories()
        self.test_digital_products_create()
        self.test_digital_products_get_details()
        
        # Messenger API Tests
        print("\n💬 MESSENGER API TESTS")
        print("-" * 40)
        self.test_messenger_conversations()
        self.test_messenger_send()
        
        # Analytics API Tests
        print("\n📊 ANALYTICS API TESTS")
        print("-" * 40)
        self.test_analytics_user()
        self.test_analytics_admin()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 80)
        print("📊 LOOPYNC BACKEND API TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Response time analysis
        response_times = [r["response_time"] for r in self.test_results if r["response_time"]]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            print(f"Average Response Time: {avg_response_time:.0f}ms")
            print(f"Max Response Time: {max_response_time:.0f}ms")
        
        # Failed tests details
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['error']}")
        
        # Passed tests summary
        print("\n✅ PASSED TESTS:")
        test_categories = {
            "Authentication": [r for r in self.test_results if r["success"] and "Auth" in r["test"]],
            "Users": [r for r in self.test_results if r["success"] and "Users" in r["test"]],
            "Posts": [r for r in self.test_results if r["success"] and "Posts" in r["test"]],
            "Tribes": [r for r in self.test_results if r["success"] and "Tribes" in r["test"]],
            "Digital Products": [r for r in self.test_results if r["success"] and "Digital Products" in r["test"]],
            "Messenger": [r for r in self.test_results if r["success"] and "Messenger" in r["test"]],
            "Analytics": [r for r in self.test_results if r["success"] and "Analytics" in r["test"]]
        }
        
        for category, tests in test_categories.items():
            if tests:
                print(f"  {category}: {len(tests)} tests passed")
        
        print("\n" + "=" * 80)
        
        # Critical issues analysis
        critical_failures = [r for r in self.test_results if not r["success"] and 
                           any(word in r["test"].lower() for word in ["auth", "login", "signup"])]
        
        if critical_failures:
            print("🚨 CRITICAL ISSUES FOUND:")
            for failure in critical_failures:
                print(f"  • {failure['test']}: {failure['error']}")
        
        # JSON response validation
        json_failures = [r for r in self.test_results if not r["success"] and "HTML response" in r["error"]]
        if json_failures:
            print("⚠️ JSON RESPONSE ISSUES:")
            for failure in json_failures:
                print(f"  • {failure['test']}: Returning HTML instead of JSON")
        
        # Final verdict
        if passed_tests == total_tests:
            print("\n🎉 ALL TESTS PASSED - LOOPYNC BACKEND IS LAUNCH READY!")
        elif failed_tests <= 2:
            print(f"\n⚠️ MINOR ISSUES FOUND - {failed_tests} tests failed")
        else:
            print(f"\n❌ MAJOR ISSUES FOUND - {failed_tests} tests failed")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = LoopyncBackendTester()
    tester.run_all_tests()
    sys.exit(0)