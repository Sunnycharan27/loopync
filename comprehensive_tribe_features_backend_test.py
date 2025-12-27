#!/usr/bin/env python3
"""
Comprehensive Tribe Features Backend Testing for Loopync Platform

**Test Environment:**
- Backend URL: https://talentloop-4.preview.emergentagent.com/api
- Test Credentials: test@test.com / testpassword123

**Test Scenarios:**
1. Authentication with test credentials
2. NEW APIs: Services, Collaborations, Portfolios, Ideas, Showcases, Resources
3. Follow Request System
4. Enhanced Reputation System
5. Existing APIs verification (projects, certifications, internships, events, workouts, challenges, reviews, deals)

This test focuses on all new tribe features implemented.
"""

import requests
import json
import sys
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://talentloop-4.preview.emergentagent.com/api"
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "testpassword123"

class ComprehensiveTribeFeaturesBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_results = []
        self.created_service_id = None
        self.created_collaboration_id = None
        self.created_portfolio_id = None
        self.created_idea_id = None
        self.created_showcase_id = None
        self.created_resource_id = None
        
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
    
    def make_request(self, method, endpoint, data=None, headers=None, files=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        # Add auth header if token available
        if self.token and headers is None:
            headers = {"Authorization": f"Bearer {self.token}"}
        elif self.token and headers:
            headers["Authorization"] = f"Bearer {self.token}"
        
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
            return None
    
    def test_authentication(self):
        """Test authentication with test credentials"""
        self.log("Testing authentication with test@test.com")
        
        response = self.make_request("POST", "/auth/login", {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.token = result["token"]
                self.user_id = result["user"]["id"]
                self.log_result("Authentication", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_result("Authentication", False, error="Invalid login response")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Authentication", False, error=error_msg)
            return False
    
    def test_services_api(self):
        """Test Services API - GET /api/services and POST /api/services"""
        self.log("Testing Services API")
        
        # Test GET /api/services
        response = self.make_request("GET", "/services")
        if response and response.status_code == 200:
            services = response.json()
            self.log_result("GET Services", True, f"Retrieved {len(services)} services")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("GET Services", False, error=error_msg)
        
        # Test POST /api/services
        service_data = {
            "title": "Backend Testing Service",
            "category": "Development",
            "price": 5000.0,
            "description": "Professional backend testing service"
        }
        
        response = self.make_request("POST", "/services", service_data)
        if response and response.status_code == 200:
            service_result = response.json()
            self.created_service_id = service_result.get("id")
            self.log_result("POST Services", True, f"Service ID: {self.created_service_id}")
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("POST Services", False, error=error_msg)
            return False
    
    def test_collaborations_api(self):
        """Test Collaborations API - GET /api/collaborations and POST /api/collaborations"""
        self.log("Testing Collaborations API")
        
        # Test GET /api/collaborations
        response = self.make_request("GET", "/collaborations")
        if response and response.status_code == 200:
            collaborations = response.json()
            self.log_result("GET Collaborations", True, f"Retrieved {len(collaborations)} collaborations")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("GET Collaborations", False, error=error_msg)
        
        # Test POST /api/collaborations
        collaboration_data = {
            "title": "Backend Testing Collaboration",
            "type": "Technical",
            "lookingFor": "Backend developers for testing collaboration",
            "description": "Looking for skilled backend developers"
        }
        
        response = self.make_request("POST", "/collaborations", collaboration_data)
        if response and response.status_code == 200:
            collaboration_result = response.json()
            self.created_collaboration_id = collaboration_result.get("id")
            self.log_result("POST Collaborations", True, f"Collaboration ID: {self.created_collaboration_id}")
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("POST Collaborations", False, error=error_msg)
            return False
    
    def test_portfolios_api(self):
        """Test Portfolios API - GET /api/portfolios and POST /api/portfolios"""
        self.log("Testing Portfolios API")
        
        # Test GET /api/portfolios
        response = self.make_request("GET", "/portfolios")
        if response and response.status_code == 200:
            portfolios = response.json()
            self.log_result("GET Portfolios", True, f"Retrieved {len(portfolios)} portfolios")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("GET Portfolios", False, error=error_msg)
        
        # Test POST /api/portfolios
        portfolio_data = {
            "title": "Backend Testing Portfolio",
            "category": "Software Development",
            "images": ["https://example.com/portfolio1.jpg", "https://example.com/portfolio2.jpg"],
            "description": "Portfolio showcasing backend testing skills"
        }
        
        response = self.make_request("POST", "/portfolios", portfolio_data)
        if response and response.status_code == 200:
            portfolio_result = response.json()
            self.created_portfolio_id = portfolio_result.get("id")
            self.log_result("POST Portfolios", True, f"Portfolio ID: {self.created_portfolio_id}")
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("POST Portfolios", False, error=error_msg)
            return False
    
    def test_ideas_api(self):
        """Test Ideas API - GET /api/ideas, POST /api/ideas, and POST /api/ideas/{id}/vote"""
        self.log("Testing Ideas API")
        
        # Test GET /api/ideas
        response = self.make_request("GET", "/ideas")
        if response and response.status_code == 200:
            ideas = response.json()
            self.log_result("GET Ideas", True, f"Retrieved {len(ideas)} ideas")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("GET Ideas", False, error=error_msg)
        
        # Test POST /api/ideas
        idea_data = {
            "title": "Backend Testing Automation Platform",
            "problem": "Manual backend testing is time-consuming and error-prone",
            "solution": "Automated testing platform for backend APIs",
            "stage": "Concept",
            "description": "A comprehensive platform for automated backend testing"
        }
        
        response = self.make_request("POST", "/ideas", idea_data)
        if response and response.status_code == 200:
            idea_result = response.json()
            self.created_idea_id = idea_result.get("id")
            self.log_result("POST Ideas", True, f"Idea ID: {self.created_idea_id}")
            
            # Test voting on the idea
            if self.created_idea_id:
                vote_response = self.make_request("POST", f"/ideas/{self.created_idea_id}/vote", params={"userId": self.user_id})
                if vote_response and vote_response.status_code == 200:
                    self.log_result("Vote on Idea", True, "Idea voted successfully")
                else:
                    error_msg = f"Status: {vote_response.status_code if vote_response else 'No response'}"
                    if vote_response:
                        error_msg += f", Response: {vote_response.text}"
                    self.log_result("Vote on Idea", False, error=error_msg)
            
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("POST Ideas", False, error=error_msg)
            return False
    
    def test_showcases_api(self):
        """Test Showcases API - GET /api/showcases and POST /api/showcases"""
        self.log("Testing Showcases API")
        
        # Test GET /api/showcases
        response = self.make_request("GET", "/showcases")
        if response and response.status_code == 200:
            showcases = response.json()
            self.log_result("GET Showcases", True, f"Retrieved {len(showcases)} showcases")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("GET Showcases", False, error=error_msg)
        
        # Test POST /api/showcases
        showcase_data = {
            "title": "Backend Testing Startup",
            "stage": "MVP",
            "metrics": {
                "users": 1000,
                "revenue": 50000,
                "growth": "20% MoM"
            },
            "fundingStage": "Seed",
            "description": "Startup focused on backend testing solutions"
        }
        
        response = self.make_request("POST", "/showcases", showcase_data)
        if response and response.status_code == 200:
            showcase_result = response.json()
            self.created_showcase_id = showcase_result.get("id")
            self.log_result("POST Showcases", True, f"Showcase ID: {self.created_showcase_id}")
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("POST Showcases", False, error=error_msg)
            return False
    
    def test_resources_api(self):
        """Test Resources API - GET /api/resources and POST /api/resources"""
        self.log("Testing Resources API")
        
        # Test GET /api/resources
        response = self.make_request("GET", "/resources")
        if response and response.status_code == 200:
            resources = response.json()
            self.log_result("GET Resources", True, f"Retrieved {len(resources)} resources")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("GET Resources", False, error=error_msg)
        
        # Test POST /api/resources
        resource_data = {
            "title": "Backend Testing Guide",
            "type": "Tutorial",
            "resourceUrl": "https://example.com/backend-testing-guide",
            "description": "Comprehensive guide for backend testing"
        }
        
        response = self.make_request("POST", "/resources", resource_data)
        if response and response.status_code == 200:
            resource_result = response.json()
            self.created_resource_id = resource_result.get("id")
            self.log_result("POST Resources", True, f"Resource ID: {self.created_resource_id}")
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("POST Resources", False, error=error_msg)
            return False
    
    def test_follow_request_system(self):
        """Test Follow Request System"""
        self.log("Testing Follow Request System")
        
        # First, get a list of users to test follow requests
        response = self.make_request("GET", "/users", params={"limit": 5})
        if not response or response.status_code != 200:
            self.log_result("Follow Request System - Get Users", False, error="Cannot get users list")
            return False
        
        users = response.json()
        if not users or len(users) < 2:
            self.log_result("Follow Request System - Get Users", False, error="Not enough users for testing")
            return False
        
        # Find a user different from current user
        target_user = None
        for user in users:
            if user.get("id") != self.user_id:
                target_user = user
                break
        
        if not target_user:
            self.log_result("Follow Request System - Find Target User", False, error="No target user found")
            return False
        
        target_user_id = target_user.get("id")
        
        # Test POST /api/users/{userId}/follow-request
        response = self.make_request("POST", f"/users/{target_user_id}/follow-request", params={"fromUserId": self.user_id})
        if response and response.status_code == 200:
            self.log_result("Send Follow Request", True, f"Follow request sent to user {target_user_id}")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Send Follow Request", False, error=error_msg)
        
        # Test GET /api/users/{userId}/follow-requests
        response = self.make_request("GET", f"/users/{self.user_id}/follow-requests")
        if response and response.status_code == 200:
            follow_requests = response.json()
            self.log_result("GET Follow Requests", True, f"Retrieved {len(follow_requests)} follow requests")
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("GET Follow Requests", False, error=error_msg)
            return False
    
    def test_reputation_system(self):
        """Test Enhanced Reputation System"""
        self.log("Testing Enhanced Reputation System")
        
        # Test GET /api/users/{userId}/reputation
        response = self.make_request("GET", f"/users/{self.user_id}/reputation")
        if response and response.status_code == 200:
            reputation = response.json()
            self.log_result("GET User Reputation", True, f"Reputation data retrieved")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("GET User Reputation", False, error=error_msg)
        
        # Test POST /api/users/{userId}/reputation/endorse
        endorse_data = {
            "skill": "Backend Development",
            "message": "Excellent backend testing skills"
        }
        
        response = self.make_request("POST", f"/users/{self.user_id}/reputation/endorse", endorse_data, params={"fromUserId": self.user_id})
        if response and response.status_code == 200:
            self.log_result("Endorse User Skill", True, "Skill endorsed successfully")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Endorse User Skill", False, error=error_msg)
        
        # Test GET /api/users/{userId}/endorsements
        response = self.make_request("GET", f"/users/{self.user_id}/endorsements")
        if response and response.status_code == 200:
            endorsements = response.json()
            self.log_result("GET User Endorsements", True, f"Retrieved {len(endorsements)} endorsements")
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("GET User Endorsements", False, error=error_msg)
            return False
    
    def test_existing_apis(self):
        """Test existing APIs to verify they still work"""
        self.log("Testing existing APIs")
        
        existing_endpoints = [
            ("/projects", "Projects"),
            ("/certifications", "Certifications"),
            ("/internships", "Internships"),
            ("/events", "Events"),
            ("/workouts", "Workouts"),
            ("/challenges", "Challenges"),
            ("/reviews", "Reviews"),
            ("/deals", "Deals")
        ]
        
        for endpoint, name in existing_endpoints:
            response = self.make_request("GET", endpoint)
            if response and response.status_code == 200:
                data = response.json()
                self.log_result(f"GET {name}", True, f"Retrieved {len(data)} {name.lower()}")
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                self.log_result(f"GET {name}", False, error=error_msg)
        
        return True
    
    def run_all_tests(self):
        """Run all comprehensive tribe features tests"""
        print("🚀 Starting Comprehensive Tribe Features Backend Testing")
        print("=" * 80)
        print(f"📍 API Base URL: {BASE_URL}")
        print(f"👤 Test User: {TEST_EMAIL}")
        print("=" * 80)
        
        # Authentication first
        if not self.test_authentication():
            print("❌ Authentication failed. Stopping tests.")
            return
        
        # Test new APIs
        self.test_services_api()
        self.test_collaborations_api()
        self.test_portfolios_api()
        self.test_ideas_api()
        self.test_showcases_api()
        self.test_resources_api()
        
        # Test follow request system
        self.test_follow_request_system()
        
        # Test reputation system
        self.test_reputation_system()
        
        # Test existing APIs
        self.test_existing_apis()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TRIBE FEATURES TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Group results by category
        new_api_tests = [r for r in self.test_results if any(api in r["test"] for api in ["Services", "Collaborations", "Portfolios", "Ideas", "Showcases", "Resources"])]
        follow_tests = [r for r in self.test_results if "Follow" in r["test"]]
        reputation_tests = [r for r in self.test_results if "Reputation" in r["test"] or "Endorse" in r["test"]]
        existing_tests = [r for r in self.test_results if any(api in r["test"] for api in ["Projects", "Certifications", "Internships", "Events", "Workouts", "Challenges", "Reviews", "Deals"])]
        
        print(f"\n📊 NEW APIS RESULTS:")
        for result in new_api_tests:
            status = "✅" if result["success"] else "❌"
            print(f"  {status} {result['test']}")
        
        print(f"\n👥 FOLLOW REQUEST SYSTEM:")
        for result in follow_tests:
            status = "✅" if result["success"] else "❌"
            print(f"  {status} {result['test']}")
        
        print(f"\n⭐ REPUTATION SYSTEM:")
        for result in reputation_tests:
            status = "✅" if result["success"] else "❌"
            print(f"  {status} {result['test']}")
        
        print(f"\n🔄 EXISTING APIS:")
        for result in existing_tests:
            status = "✅" if result["success"] else "❌"
            print(f"  {status} {result['test']}")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['error']}")
        
        print("\n" + "=" * 80)
        
        if passed_tests == total_tests:
            print("\n🎉 ALL TESTS PASSED - COMPREHENSIVE TRIBE FEATURES ARE WORKING!")
        elif failed_tests <= 3:
            print(f"\n⚠️ MINOR ISSUES FOUND - {failed_tests} tests failed")
        else:
            print(f"\n❌ MAJOR ISSUES FOUND - {failed_tests} tests failed")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = ComprehensiveTribeFeaturesBackendTester()
    tester.run_all_tests()
    sys.exit(0)