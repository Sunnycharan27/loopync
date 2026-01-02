#!/usr/bin/env python3
"""
Followers/Following System Backend Test for Loopync
Tests all follow-related APIs as specified in the review request
"""

import requests
import json
import sys
from datetime import datetime

# Base URL from frontend .env
BASE_URL = "https://loopync-social-4.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials from review request
ADMIN_EMAIL = "loopyncpvt@gmail.com"
ADMIN_PASSWORD = "ramcharan@123"
ADMIN_ID = "30459d73-3e5b-4a5b-90d7-681155f74898"

TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"
TEST_ID = "9f56131e-f35e-441f-939f-918dfb0babdf"

class FollowSystemTester:
    def __init__(self):
        self.admin_token = None
        self.test_token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def login_user(self, email, password):
        """Login and get JWT token"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "email": email,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('token')
                user = data.get('user')
                self.log(f"✅ Login successful for {email}")
                return token, user
            else:
                self.log(f"❌ Login failed for {email}: {response.status_code} - {response.text}", "ERROR")
                return None, None
                
        except Exception as e:
            self.log(f"❌ Login error for {email}: {str(e)}", "ERROR")
            return None, None
    
    def make_authenticated_request(self, method, endpoint, token, data=None):
        """Make authenticated API request"""
        headers = {'Authorization': f'Bearer {token}'}
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(f"{API_BASE}{endpoint}", headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(f"{API_BASE}{endpoint}", headers=headers, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(f"{API_BASE}{endpoint}", headers=headers, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(f"{API_BASE}{endpoint}", headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
            
        except Exception as e:
            self.log(f"❌ Request error: {str(e)}", "ERROR")
            return None
    
    def test_follow_user(self):
        """Test 1: Follow User API"""
        self.log("🧪 Testing Follow User API...")
        
        # Test User follows Admin
        response = self.make_authenticated_request(
            'POST', 
            f'/users/{TEST_ID}/follow',
            self.test_token,
            {"targetUserId": ADMIN_ID}
        )
        
        if response and response.status_code == 200:
            data = response.json()
            required_fields = ['action', 'followingCount', 'followersCount']
            
            if all(field in data for field in required_fields):
                if data['action'] == 'followed':
                    self.log(f"✅ Follow successful: {data}")
                    return True
                else:
                    self.log(f"❌ Unexpected action: {data['action']}", "ERROR")
            else:
                self.log(f"❌ Missing required fields in response: {data}", "ERROR")
        else:
            status = response.status_code if response else "No response"
            text = response.text if response else "No response"
            self.log(f"❌ Follow request failed: {status} - {text}", "ERROR")
        
        return False
    
    def test_get_followers(self):
        """Test 2: Get Followers API"""
        self.log("🧪 Testing Get Followers API...")
        
        # Get Admin's followers (should include Test User after follow)
        response = self.make_authenticated_request(
            'GET',
            f'/users/{ADMIN_ID}/followers',
            self.admin_token
        )
        
        if response and response.status_code == 200:
            data = response.json()
            
            if 'users' in data and 'count' in data:
                users = data['users']
                count = data['count']
                
                # Check if each user has required fields
                required_user_fields = ['id', 'name', 'handle', 'avatar', 'isVerified']
                valid_users = True
                
                for user in users:
                    if not all(field in user for field in required_user_fields):
                        self.log(f"❌ User missing required fields: {user}", "ERROR")
                        valid_users = False
                
                if valid_users:
                    # Check if Test User is in followers
                    test_user_found = any(user['id'] == TEST_ID for user in users)
                    if test_user_found:
                        self.log(f"✅ Followers API working: {count} followers found, Test User included")
                        return True
                    else:
                        self.log(f"❌ Test User not found in followers list", "ERROR")
                else:
                    self.log(f"❌ Invalid user data structure", "ERROR")
            else:
                self.log(f"❌ Missing 'users' or 'count' in response: {data}", "ERROR")
        else:
            status = response.status_code if response else "No response"
            text = response.text if response else "No response"
            self.log(f"❌ Get followers failed: {status} - {text}", "ERROR")
        
        return False
    
    def test_get_following(self):
        """Test 3: Get Following API"""
        self.log("🧪 Testing Get Following API...")
        
        # Get Test User's following (should include Admin after follow)
        response = self.make_authenticated_request(
            'GET',
            f'/users/{TEST_ID}/following',
            self.test_token
        )
        
        if response and response.status_code == 200:
            data = response.json()
            
            if 'users' in data and 'count' in data:
                users = data['users']
                count = data['count']
                
                # Check if each user has required fields
                required_user_fields = ['id', 'name', 'handle', 'avatar', 'isVerified']
                valid_users = True
                
                for user in users:
                    if not all(field in user for field in required_user_fields):
                        self.log(f"❌ User missing required fields: {user}", "ERROR")
                        valid_users = False
                
                if valid_users:
                    # Check if Admin is in following
                    admin_found = any(user['id'] == ADMIN_ID for user in users)
                    if admin_found:
                        self.log(f"✅ Following API working: {count} following found, Admin included")
                        return True
                    else:
                        self.log(f"❌ Admin not found in following list", "ERROR")
                else:
                    self.log(f"❌ Invalid user data structure", "ERROR")
            else:
                self.log(f"❌ Missing 'users' or 'count' in response: {data}", "ERROR")
        else:
            status = response.status_code if response else "No response"
            text = response.text if response else "No response"
            self.log(f"❌ Get following failed: {status} - {text}", "ERROR")
        
        return False
    
    def test_mutual_follow(self):
        """Test 4: Mutual Follow - Admin follows Test User back"""
        self.log("🧪 Testing Mutual Follow...")
        
        # Admin follows Test User
        response = self.make_authenticated_request(
            'POST',
            f'/users/{ADMIN_ID}/follow',
            self.admin_token,
            {"targetUserId": TEST_ID}
        )
        
        if response and response.status_code == 200:
            data = response.json()
            
            if data.get('action') == 'followed':
                self.log(f"✅ Mutual follow successful: {data}")
                
                # Verify both users appear in each other's lists
                # Check Admin's following list
                admin_following = self.make_authenticated_request(
                    'GET',
                    f'/users/{ADMIN_ID}/following',
                    self.admin_token
                )
                
                # Check Test User's followers list
                test_followers = self.make_authenticated_request(
                    'GET',
                    f'/users/{TEST_ID}/followers',
                    self.test_token
                )
                
                if (admin_following and admin_following.status_code == 200 and
                    test_followers and test_followers.status_code == 200):
                    
                    admin_following_data = admin_following.json()
                    test_followers_data = test_followers.json()
                    
                    # Check if Test User is in Admin's following
                    test_in_admin_following = any(
                        user['id'] == TEST_ID 
                        for user in admin_following_data.get('users', [])
                    )
                    
                    # Check if Admin is in Test User's followers
                    admin_in_test_followers = any(
                        user['id'] == ADMIN_ID 
                        for user in test_followers_data.get('users', [])
                    )
                    
                    if test_in_admin_following and admin_in_test_followers:
                        self.log("✅ Mutual follow verification successful")
                        return True
                    else:
                        self.log("❌ Mutual follow verification failed", "ERROR")
                else:
                    self.log("❌ Failed to verify mutual follow", "ERROR")
            else:
                self.log(f"❌ Mutual follow failed: {data}", "ERROR")
        else:
            status = response.status_code if response else "No response"
            text = response.text if response else "No response"
            self.log(f"❌ Mutual follow request failed: {status} - {text}", "ERROR")
        
        return False
    
    def test_unfollow(self):
        """Test 5: Unfollow - Test User unfollows Admin"""
        self.log("🧪 Testing Unfollow...")
        
        # Test User unfollows Admin (same endpoint, should toggle)
        response = self.make_authenticated_request(
            'POST',
            f'/users/{TEST_ID}/follow',
            self.test_token,
            {"targetUserId": ADMIN_ID}
        )
        
        if response and response.status_code == 200:
            data = response.json()
            
            if data.get('action') == 'unfollowed':
                # Verify follower count decreased
                following_count = data.get('followingCount', 0)
                followers_count = data.get('followersCount', 0)
                
                self.log(f"✅ Unfollow successful: {data}")
                
                # Verify Admin is no longer in Test User's following
                test_following = self.make_authenticated_request(
                    'GET',
                    f'/users/{TEST_ID}/following',
                    self.test_token
                )
                
                if test_following and test_following.status_code == 200:
                    following_data = test_following.json()
                    admin_still_followed = any(
                        user['id'] == ADMIN_ID 
                        for user in following_data.get('users', [])
                    )
                    
                    if not admin_still_followed:
                        self.log("✅ Unfollow verification successful - Admin removed from following")
                        return True
                    else:
                        self.log("❌ Unfollow verification failed - Admin still in following", "ERROR")
                else:
                    self.log("❌ Failed to verify unfollow", "ERROR")
            else:
                self.log(f"❌ Expected 'unfollowed' action, got: {data.get('action')}", "ERROR")
        else:
            status = response.status_code if response else "No response"
            text = response.text if response else "No response"
            self.log(f"❌ Unfollow request failed: {status} - {text}", "ERROR")
        
        return False
    
    def test_follow_notification(self):
        """Test 6: Follow Notification - Check if notification was created"""
        self.log("🧪 Testing Follow Notification...")
        
        # First, Test User follows Admin again to trigger notification
        follow_response = self.make_authenticated_request(
            'POST',
            f'/users/{TEST_ID}/follow',
            self.test_token,
            {"targetUserId": ADMIN_ID}
        )
        
        if follow_response and follow_response.status_code == 200:
            # Check Admin's notifications
            notifications_response = self.make_authenticated_request(
                'GET',
                f'/notifications?userId={ADMIN_ID}',
                self.admin_token
            )
            
            if notifications_response and notifications_response.status_code == 200:
                notifications = notifications_response.json()
                
                # Look for new_follower notification from Test User
                follow_notification = None
                for notif in notifications:
                    if (notif.get('type') == 'new_follower' and 
                        notif.get('fromUserId') == TEST_ID):
                        follow_notification = notif
                        break
                
                if follow_notification:
                    self.log(f"✅ Follow notification found: {follow_notification.get('message')}")
                    return True
                else:
                    self.log("❌ Follow notification not found", "ERROR")
            else:
                status = notifications_response.status_code if notifications_response else "No response"
                self.log(f"❌ Failed to get notifications: {status}", "ERROR")
        else:
            self.log("❌ Failed to create follow for notification test", "ERROR")
        
        return False
    
    def reset_follow_relationships(self):
        """Reset follow relationships to ensure clean test state"""
        self.log("🔄 Resetting follow relationships...")
        
        # Ensure test user is not following admin
        response = self.make_authenticated_request(
            'GET',
            f'/users/{TEST_ID}/following',
            self.test_token
        )
        
        if response and response.status_code == 200:
            following_data = response.json()
            admin_followed = any(user['id'] == ADMIN_ID for user in following_data.get('users', []))
            
            if admin_followed:
                # Unfollow admin
                self.make_authenticated_request(
                    'POST',
                    f'/users/{TEST_ID}/follow',
                    self.test_token,
                    {"targetUserId": ADMIN_ID}
                )
                self.log("🔄 Test user unfollowed admin")
        
        # Ensure admin is not following test user
        response = self.make_authenticated_request(
            'GET',
            f'/users/{ADMIN_ID}/following',
            self.admin_token
        )
        
        if response and response.status_code == 200:
            following_data = response.json()
            test_followed = any(user['id'] == TEST_ID for user in following_data.get('users', []))
            
            if test_followed:
                # Unfollow test user
                self.make_authenticated_request(
                    'POST',
                    f'/users/{ADMIN_ID}/follow',
                    self.admin_token,
                    {"targetUserId": TEST_ID}
                )
                self.log("🔄 Admin unfollowed test user")

    def run_all_tests(self):
        """Run all follow system tests"""
        self.log("🚀 Starting Followers/Following System Tests...")
        
        # Login both users
        self.log("📝 Logging in users...")
        self.admin_token, admin_user = self.login_user(ADMIN_EMAIL, ADMIN_PASSWORD)
        self.test_token, test_user = self.login_user(TEST_EMAIL, TEST_PASSWORD)
        
        if not self.admin_token or not self.test_token:
            self.log("❌ Failed to login users. Cannot proceed with tests.", "ERROR")
            return False
        
        # Reset relationships to ensure clean state
        self.reset_follow_relationships()
        
        # Run tests
        tests = [
            ("Follow User", self.test_follow_user),
            ("Get Followers", self.test_get_followers),
            ("Get Following", self.test_get_following),
            ("Mutual Follow", self.test_mutual_follow),
            ("Unfollow", self.test_unfollow),
            ("Follow Notification", self.test_follow_notification)
        ]
        
        results = {}
        for test_name, test_func in tests:
            self.log(f"\n{'='*50}")
            try:
                results[test_name] = test_func()
            except Exception as e:
                self.log(f"❌ Test '{test_name}' crashed: {str(e)}", "ERROR")
                results[test_name] = False
        
        # Summary
        self.log(f"\n{'='*50}")
        self.log("📊 TEST SUMMARY:")
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"  {test_name}: {status}")
            if result:
                passed += 1
        
        self.log(f"\n🎯 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All Followers/Following System tests PASSED!")
            return True
        else:
            self.log(f"⚠️  {total - passed} test(s) FAILED!")
            return False

if __name__ == "__main__":
    tester = FollowSystemTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)