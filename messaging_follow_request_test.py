#!/usr/bin/env python3
"""
Messaging and Follow Request System Backend Testing

**Test Focus:**
- User Search API
- Messenger Start Conversation (with non-followers)
- Message Requests API
- Accept/Reject Message Requests
- Follow Request APIs

**Test Credentials:**
- User 1: test@test.com / testpassword123
- User 2: Created dynamically for testing

**Backend URL:** https://vibe-capsule.preview.emergentagent.com/api
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "https://vibe-capsule.preview.emergentagent.com/api"
TEST_USER_EMAIL = "test@test.com"
TEST_USER_PASSWORD = "testpassword123"
TEST_USER_2_EMAIL = f"testuser2_{int(time.time())}@test.com"
TEST_USER_2_PASSWORD = "testpassword123"

class MessagingFollowRequestTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user_token = None
        self.test_user_id = None
        self.test_user_2_token = None
        self.test_user_2_id = None
        self.test_results = []
        self.created_thread_id = None
        self.created_follow_request_id = None
        
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
    
    def make_request(self, method, endpoint, data=None, headers=None, files=None, params=None, token=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        # Add auth header
        if token and headers is None:
            headers = {"Authorization": f"Bearer {token}"}
        elif token and headers:
            headers["Authorization"] = f"Bearer {token}"
        
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
            self.log(f"Request error: {e}", "ERROR")
            return None
    
    def test_user_authentication(self):
        """Test authentication for both test users"""
        # Test User 1 Login
        response = self.make_request("POST", "/auth/login", {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.test_user_token = result["token"]
                self.test_user_id = result["user"]["id"]
                self.log_result("Test User 1 Login", True, f"User ID: {self.test_user_id}")
            else:
                self.log_result("Test User 1 Login", False, error="Invalid login response")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Test User 1 Login", False, error=error_msg)
            return False
        
        # Create Test User 2
        user2_data = {
            "email": TEST_USER_2_EMAIL,
            "password": TEST_USER_2_PASSWORD,
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
    
    def test_user_search_api(self):
        """Test User Search API - GET /api/users/search?q=admin&limit=10"""
        response = self.make_request("GET", "/users/search", 
                                   params={"q": "testuser2", "limit": 10}, 
                                   token=self.test_user_token)
        
        if response and response.status_code == 200:
            users = response.json()
            if isinstance(users, list):
                user2_found = any(user.get("email") == TEST_USER_2_EMAIL for user in users)
                if user2_found:
                    self.log_result("User Search API", True, f"Found {len(users)} users, test user 2 found")
                else:
                    self.log_result("User Search API", True, f"Found {len(users)} users, test user 2 not in results")
                return True
            else:
                self.log_result("User Search API", False, error="Invalid response format")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("User Search API", False, error=error_msg)
            return False
    
    def test_messenger_start_conversation(self):
        """Test Messenger Start Conversation - POST /api/messenger/start"""
        if not self.test_user_2_id:
            self.log_result("Messenger Start Conversation", False, error="Test User 2 ID not available")
            return False
        
        response = self.make_request("POST", "/messenger/start", 
                                   params={"userId": self.test_user_id, "friendId": self.test_user_2_id},
                                   token=self.test_user_token)
        
        if response and response.status_code == 200:
            result = response.json()
            if "threadId" in result:
                self.created_thread_id = result["threadId"]
                is_request = result.get("isRequest", False)
                self.log_result("Messenger Start Conversation", True, 
                              f"Thread ID: {self.created_thread_id}, isRequest: {is_request}")
                return True
            else:
                self.log_result("Messenger Start Conversation", False, error="No threadId in response")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Messenger Start Conversation", False, error=error_msg)
            return False
    
    def test_message_requests_api(self):
        """Test Message Requests API - GET /api/messenger/requests"""
        # Test from test user 2 perspective (should see request from test user 1)
        response = self.make_request("GET", "/messenger/requests", 
                                   params={"userId": self.test_user_2_id},
                                   token=self.test_user_2_token)
        
        if response and response.status_code == 200:
            requests_data = response.json()
            if isinstance(requests_data, list):
                self.log_result("Message Requests API", True, f"Found {len(requests_data)} message requests")
                return True
            else:
                self.log_result("Message Requests API", False, error="Invalid response format")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Message Requests API", False, error=error_msg)
            return False
    
    def test_accept_message_request(self):
        """Test Accept Message Request - POST /api/messenger/requests/{threadId}/accept"""
        if not self.created_thread_id:
            self.log_result("Accept Message Request", False, error="No thread ID available")
            return False
        
        response = self.make_request("POST", f"/messenger/requests/{self.created_thread_id}/accept",
                                   params={"userId": self.test_user_2_id},
                                   token=self.test_user_2_token)
        
        if response and response.status_code == 200:
            result = response.json()
            self.log_result("Accept Message Request", True, "Message request accepted successfully")
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Accept Message Request", False, error=error_msg)
            return False
    
    def test_reject_message_request(self):
        """Test Reject Message Request - POST /api/messenger/requests/{threadId}/reject"""
        # Create another conversation to test rejection
        response = self.make_request("POST", "/messenger/start", 
                                   params={"userId": self.test_user_2_id, "friendId": self.test_user_id},
                                   token=self.test_user_2_token)
        
        if response and response.status_code == 200:
            result = response.json()
            thread_id = result.get("threadId")
            
            if thread_id:
                # Now reject this request from test user 1 perspective
                response = self.make_request("POST", f"/messenger/requests/{thread_id}/reject",
                                           params={"userId": self.test_user_id},
                                           token=self.test_user_token)
                
                if response and response.status_code == 200:
                    self.log_result("Reject Message Request", True, "Message request rejected successfully")
                    return True
                else:
                    error_msg = f"Status: {response.status_code if response else 'No response'}"
                    if response:
                        error_msg += f", Response: {response.text}"
                    self.log_result("Reject Message Request", False, error=error_msg)
                    return False
            else:
                self.log_result("Reject Message Request", False, error="Failed to create test thread")
                return False
        else:
            self.log_result("Reject Message Request", False, error="Failed to create test conversation")
            return False
    
    def test_send_follow_request(self):
        """Test Send Follow Request - POST /api/users/{userId}/follow-request"""
        response = self.make_request("POST", f"/users/{self.test_user_2_id}/follow-request",
                                   params={"fromUserId": self.test_user_id},
                                   token=self.test_user_token)
        
        if response and response.status_code == 200:
            result = response.json()
            if "id" in result:
                self.created_follow_request_id = result["id"]
                self.log_result("Send Follow Request", True, f"Follow request ID: {self.created_follow_request_id}")
                return True
            else:
                self.log_result("Send Follow Request", True, "Follow request sent successfully")
                return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Send Follow Request", False, error=error_msg)
            return False
    
    def test_get_follow_requests(self):
        """Test Get Follow Requests - GET /api/users/{userId}/follow-requests"""
        response = self.make_request("GET", f"/users/{self.admin_id}/follow-requests",
                                   token=self.admin_token)
        
        if response and response.status_code == 200:
            follow_requests = response.json()
            if isinstance(follow_requests, list):
                self.log_result("Get Follow Requests", True, f"Found {len(follow_requests)} follow requests")
                return True
            else:
                self.log_result("Get Follow Requests", False, error="Invalid response format")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Get Follow Requests", False, error=error_msg)
            return False
    
    def test_accept_follow_request(self):
        """Test Accept Follow Request - POST /api/follow-requests/{requestId}/accept"""
        if not self.created_follow_request_id:
            # Try to find a follow request to accept
            response = self.make_request("GET", f"/users/{self.admin_id}/follow-requests",
                                       token=self.admin_token)
            
            if response and response.status_code == 200:
                follow_requests = response.json()
                if follow_requests and len(follow_requests) > 0:
                    self.created_follow_request_id = follow_requests[0].get("id")
        
        if not self.created_follow_request_id:
            self.log_result("Accept Follow Request", False, error="No follow request ID available")
            return False
        
        response = self.make_request("POST", f"/follow-requests/{self.created_follow_request_id}/accept",
                                   params={"userId": self.admin_id},
                                   token=self.admin_token)
        
        if response and response.status_code == 200:
            self.log_result("Accept Follow Request", True, "Follow request accepted successfully")
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Accept Follow Request", False, error=error_msg)
            return False
    
    def test_reject_follow_request(self):
        """Test Reject Follow Request - POST /api/follow-requests/{requestId}/reject"""
        # Create another follow request to test rejection
        response = self.make_request("POST", f"/users/{self.test_user_id}/follow-request",
                                   params={"fromUserId": self.admin_id},
                                   token=self.admin_token)
        
        if response and response.status_code == 200:
            result = response.json()
            request_id = result.get("id")
            
            if request_id:
                # Now reject this request
                response = self.make_request("POST", f"/follow-requests/{request_id}/reject",
                                           params={"userId": self.test_user_id},
                                           token=self.test_user_token)
                
                if response and response.status_code == 200:
                    self.log_result("Reject Follow Request", True, "Follow request rejected successfully")
                    return True
                else:
                    error_msg = f"Status: {response.status_code if response else 'No response'}"
                    if response:
                        error_msg += f", Response: {response.text}"
                    self.log_result("Reject Follow Request", False, error=error_msg)
                    return False
            else:
                self.log_result("Reject Follow Request", False, error="No request ID in response")
                return False
        else:
            self.log_result("Reject Follow Request", False, error="Failed to create test follow request")
            return False
    
    def run_all_tests(self):
        """Run all messaging and follow request tests"""
        print("🚀 Starting Messaging and Follow Request System Testing")
        print("=" * 80)
        print(f"📍 API Base URL: {BASE_URL}")
        print(f"👤 Test User: {TEST_USER_EMAIL}")
        print(f"👑 Admin User: {ADMIN_EMAIL}")
        print("=" * 80)
        
        # Authentication first
        if not self.test_user_authentication():
            print("❌ Authentication failed. Stopping tests.")
            return False
        
        # Run all tests
        self.test_user_search_api()
        self.test_messenger_start_conversation()
        self.test_message_requests_api()
        self.test_accept_message_request()
        self.test_reject_message_request()
        self.test_send_follow_request()
        self.test_get_follow_requests()
        self.test_accept_follow_request()
        self.test_reject_follow_request()
        
        # Print summary
        self.print_summary()
        
        # Return success status
        passed_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        return passed_tests == total_tests
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 MESSAGING & FOLLOW REQUEST TESTING SUMMARY")
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
        
        if passed_tests == total_tests:
            print("\n🎉 ALL MESSAGING & FOLLOW REQUEST TESTS PASSED!")
        elif failed_tests <= 2:
            print(f"\n⚠️ MINOR ISSUES FOUND - {failed_tests} tests failed")
        else:
            print(f"\n❌ MAJOR ISSUES FOUND - {failed_tests} tests failed")

if __name__ == "__main__":
    tester = MessagingFollowRequestTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)