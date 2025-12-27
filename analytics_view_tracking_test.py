#!/usr/bin/env python3
"""
Analytics APIs and VibeZone View Tracking Test

**Test Focus:**
1. Analytics APIs - Test with real data:
   - User Analytics (GET /api/analytics/{userId})
   - Creator Analytics (GET /api/analytics/creator/{userId})
   - Admin Analytics (GET /api/analytics/admin?adminUserId={userId})

2. VibeZone (Reels) View Tracking:
   - Get Reels (GET /api/reels) - verify stats structure
   - Track View (POST /api/reels/{reelId}/view) - verify view increment

**Test Credentials:**
- Email: test@example.com
- Password: test123
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "https://talentloop-4.preview.emergentagent.com/api"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"

class AnalyticsViewTrackingTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
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
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, **kwargs):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        headers = kwargs.get('headers', {})
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        kwargs['headers'] = headers
        
        try:
            response = self.session.request(method, url, **kwargs)
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    def test_login(self):
        """Test login with provided credentials"""
        print(f"\n🔐 Testing Login with {TEST_EMAIL}...")
        
        response = self.make_request('POST', '/auth/login', json={
            'email': TEST_EMAIL,
            'password': TEST_PASSWORD
        })
        
        if not response:
            self.log_result("Login", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('token')
            self.user_id = data.get('user', {}).get('id')
            
            if self.token and self.user_id:
                self.log_result("Login", True, f"Successfully logged in as user {self.user_id}")
                return True
            else:
                self.log_result("Login", False, "Token or user ID missing in response", data)
                return False
        else:
            self.log_result("Login", False, f"Login failed with status {response.status_code}", response.text)
            return False
    
    def test_user_analytics(self):
        """Test User Analytics API"""
        print(f"\n📊 Testing User Analytics API...")
        
        if not self.user_id:
            self.log_result("User Analytics", False, "No user ID available")
            return False
        
        response = self.make_request('GET', f'/analytics/{self.user_id}')
        
        if not response:
            self.log_result("User Analytics", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            required_fields = [
                'totalPosts', 'totalReels', 'totalLikes', 'totalComments', 
                'followersCount', 'followingCount', 'weeklyEngagement', 'engagementRate'
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_result("User Analytics", False, f"Missing required fields: {missing_fields}", data)
                return False
            
            # Verify data types and structure
            if not isinstance(data.get('weeklyEngagement'), dict):
                self.log_result("User Analytics", False, "weeklyEngagement should be a dict", data)
                return False
            
            # Check if data is real (not all zeros)
            has_real_data = any([
                data.get('totalPosts', 0) > 0,
                data.get('totalReels', 0) > 0,
                data.get('totalLikes', 0) > 0,
                data.get('followersCount', 0) > 0
            ])
            
            self.log_result("User Analytics", True, 
                          f"User analytics returned successfully. Real data: {has_real_data}. "
                          f"Posts: {data.get('totalPosts')}, Reels: {data.get('totalReels')}, "
                          f"Likes: {data.get('totalLikes')}, Followers: {data.get('followersCount')}")
            return True
        else:
            self.log_result("User Analytics", False, f"Failed with status {response.status_code}", response.text)
            return False
    
    def test_creator_analytics(self):
        """Test Creator Analytics API"""
        print(f"\n🎨 Testing Creator Analytics API...")
        
        if not self.user_id:
            self.log_result("Creator Analytics", False, "No user ID available")
            return False
        
        response = self.make_request('GET', f'/analytics/creator/{self.user_id}')
        
        if not response:
            self.log_result("Creator Analytics", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            required_fields = [
                'followersCount', 'followersGrowth', 'totalReach', 
                'avgEngagementRate', 'contentBreakdown'
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_result("Creator Analytics", False, f"Missing required fields: {missing_fields}", data)
                return False
            
            # Verify contentBreakdown structure
            content_breakdown = data.get('contentBreakdown', {})
            if not isinstance(content_breakdown, dict):
                self.log_result("Creator Analytics", False, "contentBreakdown should be a dict", data)
                return False
            
            # Check calculated fields
            followers_growth = data.get('followersGrowth', '0%')
            avg_engagement = data.get('avgEngagementRate', '0%')
            
            self.log_result("Creator Analytics", True, 
                          f"Creator analytics returned successfully. "
                          f"Followers: {data.get('followersCount')}, Growth: {followers_growth}, "
                          f"Reach: {data.get('totalReach')}, Engagement: {avg_engagement}")
            return True
        else:
            self.log_result("Creator Analytics", False, f"Failed with status {response.status_code}", response.text)
            return False
    
    def test_admin_analytics(self):
        """Test Admin Analytics API"""
        print(f"\n👑 Testing Admin Analytics API...")
        
        if not self.user_id:
            self.log_result("Admin Analytics", False, "No user ID available")
            return False
        
        response = self.make_request('GET', f'/analytics/admin?adminUserId={self.user_id}')
        
        if not response:
            self.log_result("Admin Analytics", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            required_fields = [
                'totalUsers', 'activeUsers', 'totalPosts', 'totalReels', 
                'totalLikes', 'totalComments', 'platformEngagementRate', 'growthRate'
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_result("Admin Analytics", False, f"Missing required fields: {missing_fields}", data)
                return False
            
            # Verify data is real platform stats
            total_users = data.get('totalUsers', 0)
            total_posts = data.get('totalPosts', 0)
            total_reels = data.get('totalReels', 0)
            
            if total_users == 0 and total_posts == 0 and total_reels == 0:
                self.log_result("Admin Analytics", False, "All platform stats are zero - no real data", data)
                return False
            
            self.log_result("Admin Analytics", True, 
                          f"Admin analytics returned successfully. "
                          f"Users: {total_users}, Posts: {total_posts}, Reels: {total_reels}, "
                          f"Engagement Rate: {data.get('platformEngagementRate')}, Growth: {data.get('growthRate')}")
            return True
        else:
            self.log_result("Admin Analytics", False, f"Failed with status {response.status_code}", response.text)
            return False
    
    def test_get_reels_with_stats(self):
        """Test Get Reels API and verify stats structure"""
        print(f"\n🎬 Testing Get Reels API with Stats...")
        
        response = self.make_request('GET', '/reels')
        
        if not response:
            self.log_result("Get Reels Stats", False, "Request failed")
            return False, None
        
        if response.status_code == 200:
            reels = response.json()
            
            if not reels:
                self.log_result("Get Reels Stats", False, "No reels found in system")
                return False, None
            
            # Check first reel structure
            first_reel = reels[0]
            reel_id = first_reel.get('id')
            
            # Verify stats structure
            stats = first_reel.get('stats', {})
            if not isinstance(stats, dict):
                self.log_result("Get Reels Stats", False, "Reel stats should be a dict", first_reel)
                return False, None
            
            required_stats = ['views', 'likes', 'comments']
            missing_stats = [stat for stat in required_stats if stat not in stats]
            
            if missing_stats:
                self.log_result("Get Reels Stats", False, f"Missing stats fields: {missing_stats}", stats)
                return False, None
            
            views_count = stats.get('views', 0)
            likes_count = stats.get('likes', 0)
            comments_count = stats.get('comments', 0)
            
            self.log_result("Get Reels Stats", True, 
                          f"Found {len(reels)} reels. First reel stats - Views: {views_count}, "
                          f"Likes: {likes_count}, Comments: {comments_count}")
            return True, reel_id
        else:
            self.log_result("Get Reels Stats", False, f"Failed with status {response.status_code}", response.text)
            return False, None
    
    def test_track_reel_view(self, reel_id):
        """Test Track Reel View API"""
        print(f"\n👁️ Testing Track Reel View API...")
        
        if not reel_id:
            self.log_result("Track Reel View", False, "No reel ID available")
            return False
        
        # Get initial view count
        response = self.make_request('GET', '/reels')
        if not response or response.status_code != 200:
            self.log_result("Track Reel View", False, "Could not get initial reel data")
            return False
        
        reels = response.json()
        target_reel = next((r for r in reels if r.get('id') == reel_id), None)
        
        if not target_reel:
            self.log_result("Track Reel View", False, f"Reel {reel_id} not found")
            return False
        
        initial_views = target_reel.get('stats', {}).get('views', 0)
        
        # Track a view
        response = self.make_request('POST', f'/reels/{reel_id}/view')
        
        if not response:
            self.log_result("Track Reel View", False, "View tracking request failed")
            return False
        
        if response.status_code == 200:
            # Verify view was tracked
            time.sleep(1)  # Small delay to ensure update
            
            response = self.make_request('GET', '/reels')
            if response and response.status_code == 200:
                updated_reels = response.json()
                updated_reel = next((r for r in updated_reels if r.get('id') == reel_id), None)
                
                if updated_reel:
                    new_views = updated_reel.get('stats', {}).get('views', 0)
                    
                    if new_views > initial_views:
                        self.log_result("Track Reel View", True, 
                                      f"View count increased from {initial_views} to {new_views}")
                        return True
                    else:
                        self.log_result("Track Reel View", False, 
                                      f"View count did not increase. Initial: {initial_views}, Current: {new_views}")
                        return False
                else:
                    self.log_result("Track Reel View", False, "Could not find reel after view tracking")
                    return False
            else:
                self.log_result("Track Reel View", False, "Could not verify view count after tracking")
                return False
        else:
            self.log_result("Track Reel View", False, f"View tracking failed with status {response.status_code}", response.text)
            return False
    
    def run_all_tests(self):
        """Run all analytics and view tracking tests"""
        print("🚀 Starting Analytics APIs and VibeZone View Tracking Tests")
        print("=" * 60)
        
        # Test login first
        if not self.test_login():
            print("\n❌ Login failed - cannot proceed with other tests")
            return False
        
        # Test Analytics APIs
        analytics_results = []
        analytics_results.append(self.test_user_analytics())
        analytics_results.append(self.test_creator_analytics())
        analytics_results.append(self.test_admin_analytics())
        
        # Test VibeZone View Tracking
        reels_success, reel_id = self.test_get_reels_with_stats()
        view_tracking_success = False
        
        if reels_success and reel_id:
            view_tracking_success = self.test_track_reel_view(reel_id)
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if "✅ PASS" in r["status"]])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        print("\n📊 DETAILED RESULTS:")
        for result in self.test_results:
            print(f"{result['status']}: {result['test']} - {result['message']}")
        
        # Check if all critical tests passed
        analytics_passed = all(analytics_results)
        view_tracking_passed = reels_success and view_tracking_success
        
        print(f"\n🎯 FEATURE STATUS:")
        print(f"Analytics APIs: {'✅ WORKING' if analytics_passed else '❌ FAILING'}")
        print(f"VibeZone View Tracking: {'✅ WORKING' if view_tracking_passed else '❌ FAILING'}")
        
        return analytics_passed and view_tracking_passed

if __name__ == "__main__":
    tester = AnalyticsViewTrackingTester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n🎉 All tests passed! Analytics and View Tracking are working correctly.")
        sys.exit(0)
    else:
        print(f"\n💥 Some tests failed. Check the detailed results above.")
        sys.exit(1)