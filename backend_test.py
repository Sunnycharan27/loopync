#!/usr/bin/env python3
"""
Comprehensive Pre-Deployment Testing for Loopync Social Media Platform
Testing all critical backend APIs as specified in the review request
"""

import requests
import json
import sys
from datetime import datetime

class LoopyncAPITester:
    def __init__(self):
        # Get backend URL from frontend .env
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip() + '/api'
                    break
        
        print(f"🔗 Testing Backend URL: {self.base_url}")
        
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        
        # Test credentials from review request
        self.test_user = {
            "email": "test@test.com",
            "password": "testpassword123"
        }
        
        self.admin_user = {
            "email": "admin@loopync.com", 
            "password": "testpassword123"
        }

    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        status = "✅ PASSED" if success else "❌ FAILED"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")

    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Add auth header if token available
        if self.auth_token and headers is None:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
        elif self.auth_token and headers:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers, timeout=30)
            else:
                return None, f"Unsupported method: {method}"
            
            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)

    def test_authentication_apis(self):
        """Test Authentication APIs"""
        print("\n🔐 Testing Authentication APIs...")
        
        # Test 1: Login with test user
        response, error = self.make_request('POST', '/auth/login', self.test_user)
        if error:
            self.log_result("POST /api/auth/login", False, f"Request failed: {error}")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'token' in data and 'user' in data:
                self.auth_token = data['token']
                self.user_id = data['user']['id']
                self.log_result("POST /api/auth/login", True, f"Login successful, User ID: {self.user_id}")
            else:
                self.log_result("POST /api/auth/login", False, "Missing token or user in response", data)
                return False
        else:
            self.log_result("POST /api/auth/login", False, f"HTTP {response.status_code}", response.text)
            return False
        
        # Test 2: Get current user
        response, error = self.make_request('GET', '/auth/me')
        if error:
            self.log_result("GET /api/auth/me", False, f"Request failed: {error}")
        elif response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/auth/me", True, f"Current user: {data.get('name', 'Unknown')}")
        else:
            self.log_result("GET /api/auth/me", False, f"HTTP {response.status_code}", response.text)
        
        # Test 3: Signup with unique email (optional test)
        unique_email = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com"
        signup_data = {
            "email": unique_email,
            "password": "testpassword123",
            "name": "Test User",
            "handle": f"testuser_{datetime.now().strftime('%H%M%S')}"
        }
        
        response, error = self.make_request('POST', '/auth/signup', signup_data)
        if error:
            self.log_result("POST /api/auth/signup", False, f"Request failed: {error}")
        elif response.status_code == 200:
            data = response.json()
            self.log_result("POST /api/auth/signup", True, f"Signup successful for {unique_email}")
        else:
            self.log_result("POST /api/auth/signup", False, f"HTTP {response.status_code}", response.text)
        
        return True

    def test_user_apis(self):
        """Test User APIs"""
        print("\n👥 Testing User APIs...")
        
        # Test 1: Search users
        response, error = self.make_request('GET', '/users/search?q=test')
        if error:
            self.log_result("GET /api/users/search?q=test", False, f"Request failed: {error}")
        elif response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/users/search?q=test", True, f"Found {len(data)} users")
        else:
            self.log_result("GET /api/users/search?q=test", False, f"HTTP {response.status_code}", response.text)
        
        # Test 2: Get user profile
        if self.user_id:
            response, error = self.make_request('GET', f'/users/{self.user_id}')
            if error:
                self.log_result(f"GET /api/users/{self.user_id}", False, f"Request failed: {error}")
            elif response.status_code == 200:
                data = response.json()
                self.log_result(f"GET /api/users/{self.user_id}", True, f"User profile: {data.get('name', 'Unknown')}")
            else:
                self.log_result(f"GET /api/users/{self.user_id}", False, f"HTTP {response.status_code}", response.text)
        
        # Test 3: Get follow requests
        if self.user_id:
            response, error = self.make_request('GET', f'/users/{self.user_id}/follow-requests')
            if error:
                self.log_result(f"GET /api/users/{self.user_id}/follow-requests", False, f"Request failed: {error}")
            elif response.status_code == 200:
                data = response.json()
                self.log_result(f"GET /api/users/{self.user_id}/follow-requests", True, f"Follow requests: {len(data) if isinstance(data, list) else 'N/A'}")
            else:
                self.log_result(f"GET /api/users/{self.user_id}/follow-requests", False, f"HTTP {response.status_code}", response.text)
        
        # Test 4: Send follow request (find another user first)
        response, error = self.make_request('GET', '/users/search?q=admin')
        if not error and response.status_code == 200:
            users = response.json()
            if users and len(users) > 0:
                target_user_id = users[0]['id']
                if target_user_id != self.user_id:
                    response, error = self.make_request('POST', f'/users/{target_user_id}/follow-request?fromUserId={self.user_id}')
                    if error:
                        self.log_result(f"POST /api/users/{target_user_id}/follow-request", False, f"Request failed: {error}")
                    elif response.status_code in [200, 201]:
                        self.log_result(f"POST /api/users/{target_user_id}/follow-request", True, "Follow request sent")
                    else:
                        self.log_result(f"POST /api/users/{target_user_id}/follow-request", False, f"HTTP {response.status_code}", response.text)

    def test_messenger_apis(self):
        """Test Messenger APIs"""
        print("\n💬 Testing Messenger APIs...")
        
        # Test 1: Get message threads
        if self.user_id:
            response, error = self.make_request('GET', f'/messenger/threads?userId={self.user_id}')
            if error:
                self.log_result(f"GET /api/messenger/threads?userId={self.user_id}", False, f"Request failed: {error}")
            elif response.status_code == 200:
                data = response.json()
                self.log_result(f"GET /api/messenger/threads?userId={self.user_id}", True, f"Message threads: {len(data) if isinstance(data, list) else 'N/A'}")
            else:
                self.log_result(f"GET /api/messenger/threads?userId={self.user_id}", False, f"HTTP {response.status_code}", response.text)
        
        # Test 2: Get message requests
        if self.user_id:
            response, error = self.make_request('GET', f'/messenger/requests?userId={self.user_id}')
            if error:
                self.log_result(f"GET /api/messenger/requests?userId={self.user_id}", False, f"Request failed: {error}")
            elif response.status_code == 200:
                data = response.json()
                self.log_result(f"GET /api/messenger/requests?userId={self.user_id}", True, f"Message requests: {len(data) if isinstance(data, list) else 'N/A'}")
            else:
                self.log_result(f"GET /api/messenger/requests?userId={self.user_id}", False, f"HTTP {response.status_code}", response.text)
        
        # Test 3: Start conversation (find another user first)
        response, error = self.make_request('GET', '/users/search?q=admin')
        if not error and response.status_code == 200:
            users = response.json()
            if users and len(users) > 0:
                friend_id = users[0]['id']
                if friend_id != self.user_id:
                    response, error = self.make_request('POST', f'/messenger/start?userId={self.user_id}&friendId={friend_id}')
                    if error:
                        self.log_result(f"POST /api/messenger/start?userId={self.user_id}&friendId={friend_id}", False, f"Request failed: {error}")
                    elif response.status_code in [200, 201]:
                        data = response.json()
                        self.log_result(f"POST /api/messenger/start?userId={self.user_id}&friendId={friend_id}", True, f"Conversation started: {data.get('threadId', 'N/A')}")
                        
                        # Test 4: Send a message
                        thread_id = data.get('threadId')
                        if thread_id:
                            message_data = {
                                "text": "Hello! This is a test message from the backend testing suite.",
                                "threadId": thread_id,
                                "fromId": self.user_id,
                                "toId": friend_id
                            }
                            response, error = self.make_request('POST', '/messenger/send', message_data)
                            if error:
                                self.log_result("POST /api/messenger/send", False, f"Request failed: {error}")
                            elif response.status_code in [200, 201]:
                                self.log_result("POST /api/messenger/send", True, "Message sent successfully")
                            else:
                                self.log_result("POST /api/messenger/send", False, f"HTTP {response.status_code}", response.text)
                    else:
                        self.log_result(f"POST /api/messenger/start?userId={self.user_id}&friendId={friend_id}", False, f"HTTP {response.status_code}", response.text)

    def test_posts_feed_apis(self):
        """Test Posts/Feed APIs"""
        print("\n📝 Testing Posts/Feed APIs...")
        
        # Test 1: Get feed posts
        response, error = self.make_request('GET', '/posts')
        if error:
            self.log_result("GET /api/posts", False, f"Request failed: {error}")
        elif response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/posts", True, f"Feed posts: {len(data) if isinstance(data, list) else 'N/A'}")
        else:
            self.log_result("GET /api/posts", False, f"HTTP {response.status_code}", response.text)
        
        # Test 2: Create a post
        post_data = {
            "text": "This is a test post from the backend testing suite! 🚀 #testing #loopync",
            "audience": "public"
        }
        
        response, error = self.make_request('POST', '/posts', post_data)
        if error:
            self.log_result("POST /api/posts", False, f"Request failed: {error}")
        elif response.status_code in [200, 201]:
            data = response.json()
            post_id = data.get('id')
            self.log_result("POST /api/posts", True, f"Post created: {post_id}")
            
            # Test 3: Get single post
            if post_id:
                response, error = self.make_request('GET', f'/posts/{post_id}')
                if error:
                    self.log_result(f"GET /api/posts/{post_id}", False, f"Request failed: {error}")
                elif response.status_code == 200:
                    data = response.json()
                    self.log_result(f"GET /api/posts/{post_id}", True, f"Post retrieved: {data.get('text', 'N/A')[:50]}...")
                else:
                    self.log_result(f"GET /api/posts/{post_id}", False, f"HTTP {response.status_code}", response.text)
        else:
            self.log_result("POST /api/posts", False, f"HTTP {response.status_code}", response.text)

    def test_tribes_apis(self):
        """Test Tribes APIs"""
        print("\n🏛️ Testing Tribes APIs...")
        
        # Test 1: Get all tribes
        response, error = self.make_request('GET', '/tribes')
        if error:
            self.log_result("GET /api/tribes", False, f"Request failed: {error}")
        elif response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/tribes", True, f"Tribes found: {len(data) if isinstance(data, list) else 'N/A'}")
            
            # Test 2: Get tribe details (if tribes exist)
            if isinstance(data, list) and len(data) > 0:
                tribe_id = data[0].get('id')
                if tribe_id:
                    response, error = self.make_request('GET', f'/tribes/{tribe_id}')
                    if error:
                        self.log_result(f"GET /api/tribes/{tribe_id}", False, f"Request failed: {error}")
                    elif response.status_code == 200:
                        tribe_data = response.json()
                        self.log_result(f"GET /api/tribes/{tribe_id}", True, f"Tribe details: {tribe_data.get('name', 'N/A')}")
                        
                        # Test 3: Join tribe
                        if self.user_id:
                            response, error = self.make_request('POST', f'/tribes/{tribe_id}/join?userId={self.user_id}')
                            if error:
                                self.log_result(f"POST /api/tribes/{tribe_id}/join?userId={self.user_id}", False, f"Request failed: {error}")
                            elif response.status_code in [200, 201]:
                                self.log_result(f"POST /api/tribes/{tribe_id}/join?userId={self.user_id}", True, "Joined tribe successfully")
                            else:
                                self.log_result(f"POST /api/tribes/{tribe_id}/join?userId={self.user_id}", False, f"HTTP {response.status_code}", response.text)
                    else:
                        self.log_result(f"GET /api/tribes/{tribe_id}", False, f"HTTP {response.status_code}", response.text)
        else:
            self.log_result("GET /api/tribes", False, f"HTTP {response.status_code}", response.text)

    def test_rooms_apis(self):
        """Test Rooms/VibeRooms APIs"""
        print("\n🎤 Testing Rooms/VibeRooms APIs...")
        
        # Test 1: Get all rooms
        response, error = self.make_request('GET', '/rooms')
        if error:
            self.log_result("GET /api/rooms", False, f"Request failed: {error}")
        elif response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/rooms", True, f"Rooms found: {len(data) if isinstance(data, list) else 'N/A'}")
        else:
            self.log_result("GET /api/rooms", False, f"HTTP {response.status_code}", response.text)
        
        # Test 2: Create a room
        room_data = {
            "name": "Backend Testing Room",
            "description": "A test room created by the backend testing suite",
            "category": "tech",
            "isPrivate": False,
            "tags": ["testing", "backend", "api"]
        }
        
        response, error = self.make_request('POST', '/rooms', room_data)
        if error:
            self.log_result("POST /api/rooms", False, f"Request failed: {error}")
        elif response.status_code in [200, 201]:
            data = response.json()
            self.log_result("POST /api/rooms", True, f"Room created: {data.get('id', 'N/A')}")
        else:
            self.log_result("POST /api/rooms", False, f"HTTP {response.status_code}", response.text)

    def test_notifications_api(self):
        """Test Notifications API"""
        print("\n🔔 Testing Notifications API...")
        
        # Test 1: Get user notifications
        if self.user_id:
            response, error = self.make_request('GET', f'/notifications/{self.user_id}')
            if error:
                self.log_result(f"GET /api/notifications/{self.user_id}", False, f"Request failed: {error}")
            elif response.status_code == 200:
                data = response.json()
                self.log_result(f"GET /api/notifications/{self.user_id}", True, f"Notifications: {len(data) if isinstance(data, list) else 'N/A'}")
            else:
                self.log_result(f"GET /api/notifications/{self.user_id}", False, f"HTTP {response.status_code}", response.text)

    def test_music_api(self):
        """Test Music API"""
        print("\n🎵 Testing Music API...")
        
        # Test 1: Search music
        response, error = self.make_request('GET', '/music/search?q=love&limit=5')
        if error:
            self.log_result("GET /api/music/search?q=love&limit=5", False, f"Request failed: {error}")
        elif response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/music/search?q=love&limit=5", True, f"Music search results: {len(data) if isinstance(data, list) else 'N/A'}")
        else:
            self.log_result("GET /api/music/search?q=love&limit=5", False, f"HTTP {response.status_code}", response.text)
        
        # Test 2: Get trending music
        response, error = self.make_request('GET', '/music/trending')
        if error:
            self.log_result("GET /api/music/trending", False, f"Request failed: {error}")
        elif response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/music/trending", True, f"Trending music: {len(data) if isinstance(data, list) else 'N/A'}")
        else:
            self.log_result("GET /api/music/trending", False, f"HTTP {response.status_code}", response.text)

    def test_stories_capsules_api(self):
        """Test Stories/Capsules API"""
        print("\n📸 Testing Stories/Capsules API...")
        
        # Test 1: Get stories/capsules
        response, error = self.make_request('GET', '/capsules')
        if error:
            self.log_result("GET /api/capsules", False, f"Request failed: {error}")
        elif response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/capsules", True, f"Stories/Capsules: {len(data) if isinstance(data, list) else 'N/A'}")
        else:
            self.log_result("GET /api/capsules", False, f"HTTP {response.status_code}", response.text)

    def test_internships_api(self):
        """Test Internships API"""
        print("\n💼 Testing Internships API...")
        
        # Test 1: Get internships
        response, error = self.make_request('GET', '/internships')
        if error:
            self.log_result("GET /api/internships", False, f"Request failed: {error}")
        elif response.status_code == 200:
            data = response.json()
            self.log_result("GET /api/internships", True, f"Internships: {len(data) if isinstance(data, list) else 'N/A'}")
        else:
            self.log_result("GET /api/internships", False, f"HTTP {response.status_code}", response.text)
        
        # Test 2: Create internship
        internship_data = {
            "title": "Backend Developer Intern",
            "company": "Test Company",
            "description": "A test internship created by the backend testing suite",
            "location": "Remote",
            "duration": "3 months",
            "stipend": "₹15,000/month",
            "skills": ["Python", "FastAPI", "MongoDB"],
            "applicationDeadline": "2024-12-31"
        }
        
        response, error = self.make_request('POST', '/internships', internship_data)
        if error:
            self.log_result("POST /api/internships", False, f"Request failed: {error}")
        elif response.status_code in [200, 201]:
            data = response.json()
            self.log_result("POST /api/internships", True, f"Internship created: {data.get('id', 'N/A')}")
        else:
            self.log_result("POST /api/internships", False, f"HTTP {response.status_code}", response.text)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Comprehensive Pre-Deployment Testing for Loopync Social Media Platform")
        print("=" * 80)
        
        # Run all test suites
        if not self.test_authentication_apis():
            print("❌ Authentication failed - stopping tests")
            return
        
        self.test_user_apis()
        self.test_messenger_apis()
        self.test_posts_feed_apis()
        self.test_tribes_apis()
        self.test_rooms_apis()
        self.test_notifications_api()
        self.test_music_api()
        self.test_stories_capsules_api()
        self.test_internships_api()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['test']}: {result['details']}")
        
        print(f"\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"   - {result['test']}: {result['details']}")
        
        print("\n" + "=" * 80)
        
        # Return success status
        return failed_tests == 0

if __name__ == "__main__":
    tester = LoopyncAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)