#!/usr/bin/env python3
"""
Admin Feedback Dashboard Testing Script
Tests the admin feedback functionality as specified in the review request.

Test Steps:
1. Login as admin (loopyncpvt@gmail.com / admin@loopync2025)
2. GET /api/feedback - Verify feedback list is returned
3. Update a feedback status:
   - PUT /api/feedback/{feedbackId}/status?status=in_progress
   - PUT /api/feedback/{feedbackId}/status?status=resolved
4. Verify status was updated via GET /api/feedback
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://vibe-capsule.preview.emergentagent.com/api"
ADMIN_EMAIL = "loopyncpvt@gmail.com"
ADMIN_PASSWORD = "admin@loopync2025"

class AdminFeedbackTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.admin_user_id = None
        self.test_feedback_id = None
        
    def log(self, message):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def test_admin_login(self):
        """Test Step 1: Login as admin"""
        self.log("🔐 Testing Admin Login...")
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("token")
                self.admin_user_id = data.get("user", {}).get("id")
                
                if self.auth_token and self.admin_user_id:
                    self.log(f"✅ Admin login successful - User ID: {self.admin_user_id}")
                    
                    # Set authorization header for future requests
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.auth_token}"
                    })
                    return True
                else:
                    self.log("❌ Admin login failed - No token or user ID in response")
                    return False
            else:
                self.log(f"❌ Admin login failed - Status: {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin login error: {str(e)}")
            return False
    
    def create_test_feedback(self):
        """Create test feedback for testing purposes"""
        self.log("📝 Creating test feedback...")
        
        try:
            response = self.session.post(f"{BACKEND_URL}/feedback", json={
                "userId": self.admin_user_id,
                "type": "problem",
                "category": "Bug/Error",
                "title": "Admin Dashboard Test Issue",
                "description": "This is a test feedback created for admin dashboard testing",
                "email": ADMIN_EMAIL
            })
            
            if response.status_code == 200:
                data = response.json()
                self.test_feedback_id = data.get("id")
                self.log(f"✅ Test feedback created - ID: {self.test_feedback_id}")
                return True
            else:
                self.log(f"❌ Failed to create test feedback - Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating test feedback: {str(e)}")
            return False
    
    def test_get_feedback_list(self):
        """Test Step 2: GET /api/feedback - Verify feedback list is returned"""
        self.log("📋 Testing GET /api/feedback...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/feedback")
            
            if response.status_code == 200:
                feedback_list = response.json()
                
                if isinstance(feedback_list, list):
                    self.log(f"✅ Feedback list retrieved successfully - Found {len(feedback_list)} feedback items")
                    
                    # Display feedback details
                    for i, feedback in enumerate(feedback_list[:3]):  # Show first 3
                        self.log(f"   Feedback {i+1}: ID={feedback.get('id', 'N/A')}, Status={feedback.get('status', 'N/A')}, Type={feedback.get('type', 'N/A')}")
                    
                    # Find our test feedback if it exists
                    if self.test_feedback_id:
                        test_feedback = next((f for f in feedback_list if f.get('id') == self.test_feedback_id), None)
                        if test_feedback:
                            self.log(f"✅ Test feedback found in list - Status: {test_feedback.get('status')}")
                        else:
                            self.log("⚠️ Test feedback not found in list")
                    
                    return True
                else:
                    self.log(f"❌ Invalid response format - Expected list, got {type(feedback_list)}")
                    return False
            else:
                self.log(f"❌ Failed to get feedback list - Status: {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting feedback list: {str(e)}")
            return False
    
    def test_update_feedback_status(self, feedback_id, status):
        """Test Step 3: Update feedback status"""
        self.log(f"🔄 Testing PUT /api/feedback/{feedback_id}/status?status={status}...")
        
        try:
            response = self.session.put(f"{BACKEND_URL}/feedback/{feedback_id}/status?status={status}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log(f"✅ Feedback status updated to '{status}' successfully")
                    return True
                else:
                    self.log(f"❌ Failed to update feedback status - Response: {data}")
                    return False
            else:
                self.log(f"❌ Failed to update feedback status - Status: {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error updating feedback status: {str(e)}")
            return False
    
    def verify_status_update(self, feedback_id, expected_status):
        """Test Step 4: Verify status was updated"""
        self.log(f"🔍 Verifying feedback status update...")
        
        try:
            response = self.session.get(f"{BACKEND_URL}/feedback")
            
            if response.status_code == 200:
                feedback_list = response.json()
                
                # Find the specific feedback
                target_feedback = next((f for f in feedback_list if f.get('id') == feedback_id), None)
                
                if target_feedback:
                    actual_status = target_feedback.get('status')
                    if actual_status == expected_status:
                        self.log(f"✅ Status verification successful - Status is '{actual_status}'")
                        return True
                    else:
                        self.log(f"❌ Status verification failed - Expected '{expected_status}', got '{actual_status}'")
                        return False
                else:
                    self.log(f"❌ Feedback with ID {feedback_id} not found")
                    return False
            else:
                self.log(f"❌ Failed to verify status - Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error verifying status: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run all admin feedback dashboard tests"""
        self.log("🚀 Starting Admin Feedback Dashboard Testing...")
        self.log("=" * 60)
        
        test_results = []
        
        # Test 1: Admin Login
        result = self.test_admin_login()
        test_results.append(("Admin Login", result))
        if not result:
            self.log("❌ Cannot continue without admin authentication")
            return self.generate_summary(test_results)
        
        # Create test feedback for testing
        self.create_test_feedback()
        
        # Test 2: Get Feedback List
        result = self.test_get_feedback_list()
        test_results.append(("GET /api/feedback", result))
        
        # Test 3a: Update to in_progress
        if self.test_feedback_id:
            result = self.test_update_feedback_status(self.test_feedback_id, "in_progress")
            test_results.append(("PUT /api/feedback/{id}/status (in_progress)", result))
            
            if result:
                # Test 4a: Verify in_progress status
                result = self.verify_status_update(self.test_feedback_id, "in_progress")
                test_results.append(("Verify in_progress status", result))
        
        # Test 3b: Update to resolved
        if self.test_feedback_id:
            result = self.test_update_feedback_status(self.test_feedback_id, "resolved")
            test_results.append(("PUT /api/feedback/{id}/status (resolved)", result))
            
            if result:
                # Test 4b: Verify resolved status
                result = self.verify_status_update(self.test_feedback_id, "resolved")
                test_results.append(("Verify resolved status", result))
        
        return self.generate_summary(test_results)
    
    def generate_summary(self, test_results):
        """Generate test summary"""
        self.log("=" * 60)
        self.log("📊 ADMIN FEEDBACK DASHBOARD TEST SUMMARY")
        self.log("=" * 60)
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        success_rate = (passed / total * 100) if total > 0 else 0
        
        self.log(f"Total Tests: {total}")
        self.log(f"Passed: {passed} ✅")
        self.log(f"Failed: {total - passed} ❌")
        self.log(f"Success Rate: {success_rate:.1f}%")
        self.log("")
        
        # Detailed results
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} - {test_name}")
        
        self.log("=" * 60)
        
        if success_rate == 100:
            self.log("🎉 ALL ADMIN FEEDBACK DASHBOARD TESTS PASSED!")
            return True
        else:
            self.log("⚠️ SOME TESTS FAILED - REVIEW REQUIRED")
            return False

def main():
    """Main test execution"""
    tester = AdminFeedbackTester()
    success = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()