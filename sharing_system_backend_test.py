#!/usr/bin/env python3
"""
Comprehensive Sharing System Backend Testing for Loopync
Tests all sharing functionality including posts, reels, tribes, and share links
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://social-tribe.preview.emergentagent.com/api"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "test123"
FRIEND_USER_EMAIL = "friend@example.com"
FRIEND_USER_PASSWORD = "friend123"

class SharingSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user_token = None
        self.friend_user_token = None
        self.test_user_id = None
        self.friend_user_id = None
        self.test_post_id = None
        self.test_reel_id = None
        self.test_tribe_id = None
        self.results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_details": []
        }

    def log_test(self, test_name, success, details="", expected="", actual=""):
        """Log test results"""
        self.results["total_tests"] += 1
        if success:
            self.results["passed_tests"] += 1
            status = "✅ PASS"
        else:
            self.results["failed_tests"] += 1
            status = "❌ FAIL"
        
        test_result = {
            "test": test_name,
            "status": status,
            "details": details,
            "expected": expected,
            "actual": actual,
            "timestamp": datetime.now().isoformat()
        }
        self.results["test_details"].append(test_result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and expected:
            print(f"   Expected: {expected}")
            print(f"   Actual: {actual}")

    def setup_test_users(self):
        """Create or login test users"""
        print("\n🔧 Setting up test users...")
        
        # Try to login test user first
        try:
            login_response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            
            if login_response.status_code == 200:
                data = login_response.json()
                self.test_user_token = data["token"]
                self.test_user_id = data["user"]["id"]
                print(f"✅ Test user logged in: {TEST_USER_EMAIL}")
            else:
                # Create test user
                signup_response = self.session.post(f"{BACKEND_URL}/auth/signup", json={
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD,
                    "name": "Test User",
                    "handle": "testuser"
                })
                
                if signup_response.status_code == 200:
                    data = signup_response.json()
                    self.test_user_token = data["token"]
                    self.test_user_id = data["user"]["id"]
                    print(f"✅ Test user created: {TEST_USER_EMAIL}")
                else:
                    raise Exception(f"Failed to create test user: {signup_response.text}")
        
        except Exception as e:
            print(f"❌ Failed to setup test user: {e}")
            return False
        
        # Try to login friend user
        try:
            login_response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "email": FRIEND_USER_EMAIL,
                "password": FRIEND_USER_PASSWORD
            })
            
            if login_response.status_code == 200:
                data = login_response.json()
                self.friend_user_token = data["token"]
                self.friend_user_id = data["user"]["id"]
                print(f"✅ Friend user logged in: {FRIEND_USER_EMAIL}")
            else:
                # Create friend user
                signup_response = self.session.post(f"{BACKEND_URL}/auth/signup", json={
                    "email": FRIEND_USER_EMAIL,
                    "password": FRIEND_USER_PASSWORD,
                    "name": "Friend User",
                    "handle": "frienduser"
                })
                
                if signup_response.status_code == 200:
                    data = signup_response.json()
                    self.friend_user_token = data["token"]
                    self.friend_user_id = data["user"]["id"]
                    print(f"✅ Friend user created: {FRIEND_USER_EMAIL}")
                else:
                    raise Exception(f"Failed to create friend user: {signup_response.text}")
        
        except Exception as e:
            print(f"❌ Failed to setup friend user: {e}")
            return False
        
        return True

    def create_test_content(self):
        """Create test post, reel, and tribe for sharing"""
        print("\n🔧 Creating test content...")
        
        # Create test post
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            post_response = self.session.post(f"{BACKEND_URL}/posts", 
                headers=headers,
                json={
                    "text": "This is a test post for sharing functionality #test #sharing",
                    "audience": "public"
                }
            )
            
            if post_response.status_code == 200:
                self.test_post_id = post_response.json()["id"]
                print(f"✅ Test post created: {self.test_post_id}")
            else:
                print(f"❌ Failed to create test post: {post_response.text}")
                return False
        except Exception as e:
            print(f"❌ Error creating test post: {e}")
            return False
        
        # Create test reel
        try:
            reel_response = self.session.post(f"{BACKEND_URL}/reels",
                headers=headers,
                json={
                    "videoUrl": "https://example.com/test-video.mp4",
                    "thumb": "https://example.com/test-thumb.jpg",
                    "caption": "Test reel for sharing"
                }
            )
            
            if reel_response.status_code == 200:
                self.test_reel_id = reel_response.json()["id"]
                print(f"✅ Test reel created: {self.test_reel_id}")
            else:
                print(f"❌ Failed to create test reel: {reel_response.text}")
                return False
        except Exception as e:
            print(f"❌ Error creating test reel: {e}")
            return False
        
        # Create test tribe
        try:
            tribe_response = self.session.post(f"{BACKEND_URL}/tribes",
                headers=headers,
                json={
                    "name": "Test Sharing Tribe",
                    "description": "A tribe for testing sharing functionality",
                    "type": "public",
                    "tags": ["test", "sharing"]
                }
            )
            
            if tribe_response.status_code == 200:
                self.test_tribe_id = tribe_response.json()["id"]
                print(f"✅ Test tribe created: {self.test_tribe_id}")
            else:
                print(f"❌ Failed to create test tribe: {tribe_response.text}")
                return False
        except Exception as e:
            print(f"❌ Error creating test tribe: {e}")
            return False
        
        return True

    def test_post_sharing_feed(self):
        """Test POST /api/share/post/{postId} with shareType='feed'"""
        print("\n📝 Testing Post Sharing - Feed (Reshare)...")
        
        try:
            headers = {"Authorization": f"Bearer {self.friend_user_token}"}
            response = self.session.post(f"{BACKEND_URL}/share/post/{self.test_post_id}",
                headers=headers,
                json={
                    "contentType": "post",
                    "contentId": self.test_post_id,
                    "shareType": "feed",
                    "message": "Sharing this awesome post!"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["success", "shareType", "resharePostId", "message"]
                
                if all(field in data for field in expected_fields):
                    if data["shareType"] == "feed" and data["success"]:
                        self.log_test("Post Share to Feed", True, 
                                    f"Reshare post created with ID: {data.get('resharePostId')}")
                        return True
                    else:
                        self.log_test("Post Share to Feed", False,
                                    f"Invalid response data", 
                                    "shareType='feed' and success=True",
                                    f"shareType='{data.get('shareType')}', success={data.get('success')}")
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_test("Post Share to Feed", False,
                                f"Missing fields in response: {missing_fields}",
                                f"Response with fields: {expected_fields}",
                                f"Response: {data}")
            else:
                self.log_test("Post Share to Feed", False,
                            f"HTTP {response.status_code}: {response.text}",
                            "HTTP 200 with success response",
                            f"HTTP {response.status_code}")
        
        except Exception as e:
            self.log_test("Post Share to Feed", False, f"Exception: {str(e)}")
        
        return False

    def test_post_sharing_dm(self):
        """Test POST /api/share/post/{postId} with shareType='dm'"""
        print("\n📝 Testing Post Sharing - DM...")
        
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            response = self.session.post(f"{BACKEND_URL}/share/post/{self.test_post_id}",
                headers=headers,
                json={
                    "contentType": "post",
                    "contentId": self.test_post_id,
                    "shareType": "dm",
                    "toUserIds": [self.friend_user_id],
                    "message": "Check out this post!"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["success", "shareType", "sharedToCount", "message"]
                
                if all(field in data for field in expected_fields):
                    if data["shareType"] == "dm" and data["success"] and data["sharedToCount"] > 0:
                        self.log_test("Post Share via DM", True,
                                    f"Post shared with {data['sharedToCount']} friend(s)")
                        return True
                    else:
                        self.log_test("Post Share via DM", False,
                                    "Invalid response data",
                                    "shareType='dm', success=True, sharedToCount>0",
                                    f"shareType='{data.get('shareType')}', success={data.get('success')}, sharedToCount={data.get('sharedToCount')}")
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_test("Post Share via DM", False,
                                f"Missing fields: {missing_fields}",
                                f"Fields: {expected_fields}",
                                f"Response: {data}")
            else:
                self.log_test("Post Share via DM", False,
                            f"HTTP {response.status_code}: {response.text}",
                            "HTTP 200 with success response",
                            f"HTTP {response.status_code}")
        
        except Exception as e:
            self.log_test("Post Share via DM", False, f"Exception: {str(e)}")
        
        return False

    def test_post_sharing_link(self):
        """Test POST /api/share/post/{postId} with shareType='link'"""
        print("\n📝 Testing Post Sharing - Link Generation...")
        
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            response = self.session.post(f"{BACKEND_URL}/share/post/{self.test_post_id}",
                headers=headers,
                json={
                    "contentType": "post",
                    "contentId": self.test_post_id,
                    "shareType": "link"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["success", "shareType", "shareLink"]
                
                if all(field in data for field in expected_fields):
                    if (data["shareType"] == "link" and data["success"] and 
                        data["shareLink"] and self.test_post_id in data["shareLink"]):
                        self.log_test("Post Share Link Generation", True,
                                    f"Share link: {data['shareLink']}")
                        return True
                    else:
                        self.log_test("Post Share Link Generation", False,
                                    "Invalid response data",
                                    f"shareType='link', success=True, shareLink containing '{self.test_post_id}'",
                                    f"shareType='{data.get('shareType')}', success={data.get('success')}, shareLink='{data.get('shareLink')}'")
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_test("Post Share Link Generation", False,
                                f"Missing fields: {missing_fields}",
                                f"Fields: {expected_fields}",
                                f"Response: {data}")
            else:
                self.log_test("Post Share Link Generation", False,
                            f"HTTP {response.status_code}: {response.text}",
                            "HTTP 200 with success response",
                            f"HTTP {response.status_code}")
        
        except Exception as e:
            self.log_test("Post Share Link Generation", False, f"Exception: {str(e)}")
        
        return False

    def test_reel_sharing_dm(self):
        """Test POST /api/share/reel/{reelId} with shareType='dm'"""
        print("\n🎥 Testing Reel Sharing - DM...")
        
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            response = self.session.post(f"{BACKEND_URL}/share/reel/{self.test_reel_id}",
                headers=headers,
                json={
                    "contentType": "reel",
                    "contentId": self.test_reel_id,
                    "shareType": "dm",
                    "toUserIds": [self.friend_user_id],
                    "message": "Check out this reel!"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["success", "shareType", "sharedToCount", "message"]
                
                if all(field in data for field in expected_fields):
                    if data["shareType"] == "dm" and data["success"] and data["sharedToCount"] > 0:
                        self.log_test("Reel Share via DM", True,
                                    f"Reel shared with {data['sharedToCount']} friend(s)")
                        return True
                    else:
                        self.log_test("Reel Share via DM", False,
                                    "Invalid response data",
                                    "shareType='dm', success=True, sharedToCount>0",
                                    f"shareType='{data.get('shareType')}', success={data.get('success')}, sharedToCount={data.get('sharedToCount')}")
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_test("Reel Share via DM", False,
                                f"Missing fields: {missing_fields}",
                                f"Fields: {expected_fields}",
                                f"Response: {data}")
            else:
                self.log_test("Reel Share via DM", False,
                            f"HTTP {response.status_code}: {response.text}",
                            "HTTP 200 with success response",
                            f"HTTP {response.status_code}")
        
        except Exception as e:
            self.log_test("Reel Share via DM", False, f"Exception: {str(e)}")
        
        return False

    def test_reel_sharing_link(self):
        """Test POST /api/share/reel/{reelId} with shareType='link'"""
        print("\n🎥 Testing Reel Sharing - Link Generation...")
        
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            response = self.session.post(f"{BACKEND_URL}/share/reel/{self.test_reel_id}",
                headers=headers,
                json={
                    "contentType": "reel",
                    "contentId": self.test_reel_id,
                    "shareType": "link"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["success", "shareType", "shareLink"]
                
                if all(field in data for field in expected_fields):
                    if (data["shareType"] == "link" and data["success"] and 
                        data["shareLink"] and self.test_reel_id in data["shareLink"]):
                        self.log_test("Reel Share Link Generation", True,
                                    f"Share link: {data['shareLink']}")
                        return True
                    else:
                        self.log_test("Reel Share Link Generation", False,
                                    "Invalid response data",
                                    f"shareType='link', success=True, shareLink containing '{self.test_reel_id}'",
                                    f"shareType='{data.get('shareType')}', success={data.get('success')}, shareLink='{data.get('shareLink')}'")
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_test("Reel Share Link Generation", False,
                                f"Missing fields: {missing_fields}",
                                f"Fields: {expected_fields}",
                                f"Response: {data}")
            else:
                self.log_test("Reel Share Link Generation", False,
                            f"HTTP {response.status_code}: {response.text}",
                            "HTTP 200 with success response",
                            f"HTTP {response.status_code}")
        
        except Exception as e:
            self.log_test("Reel Share Link Generation", False, f"Exception: {str(e)}")
        
        return False

    def test_tribe_sharing_dm(self):
        """Test POST /api/share/tribe/{tribeId} with shareType='dm'"""
        print("\n👥 Testing Tribe Sharing - DM (Invitation)...")
        
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            response = self.session.post(f"{BACKEND_URL}/share/tribe/{self.test_tribe_id}",
                headers=headers,
                json={
                    "contentType": "tribe",
                    "contentId": self.test_tribe_id,
                    "shareType": "dm",
                    "toUserIds": [self.friend_user_id],
                    "message": "Join our tribe!"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["success", "shareType", "invitedCount", "message"]
                
                if all(field in data for field in expected_fields):
                    if data["shareType"] == "dm" and data["success"] and data["invitedCount"] > 0:
                        self.log_test("Tribe Share via DM (Invitation)", True,
                                    f"Tribe invitation sent to {data['invitedCount']} friend(s)")
                        return True
                    else:
                        self.log_test("Tribe Share via DM (Invitation)", False,
                                    "Invalid response data",
                                    "shareType='dm', success=True, invitedCount>0",
                                    f"shareType='{data.get('shareType')}', success={data.get('success')}, invitedCount={data.get('invitedCount')}")
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_test("Tribe Share via DM (Invitation)", False,
                                f"Missing fields: {missing_fields}",
                                f"Fields: {expected_fields}",
                                f"Response: {data}")
            else:
                self.log_test("Tribe Share via DM (Invitation)", False,
                            f"HTTP {response.status_code}: {response.text}",
                            "HTTP 200 with success response",
                            f"HTTP {response.status_code}")
        
        except Exception as e:
            self.log_test("Tribe Share via DM (Invitation)", False, f"Exception: {str(e)}")
        
        return False

    def test_share_link_generation_endpoints(self):
        """Test GET /api/share/link/{contentType}/{contentId}"""
        print("\n🔗 Testing Share Link Generation Endpoints...")
        
        # Test post link generation
        try:
            response = self.session.get(f"{BACKEND_URL}/share/link/post/{self.test_post_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "shareLink" in data and "contentType" in data:
                    if data["contentType"] == "post" and self.test_post_id in data["shareLink"]:
                        self.log_test("Share Link Generation - Post", True,
                                    f"Post link: {data['shareLink']}")
                    else:
                        self.log_test("Share Link Generation - Post", False,
                                    "Invalid link format",
                                    f"contentType='post', link containing '{self.test_post_id}'",
                                    f"contentType='{data.get('contentType')}', link='{data.get('shareLink')}'")
                else:
                    self.log_test("Share Link Generation - Post", False,
                                "Missing required fields",
                                "shareLink and contentType fields",
                                f"Response: {data}")
            else:
                self.log_test("Share Link Generation - Post", False,
                            f"HTTP {response.status_code}: {response.text}")
        
        except Exception as e:
            self.log_test("Share Link Generation - Post", False, f"Exception: {str(e)}")
        
        # Test tribe link generation
        try:
            response = self.session.get(f"{BACKEND_URL}/share/link/tribe/{self.test_tribe_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "shareLink" in data and "contentType" in data:
                    if data["contentType"] == "tribe" and self.test_tribe_id in data["shareLink"]:
                        self.log_test("Share Link Generation - Tribe", True,
                                    f"Tribe link: {data['shareLink']}")
                    else:
                        self.log_test("Share Link Generation - Tribe", False,
                                    "Invalid link format",
                                    f"contentType='tribe', link containing '{self.test_tribe_id}'",
                                    f"contentType='{data.get('contentType')}', link='{data.get('shareLink')}'")
                else:
                    self.log_test("Share Link Generation - Tribe", False,
                                "Missing required fields",
                                "shareLink and contentType fields",
                                f"Response: {data}")
            else:
                self.log_test("Share Link Generation - Tribe", False,
                            f"HTTP {response.status_code}: {response.text}")
        
        except Exception as e:
            self.log_test("Share Link Generation - Tribe", False, f"Exception: {str(e)}")

    def test_user_shares_history(self):
        """Test GET /api/users/{userId}/shared"""
        print("\n📊 Testing User Shares History...")
        
        try:
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            response = self.session.get(f"{BACKEND_URL}/users/{self.test_user_id}/shared",
                headers=headers,
                params={"limit": 50}
            )
            
            if response.status_code == 200:
                shares = response.json()
                
                if isinstance(shares, list):
                    # Check if we have shares from our tests
                    share_types = [share.get("shareType") for share in shares]
                    content_types = [share.get("contentType") for share in shares]
                    
                    if len(shares) > 0:
                        self.log_test("User Shares History", True,
                                    f"Found {len(shares)} shares. Types: {set(share_types)}, Content: {set(content_types)}")
                    else:
                        self.log_test("User Shares History", True,
                                    "No shares found (expected for new user)")
                    return True
                else:
                    self.log_test("User Shares History", False,
                                "Invalid response format",
                                "Array of share objects",
                                f"Response type: {type(shares)}")
            else:
                self.log_test("User Shares History", False,
                            f"HTTP {response.status_code}: {response.text}",
                            "HTTP 200 with shares array",
                            f"HTTP {response.status_code}")
        
        except Exception as e:
            self.log_test("User Shares History", False, f"Exception: {str(e)}")
        
        return False

    def test_tribe_invite_acceptance(self):
        """Test tribe invite acceptance via POST /api/tribe-invites/{inviteId}/accept"""
        print("\n👥 Testing Tribe Invite Acceptance...")
        
        try:
            # First, get tribe invites for friend user
            headers = {"Authorization": f"Bearer {self.friend_user_token}"}
            invites_response = self.session.get(f"{BACKEND_URL}/tribe-invites",
                headers=headers
            )
            
            if invites_response.status_code == 200:
                invites = invites_response.json()
                
                if isinstance(invites, list) and len(invites) > 0:
                    # Find invite for our test tribe
                    test_invite = None
                    for invite in invites:
                        if invite.get("tribeId") == self.test_tribe_id:
                            test_invite = invite
                            break
                    
                    if test_invite:
                        # Accept the invite
                        accept_response = self.session.post(
                            f"{BACKEND_URL}/tribe-invites/{test_invite['id']}/accept",
                            headers=headers
                        )
                        
                        if accept_response.status_code == 200:
                            data = accept_response.json()
                            if data.get("success"):
                                self.log_test("Tribe Invite Acceptance", True,
                                            f"Successfully accepted tribe invite: {test_invite['id']}")
                                return True
                            else:
                                self.log_test("Tribe Invite Acceptance", False,
                                            "Accept response indicates failure",
                                            "success=True",
                                            f"Response: {data}")
                        else:
                            self.log_test("Tribe Invite Acceptance", False,
                                        f"HTTP {accept_response.status_code}: {accept_response.text}")
                    else:
                        self.log_test("Tribe Invite Acceptance", False,
                                    f"No invite found for test tribe {self.test_tribe_id}",
                                    f"Invite for tribe {self.test_tribe_id}",
                                    f"Available invites: {[inv.get('tribeId') for inv in invites]}")
                else:
                    self.log_test("Tribe Invite Acceptance", False,
                                "No tribe invites found",
                                "At least one tribe invite",
                                f"Invites: {invites}")
            else:
                self.log_test("Tribe Invite Acceptance", False,
                            f"Failed to get invites: HTTP {invites_response.status_code}: {invites_response.text}")
        
        except Exception as e:
            self.log_test("Tribe Invite Acceptance", False, f"Exception: {str(e)}")
        
        return False

    def run_all_tests(self):
        """Run all sharing system tests"""
        print("🚀 Starting Comprehensive Sharing System Backend Testing")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_users():
            print("❌ Failed to setup test users. Aborting tests.")
            return
        
        if not self.create_test_content():
            print("❌ Failed to create test content. Aborting tests.")
            return
        
        # Run all tests
        print("\n🧪 Running Sharing System Tests...")
        
        # Post sharing tests
        self.test_post_sharing_feed()
        self.test_post_sharing_dm()
        self.test_post_sharing_link()
        
        # Reel sharing tests
        self.test_reel_sharing_dm()
        self.test_reel_sharing_link()
        
        # Tribe sharing tests
        self.test_tribe_sharing_dm()
        
        # Share link generation tests
        self.test_share_link_generation_endpoints()
        
        # User shares history test
        self.test_user_shares_history()
        
        # Tribe invite acceptance test
        self.test_tribe_invite_acceptance()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 SHARING SYSTEM TESTING SUMMARY")
        print("=" * 60)
        
        total = self.results["total_tests"]
        passed = self.results["passed_tests"]
        failed = self.results["failed_tests"]
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if failed > 0:
            print(f"\n❌ FAILED TESTS:")
            for test in self.results["test_details"]:
                if "❌ FAIL" in test["status"]:
                    print(f"   • {test['test']}: {test['details']}")
        
        print(f"\n🎯 OVERALL STATUS: {'✅ EXCELLENT' if success_rate >= 90 else '⚠️ NEEDS ATTENTION' if success_rate >= 70 else '❌ CRITICAL ISSUES'}")

if __name__ == "__main__":
    tester = SharingSystemTester()
    tester.run_all_tests()