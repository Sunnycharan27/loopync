#!/usr/bin/env python3
"""
Real-Time Notifications System Backend Test
Tests all notification types: follow, like, comment with proper enrichment
"""

import requests
import json
import time
from datetime import datetime

# Base URL from environment
BASE_URL = "https://loopync-social-3.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "loopyncpvt@gmail.com"
ADMIN_PASSWORD = "ramcharan@123"
ADMIN_USER_ID = "30459d73-3e5b-4a5b-90d7-681155f74898"

TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"

class NotificationTester:
    def __init__(self):
        self.admin_token = None
        self.test_token = None
        self.test_user_id = None
        self.admin_post_id = None
        
    def login_admin(self):
        """Login as admin user"""
        print("🔐 Logging in as admin...")
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            self.admin_token = data["token"]
            print(f"✅ Admin login successful")
            return True
        else:
            print(f"❌ Admin login failed: {response.status_code} - {response.text}")
            return False
    
    def login_test_user(self):
        """Login as test user"""
        print("🔐 Logging in as test user...")
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            self.test_token = data["token"]
            self.test_user_id = data["user"]["id"]
            print(f"✅ Test user login successful - ID: {self.test_user_id}")
            return True
        else:
            print(f"❌ Test user login failed: {response.status_code} - {response.text}")
            return False
    
    def test_follow_notification(self):
        """Test follow notification creation"""
        print("\n📱 Testing Follow Notification...")
        
        headers = {"Authorization": f"Bearer {self.test_token}"}
        response = requests.post(
            f"{BASE_URL}/users/{self.test_user_id}/follow",
            json={"targetUserId": ADMIN_USER_ID},
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ Follow request successful")
            time.sleep(1)  # Wait for notification to be created
            return True
        else:
            print(f"❌ Follow request failed: {response.status_code} - {response.text}")
            return False
    
    def get_admin_post(self):
        """Get a post from admin user for testing likes/comments"""
        print("\n📝 Getting admin post for testing...")
        
        response = requests.get(f"{BASE_URL}/posts?authorId={ADMIN_USER_ID}&limit=1")
        
        if response.status_code == 200:
            posts = response.json()
            if posts:
                self.admin_post_id = posts[0]["id"]
                print(f"✅ Found admin post: {self.admin_post_id}")
                return True
            else:
                print("⚠️ No admin posts found, creating one...")
                return self.create_admin_post()
        else:
            print(f"❌ Failed to get admin posts: {response.status_code}")
            return False
    
    def create_admin_post(self):
        """Create a post as admin for testing"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.post(
            f"{BASE_URL}/posts?authorId={ADMIN_USER_ID}",
            json={
                "text": "This is a test post for notification testing! 🚀",
                "audience": "public"
            },
            headers=headers
        )
        
        if response.status_code == 200:
            post = response.json()
            self.admin_post_id = post["id"]
            print(f"✅ Created admin post: {self.admin_post_id}")
            return True
        else:
            print(f"❌ Failed to create admin post: {response.status_code} - {response.text}")
            return False
    
    def test_like_notification(self):
        """Test like notification creation"""
        print("\n❤️ Testing Like Notification...")
        
        if not self.admin_post_id:
            print("❌ No admin post available for like test")
            return False
        
        headers = {"Authorization": f"Bearer {self.test_token}"}
        response = requests.post(
            f"{BASE_URL}/posts/{self.admin_post_id}/like?userId={self.test_user_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ Like request successful")
            time.sleep(1)  # Wait for notification to be created
            return True
        else:
            print(f"❌ Like request failed: {response.status_code} - {response.text}")
            return False
    
    def test_comment_notification(self):
        """Test comment notification creation"""
        print("\n💬 Testing Comment Notification...")
        
        if not self.admin_post_id:
            print("❌ No admin post available for comment test")
            return False
        
        headers = {"Authorization": f"Bearer {self.test_token}"}
        response = requests.post(
            f"{BASE_URL}/posts/{self.admin_post_id}/comments?authorId={self.test_user_id}",
            json={"text": "Amazing content! This is a test comment for notifications 🔥"},
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ Comment request successful")
            time.sleep(1)  # Wait for notification to be created
            return True
        else:
            print(f"❌ Comment request failed: {response.status_code} - {response.text}")
            return False
    
    def verify_notifications(self):
        """Verify all notifications were created with proper enrichment"""
        print("\n🔍 Verifying Admin Notifications...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(
            f"{BASE_URL}/notifications?userId={ADMIN_USER_ID}",
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get notifications: {response.status_code} - {response.text}")
            return False
        
        notifications = response.json()
        print(f"📊 Found {len(notifications)} notifications")
        
        # Check for required notification types
        found_types = set()
        issues = []
        
        for notif in notifications:
            print(f"\n📱 Notification: {notif.get('type', 'unknown')}")
            print(f"   Message: {notif.get('message', 'No message')}")
            print(f"   From User: {notif.get('fromUserId', 'No fromUserId')}")
            print(f"   Created: {notif.get('createdAt', 'No timestamp')}")
            
            # Track notification type
            notif_type = notif.get('type')
            if notif_type:
                found_types.add(notif_type)
            
            # Verify notification structure
            if not self.verify_notification_structure(notif, issues):
                continue
        
        # Check if we have the expected notification types
        expected_types = {"new_follower", "post_like", "post_comment"}
        missing_types = expected_types - found_types
        
        if missing_types:
            issues.append(f"Missing notification types: {missing_types}")
        
        # Report results
        if issues:
            print(f"\n❌ Notification verification failed:")
            for issue in issues:
                print(f"   - {issue}")
            return False
        else:
            print(f"\n✅ All notifications verified successfully!")
            print(f"   Found types: {found_types}")
            return True
    
    def verify_notification_structure(self, notif, issues):
        """Verify individual notification structure"""
        required_fields = ["id", "userId", "type", "message", "createdAt"]
        enrichment_fields = ["fromUserId"]
        
        # Check required fields
        for field in required_fields:
            if not notif.get(field):
                issues.append(f"Missing required field '{field}' in notification {notif.get('id', 'unknown')}")
                return False
        
        # Check enrichment fields for user-generated notifications
        user_generated_types = {"new_follower", "post_like", "post_comment"}
        if notif.get("type") in user_generated_types:
            for field in enrichment_fields:
                if not notif.get(field):
                    issues.append(f"Missing enrichment field '{field}' in {notif.get('type')} notification")
                    return False
            
            # Verify fromUser data is populated (if available)
            from_user = notif.get("fromUser")
            if from_user:
                if not from_user.get("name") or not from_user.get("id"):
                    issues.append(f"Incomplete fromUser data in {notif.get('type')} notification")
                    return False
        
        # Type-specific validations
        notif_type = notif.get("type")
        
        if notif_type == "new_follower":
            if "started following you" not in notif.get("message", "").lower():
                issues.append("Follow notification message format incorrect")
                return False
        
        elif notif_type == "post_like":
            if "liked your post" not in notif.get("message", "").lower():
                issues.append("Like notification message format incorrect")
                return False
            if not notif.get("contentId"):
                issues.append("Like notification missing contentId")
                return False
        
        elif notif_type == "post_comment":
            if "commented" not in notif.get("message", "").lower():
                issues.append("Comment notification message format incorrect")
                return False
            payload = notif.get("payload", {})
            if not payload.get("text"):
                issues.append("Comment notification missing comment text in payload")
                return False
        
        return True
    
    def test_notification_click_navigation(self):
        """Test that notifications have proper navigation links"""
        print("\n🔗 Testing Notification Navigation Links...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(
            f"{BASE_URL}/notifications?userId={ADMIN_USER_ID}",
            headers=headers
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get notifications for navigation test")
            return False
        
        notifications = response.json()
        navigation_issues = []
        
        for notif in notifications:
            notif_type = notif.get("type")
            link = notif.get("link", "")
            
            if notif_type == "new_follower":
                # Should link to user profile (either /profile/ or /user/)
                if not link or (("/profile/" not in link) and ("/user/" not in link)):
                    navigation_issues.append(f"Follow notification missing proper profile link: {link}")
            
            elif notif_type in ["post_like", "post_comment"]:
                # Should link to post or have contentId
                content_id = notif.get("contentId")
                if not content_id and not link:
                    navigation_issues.append(f"{notif_type} notification missing contentId or link")
        
        if navigation_issues:
            print(f"❌ Navigation issues found:")
            for issue in navigation_issues:
                print(f"   - {issue}")
            return False
        else:
            print(f"✅ All notification navigation links verified")
            return True
    
    def run_all_tests(self):
        """Run all notification tests"""
        print("🚀 Starting Real-Time Notifications System Test")
        print("=" * 60)
        
        # Login both users
        if not self.login_admin():
            return False
        
        if not self.login_test_user():
            return False
        
        # Get or create admin post for testing
        if not self.get_admin_post():
            return False
        
        # Test notification creation
        follow_success = self.test_follow_notification()
        like_success = self.test_like_notification()
        comment_success = self.test_comment_notification()
        
        # Wait a bit for all notifications to be processed
        print("\n⏳ Waiting for notifications to be processed...")
        time.sleep(3)
        
        # Verify notifications
        verify_success = self.verify_notifications()
        navigation_success = self.test_notification_click_navigation()
        
        # Final results
        print("\n" + "=" * 60)
        print("📊 NOTIFICATION SYSTEM TEST RESULTS")
        print("=" * 60)
        
        results = {
            "Follow Notification": "✅ PASS" if follow_success else "❌ FAIL",
            "Like Notification": "✅ PASS" if like_success else "❌ FAIL", 
            "Comment Notification": "✅ PASS" if comment_success else "❌ FAIL",
            "Notification Verification": "✅ PASS" if verify_success else "❌ FAIL",
            "Navigation Links": "✅ PASS" if navigation_success else "❌ FAIL"
        }
        
        for test_name, result in results.items():
            print(f"{test_name}: {result}")
        
        all_passed = all([follow_success, like_success, comment_success, verify_success, navigation_success])
        
        print("\n" + "=" * 60)
        if all_passed:
            print("🎉 ALL NOTIFICATION TESTS PASSED!")
            print("✅ Real-Time Notifications System is working correctly")
        else:
            print("❌ SOME NOTIFICATION TESTS FAILED!")
            print("🔧 Please check the issues above and fix them")
        
        return all_passed

if __name__ == "__main__":
    tester = NotificationTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)