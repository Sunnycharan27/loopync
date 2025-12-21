#!/usr/bin/env python3
"""
Improved Verification Testing with MongoDB Admin Role Update
"""

import requests
import json
import time
import sys
import os
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Configuration
BACKEND_URL = "https://socialsync-app-2.preview.emergentagent.com/api"

class ImprovedVerificationTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.session = requests.Session()
        self.user1_token = None
        self.user2_token = None
        self.user3_token = None
        self.user1_id = None
        self.user2_id = None
        self.user3_id = None
        self.verification_request_id = None
        self.verification_request_id_2 = None
        self.page_id = None
        
        # MongoDB connection
        self.mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        self.db_name = os.environ.get('DB_NAME', 'test_database')
        
        # Test results tracking
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = f"{status} - {test_name}"
        if details:
            result += f" | {details}"
            
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
    def make_request(self, method, endpoint, data=None, headers=None, files=None):
        """Make HTTP request with error handling"""
        url = f"{self.backend_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                if files:
                    response = self.session.post(url, data=data, headers=headers, files=files, timeout=30)
                else:
                    response = self.session.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
            
        except requests.exceptions.Timeout:
            print(f"⚠️ Request timeout for {method} {endpoint}")
            return None
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Request error for {method} {endpoint}: {e}")
            return None
    
    async def update_admin_role_mongodb(self, user_id):
        """Update user role to admin in MongoDB"""
        try:
            client = AsyncIOMotorClient(self.mongo_url)
            db = client[self.db_name]
            
            # Update user role to admin
            result = await db.users.update_one(
                {"id": user_id},
                {"$set": {"role": "admin"}}
            )
            
            if result.modified_count > 0:
                self.log_test("MongoDB Admin Role Update", True, f"User {user_id} role updated to admin")
            else:
                self.log_test("MongoDB Admin Role Update", False, f"Failed to update user {user_id}")
                
            # Verify the update
            user = await db.users.find_one({"id": user_id}, {"_id": 0, "role": 1, "name": 1})
            if user and user.get("role") == "admin":
                self.log_test("Admin Role Verification", True, f"Role confirmed: {user.get('role')}")
            else:
                self.log_test("Admin Role Verification", False, f"Role not updated correctly")
            
            client.close()
            return result.modified_count > 0
            
        except Exception as e:
            self.log_test("MongoDB Admin Role Update", False, f"Exception: {e}")
            return False
    
    def test_user_signup_authentication(self):
        """Test 1: User Signup & Authentication"""
        print("\n🔐 Testing User Signup & Authentication...")
        
        # Test User 1: Regular user
        user1_data = {
            "email": "testuser@example.com",
            "password": "Test123!",
            "name": "Test User",
            "handle": "testuser"
        }
        
        response = self.make_request("POST", "/auth/signup", user1_data)
        if response and response.status_code == 200:
            data = response.json()
            self.user1_token = data.get("token")
            self.user1_id = data.get("user", {}).get("id")
            self.log_test("User 1 Signup", True, f"User ID: {self.user1_id}")
        else:
            self.log_test("User 1 Signup", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        # Test User 2: Admin user
        user2_data = {
            "email": "admin@example.com", 
            "password": "Admin123!",
            "name": "Admin User",
            "handle": "adminuser"
        }
        
        response = self.make_request("POST", "/auth/signup", user2_data)
        if response and response.status_code == 200:
            data = response.json()
            self.user2_token = data.get("token")
            self.user2_id = data.get("user", {}).get("id")
            self.log_test("User 2 Signup", True, f"User ID: {self.user2_id}")
        else:
            self.log_test("User 2 Signup", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        # Test User 3: For rejection testing
        user3_data = {
            "email": "testuser3@example.com",
            "password": "Test123!",
            "name": "Test User 3", 
            "handle": "testuser3"
        }
        
        response = self.make_request("POST", "/auth/signup", user3_data)
        if response and response.status_code == 200:
            data = response.json()
            self.user3_token = data.get("token")
            self.user3_id = data.get("user", {}).get("id")
            self.log_test("User 3 Signup", True, f"User ID: {self.user3_id}")
        else:
            self.log_test("User 3 Signup", False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test login for User 1
        login_data = {
            "email": "testuser@example.com",
            "password": "Test123!"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response and response.status_code == 200:
            self.log_test("User 1 Login", True, "Login successful")
        else:
            self.log_test("User 1 Login", False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test /auth/me endpoint
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        response = self.make_request("GET", "/auth/me", headers=headers)
        if response and response.status_code == 200:
            user_data = response.json()
            self.log_test("Get Current User", True, f"Name: {user_data.get('name')}")
        else:
            self.log_test("Get Current User", False, f"Status: {response.status_code if response else 'No response'}")
            
        return True
    
    async def update_admin_role(self):
        """Update User 2's role to admin in MongoDB"""
        print("\n👑 Updating User 2's role to admin in MongoDB...")
        
        if not self.user2_id:
            self.log_test("Admin Role Update", False, "No User 2 ID available")
            return False
            
        success = await self.update_admin_role_mongodb(self.user2_id)
        return success
        
    def test_verification_request_flow(self):
        """Test 2: Verification Request Flow (User 1)"""
        print("\n📝 Testing Verification Request Flow...")
        
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        
        # Submit verification request
        verification_data = {
            "accountType": "creator",
            "fullName": "Test User",
            "email": "testuser@example.com", 
            "phone": "+91 9876543210",
            "pageCategory": "influencer",
            "aboutText": "Test creator profile for verification testing"
        }
        
        response = self.make_request("POST", "/verification/request", verification_data, headers)
        if response and response.status_code == 200:
            self.log_test("Submit Verification Request", True, "Request submitted successfully")
        else:
            self.log_test("Submit Verification Request", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"Response: {response.text}")
            return False
            
        # Check verification status
        response = self.make_request("GET", "/verification/status", headers=headers)
        if response and response.status_code == 200:
            status_data = response.json()
            if status_data.get("verificationStatus") == "pending":
                self.log_test("Check Verification Status", True, "Status: pending")
            else:
                self.log_test("Check Verification Status", False, f"Expected 'pending', got: {status_data.get('verificationStatus')}")
        else:
            self.log_test("Check Verification Status", False, f"Status: {response.status_code if response else 'No response'}")
            
        return True
        
    def test_admin_dashboard_flow(self):
        """Test 3: Admin Dashboard Flow (User 2)"""
        print("\n👨‍💼 Testing Admin Dashboard Flow...")
        
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        
        # Get pending verification requests
        response = self.make_request("GET", "/admin/verification/requests", headers=headers)
        if response and response.status_code == 200:
            requests_data = response.json()
            requests_list = requests_data.get("requests", [])
            
            if len(requests_list) >= 1:
                # Find our test user's request
                test_request = None
                for req in requests_list:
                    if req.get("userId") == self.user1_id:
                        test_request = req
                        self.verification_request_id = req.get("id")
                        break
                        
                if test_request:
                    self.log_test("Get Verification Requests", True, f"Found {len(requests_list)} requests, including test user's request")
                    
                    # Verify request data
                    expected_fields = ["accountType", "fullName", "email", "phone", "pageCategory", "aboutText"]
                    all_fields_present = all(field in test_request for field in expected_fields)
                    
                    if all_fields_present:
                        self.log_test("Verify Request Data", True, "All required fields present")
                    else:
                        missing_fields = [field for field in expected_fields if field not in test_request]
                        self.log_test("Verify Request Data", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Get Verification Requests", False, "Test user's request not found")
            else:
                self.log_test("Get Verification Requests", False, f"Expected at least 1 request, got {len(requests_list)}")
        else:
            self.log_test("Get Verification Requests", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"Response: {response.text}")
            return False
            
        return True
        
    def test_verification_approval_flow(self):
        """Test 4: Verification Approval Flow"""
        print("\n✅ Testing Verification Approval Flow...")
        
        if not self.verification_request_id:
            self.log_test("Verification Approval", False, "No verification request ID available")
            return False
            
        headers = {"Authorization": f"Bearer {self.user2_token}"}
        
        # Approve the verification request
        review_data = {
            "status": "approved",
            "adminNotes": "Test approval for verification testing"
        }
        
        response = self.make_request("POST", f"/admin/verification/{self.verification_request_id}/review", review_data, headers)
        if response and response.status_code == 200:
            self.log_test("Approve Verification Request", True, "Request approved successfully")
        else:
            self.log_test("Approve Verification Request", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"Response: {response.text}")
            return False
            
        # Verify User 1's profile is updated
        user1_headers = {"Authorization": f"Bearer {self.user1_token}"}
        response = self.make_request("GET", "/auth/me", headers=user1_headers)
        if response and response.status_code == 200:
            user_data = response.json()
            
            # Check if user is verified
            if user_data.get("isVerified") == True:
                self.log_test("User Verification Status", True, "User is now verified")
            else:
                self.log_test("User Verification Status", False, f"Expected isVerified=True, got: {user_data.get('isVerified')}")
                
            # Check account type
            if user_data.get("accountType") == "creator":
                self.log_test("User Account Type", True, "Account type updated to creator")
            else:
                self.log_test("User Account Type", False, f"Expected accountType='creator', got: {user_data.get('accountType')}")
                
            # Check if page was created
            page_id = user_data.get("pageId")
            if page_id:
                self.page_id = page_id
                self.log_test("Page Creation", True, f"Page ID: {page_id}")
            else:
                self.log_test("Page Creation", False, "No pageId found in user data")
        else:
            self.log_test("User Profile Update Verification", False, f"Status: {response.status_code if response else 'No response'}")
            
        return True
        
    def test_page_view_flow(self):
        """Test 5: Page View Flow"""
        print("\n📄 Testing Page View Flow...")
        
        if not self.page_id:
            self.log_test("Page View Flow", False, "No page ID available")
            return False
            
        # Test GET /api/pages/user/{user_id}
        response = self.make_request("GET", f"/pages/user/{self.user1_id}")
        if response and response.status_code == 200:
            page_data = response.json()
            
            # Verify page data
            expected_fields = ["pageName", "handle", "category", "isVerified"]
            present_fields = [field for field in expected_fields if field in page_data]
            
            if len(present_fields) == len(expected_fields):
                self.log_test("Get Page by User ID", True, f"All required fields present: {present_fields}")
                
                # Verify specific values
                if page_data.get("isVerified") == True:
                    self.log_test("Page Verification Status", True, "Page is verified")
                else:
                    self.log_test("Page Verification Status", False, f"Expected isVerified=True, got: {page_data.get('isVerified')}")
                    
                if page_data.get("category") == "influencer":
                    self.log_test("Page Category", True, "Category is influencer")
                else:
                    self.log_test("Page Category", False, f"Expected category='influencer', got: {page_data.get('category')}")
            else:
                missing_fields = [field for field in expected_fields if field not in page_data]
                self.log_test("Get Page by User ID", False, f"Missing fields: {missing_fields}")
        else:
            self.log_test("Get Page by User ID", False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test GET /api/pages/{page_id}
        response = self.make_request("GET", f"/pages/{self.page_id}")
        if response and response.status_code == 200:
            page_data = response.json()
            self.log_test("Get Page by ID", True, f"Page name: {page_data.get('pageName')}")
        else:
            self.log_test("Get Page by ID", False, f"Status: {response.status_code if response else 'No response'}")
            
        return True
        
    def test_rejection_flow(self):
        """Test 6: Rejection Flow (User 3)"""
        print("\n❌ Testing Verification Rejection Flow...")
        
        if not self.user3_token:
            self.log_test("Rejection Flow Setup", False, "User 3 not available")
            return False
            
        headers = {"Authorization": f"Bearer {self.user3_token}"}
        
        # Submit verification request for User 3
        verification_data = {
            "accountType": "creator",
            "fullName": "Test User 3",
            "email": "testuser3@example.com",
            "phone": "+91 9876543211", 
            "pageCategory": "influencer",
            "aboutText": "Test creator profile for rejection testing"
        }
        
        response = self.make_request("POST", "/verification/request", verification_data, headers)
        if response and response.status_code == 200:
            self.log_test("Submit Verification Request (User 3)", True, "Request submitted")
        else:
            self.log_test("Submit Verification Request (User 3)", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        # Get the request ID for User 3
        admin_headers = {"Authorization": f"Bearer {self.user2_token}"}
        response = self.make_request("GET", "/admin/verification/requests", headers=admin_headers)
        if response and response.status_code == 200:
            requests_data = response.json()
            requests_list = requests_data.get("requests", [])
            
            # Find User 3's request
            user3_request = None
            for req in requests_list:
                if req.get("userId") == self.user3_id:
                    user3_request = req
                    self.verification_request_id_2 = req.get("id")
                    break
                    
            if user3_request:
                self.log_test("Find User 3 Request", True, f"Request ID: {self.verification_request_id_2}")
            else:
                self.log_test("Find User 3 Request", False, "User 3's request not found")
                return False
        else:
            self.log_test("Get Requests for Rejection", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        # Reject the verification request
        review_data = {
            "status": "rejected",
            "rejectionReason": "Insufficient documentation",
            "adminNotes": "Test rejection for verification testing"
        }
        
        response = self.make_request("POST", f"/admin/verification/{self.verification_request_id_2}/review", review_data, admin_headers)
        if response and response.status_code == 200:
            self.log_test("Reject Verification Request", True, "Request rejected successfully")
        else:
            self.log_test("Reject Verification Request", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        # Verify User 3 remains unverified
        response = self.make_request("GET", "/auth/me", headers=headers)
        if response and response.status_code == 200:
            user_data = response.json()
            
            if user_data.get("isVerified") == False:
                self.log_test("User 3 Remains Unverified", True, "User is still unverified")
            else:
                self.log_test("User 3 Remains Unverified", False, f"Expected isVerified=False, got: {user_data.get('isVerified')}")
                
            if user_data.get("verificationStatus") == "rejected":
                self.log_test("User 3 Verification Status", True, "Status is rejected")
            else:
                self.log_test("User 3 Verification Status", False, f"Expected status='rejected', got: {user_data.get('verificationStatus')}")
        else:
            self.log_test("User 3 Status Check", False, f"Status: {response.status_code if response else 'No response'}")
            
        return True
        
    async def run_all_tests(self):
        """Run all verification tests"""
        print("🚀 Starting Comprehensive Verified Accounts & Special Pages Testing...")
        print(f"🔗 Backend URL: {self.backend_url}")
        print("=" * 80)
        
        # Run authentication tests
        self.test_user_signup_authentication()
        
        # Update admin role in MongoDB
        await self.update_admin_role()
        
        # Run verification tests
        self.test_verification_request_flow()
        self.test_admin_dashboard_flow()
        self.test_verification_approval_flow()
        self.test_page_view_flow()
        self.test_rejection_flow()
        
        # Print final results
        self.print_final_results()
        
    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE VERIFICATION TESTING RESULTS")
        print("=" * 80)
        
        print(f"📈 Total Tests: {self.total_tests}")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"📊 Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%" if self.total_tests > 0 else "0%")
        
        print("\n🔍 DETAILED TEST BREAKDOWN:")
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            if result["details"]:
                print(f"   └─ {result['details']}")
        
        print("\n🎯 CRITICAL VERIFICATION RESULTS:")
        
        # Check critical functionality
        critical_tests = [
            ("User Signup & Authentication", ["User 1 Signup", "User 2 Signup", "User 1 Login"]),
            ("Admin Role Management", ["MongoDB Admin Role Update", "Admin Role Verification"]),
            ("Verification Request Flow", ["Submit Verification Request", "Check Verification Status"]),
            ("Admin Dashboard", ["Get Verification Requests", "Verify Request Data"]),
            ("Approval & Page Creation", ["Approve Verification Request", "User Verification Status", "Page Creation"]),
            ("Page Access", ["Get Page by User ID", "Get Page by ID"]),
            ("Rejection Flow", ["Reject Verification Request", "User 3 Remains Unverified"])
        ]
        
        for category, test_names in critical_tests:
            category_results = [r for r in self.test_results if r["test"] in test_names]
            if category_results:
                passed = sum(1 for r in category_results if r["success"])
                total = len(category_results)
                status = "✅" if passed == total else "❌"
                print(f"{status} {category}: {passed}/{total} tests passed")
        
        print("\n🔚 TESTING COMPLETE")
        print("=" * 80)

async def main():
    print("🧪 Improved Verified Accounts & Special Pages Backend Testing")
    print("=" * 60)
    
    tester = ImprovedVerificationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())