#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Loopync Platform - Tribe Content Features

**Test Environment:**
- Backend URL: https://student-tribes.preview.emergentagent.com/api
- Test Credentials: test@test.com / testpassword123

**Test Cases:**
1. Authentication
2. Tribe APIs
3. Workout APIs (Fitness Tribes)
4. Challenge APIs
5. Menu Item APIs (Food Tribes)
6. Deal APIs
7. Review APIs
8. Story/VibeCapsule APIs
9. Student Discovery
10. Internship APIs
"""

import requests
import json
import sys
import time
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://student-tribes.preview.emergentagent.com/api"
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "testpassword123"

class LoopyncTribeContentTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_results = []
        self.created_tribe_id = None
        self.created_fitness_tribe_id = None
        self.created_food_tribe_id = None
        self.created_workout_id = None
        self.created_challenge_id = None
        self.created_menu_item_id = None
        self.created_deal_id = None
        self.created_story_id = None
        self.created_internship_id = None
        
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
                response = self.session.get(url, headers=headers, params=params, timeout=15)
            elif method.upper() == "POST":
                if files:
                    response = self.session.post(url, data=data, files=files, headers=headers, params=params, timeout=15)
                else:
                    response = self.session.post(url, json=data, headers=headers, params=params, timeout=15)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, params=params, timeout=15)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, params=params, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request error: {str(e)}", "ERROR")
            return None
    
    def test_authentication(self):
        """Test 1: Authentication - Login with test credentials"""
        self.log("Testing authentication with test credentials...")
        
        response = self.make_request("POST", "/auth/login", {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.token = result["token"]
                self.user_id = result["user"]["id"]
                self.log_result("Authentication Login", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_result("Authentication Login", False, error="Invalid login response structure")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Authentication Login", False, error=error_msg)
            return False
    
    def test_tribe_apis(self):
        """Test 2: Tribe APIs - List, Create, Get details"""
        self.log("Testing Tribe APIs...")
        
        # Get all tribes
        response = self.make_request("GET", "/tribes")
        if response and response.status_code == 200:
            tribes = response.json()
            self.log_result("Get All Tribes", True, f"Retrieved {len(tribes)} tribes")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get All Tribes", False, error=error_msg)
        
        # Create a fitness tribe
        fitness_tribe_data = {
            "name": "API Test Fitness Tribe",
            "description": "A fitness tribe created via API testing",
            "category": "fitness",
            "type": "public",
            "tags": ["fitness", "gym", "workout"]
        }
        
        response = self.make_request("POST", "/tribes", fitness_tribe_data, params={"ownerId": self.user_id})
        if response and response.status_code == 200:
            tribe_result = response.json()
            self.created_fitness_tribe_id = tribe_result.get("id")
            if self.created_fitness_tribe_id:
                self.log_result("Create Fitness Tribe", True, f"Tribe ID: {self.created_fitness_tribe_id}")
            else:
                self.log_result("Create Fitness Tribe", False, error="No tribe ID returned")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Fitness Tribe", False, error=error_msg)
            return False
        
        # Create a food tribe
        food_tribe_data = {
            "name": "API Test Food Tribe",
            "description": "A food tribe created via API testing",
            "category": "food",
            "type": "public",
            "tags": ["food", "restaurant", "cuisine"]
        }
        
        response = self.make_request("POST", "/tribes", food_tribe_data, params={"ownerId": self.user_id})
        if response and response.status_code == 200:
            tribe_result = response.json()
            self.created_food_tribe_id = tribe_result.get("id")
            if self.created_food_tribe_id:
                self.log_result("Create Food Tribe", True, f"Tribe ID: {self.created_food_tribe_id}")
            else:
                self.log_result("Create Food Tribe", False, error="No tribe ID returned")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Food Tribe", False, error=error_msg)
            return False
        
        # Get tribe details
        if self.created_fitness_tribe_id:
            response = self.make_request("GET", f"/tribes/{self.created_fitness_tribe_id}")
            if response and response.status_code == 200:
                tribe_details = response.json()
                if "id" in tribe_details and tribe_details["id"] == self.created_fitness_tribe_id:
                    self.log_result("Get Tribe Details", True, f"Retrieved tribe: {tribe_details.get('name')}")
                else:
                    self.log_result("Get Tribe Details", False, error="Invalid tribe details")
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                self.log_result("Get Tribe Details", False, error=error_msg)
        
        return True
    
    def test_workout_apis(self):
        """Test 3: Workout APIs (Fitness Tribes)"""
        self.log("Testing Workout APIs for Fitness Tribes...")
        
        if not self.created_fitness_tribe_id:
            self.log_result("Workout APIs Test", False, error="No fitness tribe available for testing")
            return False
        
        # Create a workout
        workout_data = {
            "title": "API Test Workout",
            "tribeId": self.created_fitness_tribe_id,
            "duration": 30,
            "difficulty": "intermediate",
            "targetMuscles": ["Chest", "Core"],
            "description": "A comprehensive workout created via API testing",
            "exercises": [
                {
                    "name": "Push-ups",
                    "sets": 3,
                    "reps": 15,
                    "duration": None
                },
                {
                    "name": "Plank",
                    "sets": 3,
                    "reps": None,
                    "duration": 60
                }
            ]
        }
        
        response = self.make_request("POST", "/workouts", workout_data, params={"authorId": self.user_id})
        if response and response.status_code == 200:
            workout_result = response.json()
            self.created_workout_id = workout_result.get("id")
            if self.created_workout_id:
                self.log_result("Create Workout", True, f"Workout ID: {self.created_workout_id}")
            else:
                self.log_result("Create Workout", False, error="No workout ID returned")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Workout", False, error=error_msg)
            return False
        
        # Get workouts for the tribe
        response = self.make_request("GET", "/workouts", params={"tribeId": self.created_fitness_tribe_id})
        if response and response.status_code == 200:
            workouts = response.json()
            if isinstance(workouts, list):
                self.log_result("Get Tribe Workouts", True, f"Retrieved {len(workouts)} workouts")
            else:
                self.log_result("Get Tribe Workouts", False, error="Invalid workouts response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get Tribe Workouts", False, error=error_msg)
        
        return True
    
    def test_challenge_apis(self):
        """Test 4: Challenge APIs"""
        self.log("Testing Challenge APIs...")
        
        if not self.created_fitness_tribe_id:
            self.log_result("Challenge APIs Test", False, error="No fitness tribe available for testing")
            return False
        
        # Create a challenge
        challenge_data = {
            "title": "API Test Challenge",
            "description": "30-day fitness challenge created via API testing",
            "tribeId": self.created_fitness_tribe_id,
            "type": "fitness",
            "goal": "Complete 100 push-ups daily for 30 days",
            "duration": "30 Days",
            "reward": 500,  # Loop credits
            "startDate": datetime.now().isoformat(),
            "endDate": (datetime.now().replace(day=datetime.now().day + 30)).isoformat()
        }
        
        response = self.make_request("POST", "/challenges", challenge_data, params={"authorId": self.user_id})
        if response and response.status_code == 200:
            challenge_result = response.json()
            self.created_challenge_id = challenge_result.get("id")
            if self.created_challenge_id:
                self.log_result("Create Challenge", True, f"Challenge ID: {self.created_challenge_id}")
            else:
                self.log_result("Create Challenge", False, error="No challenge ID returned")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Challenge", False, error=error_msg)
            return False
        
        # Get challenges for the tribe
        response = self.make_request("GET", "/challenges", params={"tribeId": self.created_fitness_tribe_id})
        if response and response.status_code == 200:
            challenges = response.json()
            if isinstance(challenges, list):
                self.log_result("Get Tribe Challenges", True, f"Retrieved {len(challenges)} challenges")
            else:
                self.log_result("Get Tribe Challenges", False, error="Invalid challenges response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get Tribe Challenges", False, error=error_msg)
        
        return True
    
    def test_menu_item_apis(self):
        """Test 5: Menu Item APIs (Food Tribes)"""
        self.log("Testing Menu Item APIs for Food Tribes...")
        
        if not self.created_food_tribe_id:
            self.log_result("Menu Item APIs Test", False, error="No food tribe available for testing")
            return False
        
        # Create a menu item
        menu_item_data = {
            "name": "API Test Paneer Tikka",
            "description": "Delicious paneer tikka created via API testing",
            "price": 299.0,
            "category": "Starters",
            "tribeId": self.created_food_tribe_id,
            "isVegetarian": True,
            "isVegan": False,
            "allergens": ["Dairy"],
            "preparationTime": 20,
            "spiceLevel": "Medium"
        }
        
        response = self.make_request("POST", "/menu-items", menu_item_data, params={"authorId": self.user_id})
        if response and response.status_code == 200:
            menu_item_result = response.json()
            self.created_menu_item_id = menu_item_result.get("id")
            if self.created_menu_item_id:
                self.log_result("Create Menu Item", True, f"Menu Item ID: {self.created_menu_item_id}")
            else:
                self.log_result("Create Menu Item", False, error="No menu item ID returned")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Menu Item", False, error=error_msg)
            return False
        
        # Get menu items for the tribe
        response = self.make_request("GET", "/menu-items", params={"tribeId": self.created_food_tribe_id})
        if response and response.status_code == 200:
            menu_items = response.json()
            if isinstance(menu_items, list):
                self.log_result("Get Tribe Menu Items", True, f"Retrieved {len(menu_items)} menu items")
            else:
                self.log_result("Get Tribe Menu Items", False, error="Invalid menu items response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get Tribe Menu Items", False, error=error_msg)
        
        return True
    
    def test_deal_apis(self):
        """Test 6: Deal APIs"""
        self.log("Testing Deal APIs...")
        
        if not self.created_food_tribe_id:
            self.log_result("Deal APIs Test", False, error="No food tribe available for testing")
            return False
        
        # Create a deal
        deal_data = {
            "title": "API Test Weekend Special",
            "description": "20% off on all items - Weekend special created via API testing",
            "discount": 20,
            "discountType": "percentage",
            "tribeId": self.created_food_tribe_id,
            "validFrom": datetime.now().isoformat(),
            "validUntil": (datetime.now().replace(day=datetime.now().day + 7)).isoformat(),
            "terms": "Valid only on weekends",
            "maxUses": 100
        }
        
        response = self.make_request("POST", "/deals", deal_data)
        if response and response.status_code == 200:
            deal_result = response.json()
            self.created_deal_id = deal_result.get("id")
            if self.created_deal_id:
                self.log_result("Create Deal", True, f"Deal ID: {self.created_deal_id}")
            else:
                self.log_result("Create Deal", False, error="No deal ID returned")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Deal", False, error=error_msg)
            return False
        
        # Get deals for the tribe
        response = self.make_request("GET", "/deals", params={"tribeId": self.created_food_tribe_id})
        if response and response.status_code == 200:
            deals = response.json()
            if isinstance(deals, list):
                self.log_result("Get Tribe Deals", True, f"Retrieved {len(deals)} deals")
            else:
                self.log_result("Get Tribe Deals", False, error="Invalid deals response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get Tribe Deals", False, error=error_msg)
        
        return True
    
    def test_review_apis(self):
        """Test 7: Review APIs"""
        self.log("Testing Review APIs...")
        
        if not self.created_food_tribe_id:
            self.log_result("Review APIs Test", False, error="No food tribe available for testing")
            return False
        
        # Create a review
        review_data = {
            "rating": 5,
            "comment": "Excellent food and service! Created via API testing.",
            "tribeId": self.created_food_tribe_id,
            "reviewType": "tribe",
            "tags": ["excellent", "recommended", "great_service"]
        }
        
        response = self.make_request("POST", "/reviews", review_data)
        if response and response.status_code == 200:
            review_result = response.json()
            review_id = review_result.get("id")
            if review_id:
                self.log_result("Create Review", True, f"Review ID: {review_id}")
            else:
                self.log_result("Create Review", False, error="No review ID returned")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Review", False, error=error_msg)
            return False
        
        # Get reviews for the tribe
        response = self.make_request("GET", "/reviews", params={"tribeId": self.created_food_tribe_id})
        if response and response.status_code == 200:
            reviews = response.json()
            if isinstance(reviews, list):
                self.log_result("Get Tribe Reviews", True, f"Retrieved {len(reviews)} reviews")
            else:
                self.log_result("Get Tribe Reviews", False, error="Invalid reviews response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get Tribe Reviews", False, error=error_msg)
        
        return True
    
    def test_vibe_capsule_apis(self):
        """Test 8: Story/VibeCapsule APIs"""
        self.log("Testing Story/VibeCapsule APIs...")
        
        # Create a vibe capsule (story)
        story_data = {
            "mediaType": "image",
            "mediaUrl": "https://example.com/test-story-image.jpg",
            "caption": "API Test Story - Created via backend testing",
            "music": {
                "trackId": "test_track_123",
                "name": "Test Song",
                "artist": "Test Artist",
                "albumArt": "https://example.com/album-art.jpg",
                "previewUrl": "https://example.com/preview.mp3",
                "spotifyUrl": "https://open.spotify.com/track/test",
                "startTime": 0,
                "clipDuration": 30
            },
            "location": {
                "name": "Mumbai, Maharashtra",
                "lat": 19.0760,
                "lng": 72.8777
            },
            "duration": 15
        }
        
        response = self.make_request("POST", "/vibe-capsules", story_data)
        if response and response.status_code == 200:
            story_result = response.json()
            self.created_story_id = story_result.get("id")
            if self.created_story_id:
                self.log_result("Create VibeCapsule Story", True, f"Story ID: {self.created_story_id}")
            else:
                self.log_result("Create VibeCapsule Story", False, error="No story ID returned")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create VibeCapsule Story", False, error=error_msg)
            return False
        
        # Get all stories
        response = self.make_request("GET", "/capsules")
        if response and response.status_code == 200:
            capsules_data = response.json()
            if "stories" in capsules_data:
                stories = capsules_data["stories"]
                self.log_result("Get All Stories", True, f"Retrieved {len(stories)} story groups")
            else:
                self.log_result("Get All Stories", False, error="Invalid stories response structure")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get All Stories", False, error=error_msg)
        
        return True
    
    def test_student_discovery_apis(self):
        """Test 9: Student Discovery APIs"""
        self.log("Testing Student Discovery APIs...")
        
        # Get discoverable students
        response = self.make_request("GET", "/students/discover")
        if response and response.status_code == 200:
            students = response.json()
            if isinstance(students, list):
                self.log_result("Get Discoverable Students", True, f"Retrieved {len(students)} students")
            else:
                self.log_result("Get Discoverable Students", False, error="Invalid students response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get Discoverable Students", False, error=error_msg)
        
        # Get students by skill filter
        response = self.make_request("GET", "/students/discover", params={"skill": "Python"})
        if response and response.status_code == 200:
            python_students = response.json()
            if isinstance(python_students, list):
                self.log_result("Get Students by Skill Filter", True, f"Retrieved {len(python_students)} Python students")
            else:
                self.log_result("Get Students by Skill Filter", False, error="Invalid filtered students response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get Students by Skill Filter", False, error=error_msg)
        
        return True
    
    def test_internship_apis(self):
        """Test 10: Internship APIs"""
        self.log("Testing Internship APIs...")
        
        # Create an internship listing
        internship_data = {
            "title": "API Test Software Engineering Internship",
            "company": "Test Tech Company",
            "description": "A software engineering internship created via API testing",
            "location": "Mumbai, India",
            "type": "remote",
            "duration": "3 months",
            "stipend": 25000,
            "requirements": ["Python", "React", "MongoDB"],
            "skills": ["Backend Development", "Frontend Development", "Database Design"],
            "applicationDeadline": (datetime.now().replace(day=datetime.now().day + 30)).isoformat(),
            "startDate": (datetime.now().replace(day=datetime.now().day + 45)).isoformat(),
            "contactEmail": "hr@testtech.com",
            "isActive": True
        }
        
        response = self.make_request("POST", "/internships", internship_data)
        if response and response.status_code == 200:
            internship_result = response.json()
            self.created_internship_id = internship_result.get("id")
            if self.created_internship_id:
                self.log_result("Create Internship", True, f"Internship ID: {self.created_internship_id}")
            else:
                self.log_result("Create Internship", False, error="No internship ID returned")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Internship", False, error=error_msg)
            return False
        
        # Get all internships
        response = self.make_request("GET", "/internships")
        if response and response.status_code == 200:
            internships = response.json()
            if isinstance(internships, list):
                self.log_result("Get All Internships", True, f"Retrieved {len(internships)} internships")
            else:
                self.log_result("Get All Internships", False, error="Invalid internships response")
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_result("Get All Internships", False, error=error_msg)
        
        return True
    
    def run_all_tests(self):
        """Run all Loopync tribe content tests"""
        print("🚀 Starting Comprehensive Backend API Testing for Loopync Platform")
        print("🎯 Focus: Tribe Content Features")
        print("=" * 80)
        print(f"📍 API Base URL: {BASE_URL}")
        print(f"👤 Test User: {TEST_EMAIL}")
        print("=" * 80)
        
        # Run all tests in sequence
        tests = [
            self.test_authentication,
            self.test_tribe_apis,
            self.test_workout_apis,
            self.test_challenge_apis,
            self.test_menu_item_apis,
            self.test_deal_apis,
            self.test_review_apis,
            self.test_vibe_capsule_apis,
            self.test_student_discovery_apis,
            self.test_internship_apis
        ]
        
        for test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log(f"Test {test_func.__name__} failed with exception: {str(e)}", "ERROR")
                self.log_result(test_func.__name__, False, error=str(e))
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 LOOPYNC TRIBE CONTENT TESTING SUMMARY")
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
        
        # Critical issues summary
        critical_failures = [r for r in self.test_results if not r["success"] and any(word in r["test"].lower() for word in ["auth", "login", "tribe"])]
        
        if critical_failures:
            print("🚨 CRITICAL ISSUES FOUND:")
            for failure in critical_failures:
                print(f"  • {failure['test']}: {failure['error']}")
        
        if passed_tests == total_tests:
            print("\n🎉 ALL TESTS PASSED - LOOPYNC TRIBE CONTENT APIS ARE WORKING!")
        elif failed_tests <= 2:
            print(f"\n⚠️ MINOR ISSUES FOUND - {failed_tests} tests failed")
        else:
            print(f"\n❌ MAJOR ISSUES FOUND - {failed_tests} tests failed")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = LoopyncTribeContentTester()
    tester.run_all_tests()
    sys.exit(0)