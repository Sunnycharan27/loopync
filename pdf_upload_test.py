#!/usr/bin/env python3
"""
PDF Upload Test for Resources Feature

Test Steps:
1. Login with test@test.com / testpassword123
2. Upload a test PDF file to /api/upload endpoint
3. Create a new resource with the uploaded PDF URL
4. Verify the resource was created successfully

Endpoints to test:
- POST /api/upload (with PDF file, content-type: application/pdf)
- POST /api/resources (create resource with the uploaded file URL)
- GET /api/resources (verify the resource exists)
"""

import requests
import json
import sys
import io
import time
from datetime import datetime

# Configuration
BASE_URL = "https://loopync-social-4.preview.emergentagent.com/api"
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "testpassword123"

class PDFUploadTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_results = []
        self.uploaded_file_url = None
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
                response = self.session.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == "POST":
                if files:
                    response = self.session.post(url, data=data, files=files, headers=headers, params=params, timeout=30)
                else:
                    response = self.session.post(url, json=data, headers=headers, params=params, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers, params=params, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, params=params, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request error: {e}", "ERROR")
            return None
    
    def test_login(self):
        """Test login with test credentials"""
        self.log("Testing login with test@test.com / testpassword123")
        
        response = self.make_request("POST", "/auth/login", {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response and response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.token = result["token"]
                self.user_id = result["user"]["id"]
                self.log_result("Login", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_result("Login", False, error="Invalid login response format")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Login", False, error=error_msg)
            return False
    
    def create_test_pdf(self):
        """Create a simple test PDF file in memory"""
        try:
            # Create a simple PDF content (minimal PDF structure)
            pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF for Resources) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF"""
            
            return io.BytesIO(pdf_content)
        except Exception as e:
            self.log(f"Error creating test PDF: {e}", "ERROR")
            return None
    
    def test_pdf_upload(self):
        """Test uploading a PDF file to /api/upload endpoint"""
        self.log("Testing PDF upload to /api/upload endpoint")
        
        # Create test PDF file
        pdf_file = self.create_test_pdf()
        if not pdf_file:
            self.log_result("PDF Upload", False, error="Failed to create test PDF")
            return False
        
        # Prepare file for upload
        files = {
            'file': ('test_resource.pdf', pdf_file, 'application/pdf')
        }
        
        # Upload without Authorization header for file upload
        headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        response = self.make_request("POST", "/upload", files=files, headers=headers)
        
        if response and response.status_code == 200:
            result = response.json()
            self.log(f"Upload response: {result}")
            
            # Check for file URL in response
            if "url" in result:
                self.uploaded_file_url = result["url"]
                self.log_result("PDF Upload", True, f"File URL: {self.uploaded_file_url}")
                return True
            elif "fileUrl" in result:
                self.uploaded_file_url = result["fileUrl"]
                self.log_result("PDF Upload", True, f"File URL: {self.uploaded_file_url}")
                return True
            else:
                self.log_result("PDF Upload", False, error="No file URL in upload response")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("PDF Upload", False, error=error_msg)
            return False
    
    def test_create_resource(self):
        """Test creating a resource with the uploaded PDF URL"""
        if not self.uploaded_file_url:
            self.log_result("Create Resource", False, error="No uploaded file URL available")
            return False
        
        self.log("Testing resource creation with uploaded PDF")
        
        # Create resource data
        resource_data = {
            "title": "Test PDF Resource",
            "description": "A test PDF resource for backend testing",
            "category": "documents",
            "fileUrl": self.uploaded_file_url,
            "fileType": "pdf",
            "fileSize": "1.2 KB",
            "tags": ["test", "pdf", "backend"],
            "isFree": True
        }
        
        response = self.make_request("POST", "/resources", resource_data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.log(f"Resource creation response: {result}")
            
            if "id" in result:
                self.created_resource_id = result["id"]
                self.log_result("Create Resource", True, f"Resource ID: {self.created_resource_id}")
                return True
            else:
                self.log_result("Create Resource", False, error="No resource ID in response")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Create Resource", False, error=error_msg)
            return False
    
    def test_verify_resource(self):
        """Test verifying the resource was created successfully"""
        self.log("Testing resource verification via GET /api/resources")
        
        response = self.make_request("GET", "/resources")
        
        if response and response.status_code == 200:
            resources = response.json()
            self.log(f"Retrieved {len(resources)} resources")
            
            # Look for our created resource
            if self.created_resource_id:
                found_resource = None
                for resource in resources:
                    if resource.get("id") == self.created_resource_id:
                        found_resource = resource
                        break
                
                if found_resource:
                    self.log_result("Verify Resource", True, f"Resource found: {found_resource.get('title')}")
                    
                    # Verify resource details
                    if found_resource.get("fileUrl") == self.uploaded_file_url:
                        self.log("✅ File URL matches uploaded file")
                    else:
                        self.log("❌ File URL mismatch", "ERROR")
                    
                    if found_resource.get("fileType") == "pdf":
                        self.log("✅ File type is correctly set to PDF")
                    else:
                        self.log("❌ File type is not PDF", "ERROR")
                    
                    return True
                else:
                    self.log_result("Verify Resource", False, error="Created resource not found in resources list")
                    return False
            else:
                # Just verify we can get resources
                self.log_result("Verify Resource", True, f"Resources endpoint working, {len(resources)} resources found")
                return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f", Response: {response.text}"
            self.log_result("Verify Resource", False, error=error_msg)
            return False
    
    def run_pdf_upload_test(self):
        """Run the complete PDF upload test"""
        print("🚀 Starting PDF Upload Test for Resources Feature")
        print("=" * 60)
        print(f"📍 API Base URL: {BASE_URL}")
        print(f"👤 Test User: {TEST_EMAIL}")
        print("=" * 60)
        
        # Step 1: Login
        if not self.test_login():
            print("❌ Login failed. Cannot proceed with PDF upload test.")
            return False
        
        # Step 2: Upload PDF
        if not self.test_pdf_upload():
            print("❌ PDF upload failed. Cannot proceed with resource creation.")
            return False
        
        # Step 3: Create Resource
        if not self.test_create_resource():
            print("❌ Resource creation failed.")
            return False
        
        # Step 4: Verify Resource
        if not self.test_verify_resource():
            print("❌ Resource verification failed.")
            return False
        
        # Print summary
        self.print_summary()
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 PDF UPLOAD TEST SUMMARY")
        print("=" * 60)
        
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
        
        print("\n" + "=" * 60)
        
        if passed_tests == total_tests:
            print("\n🎉 ALL PDF UPLOAD TESTS PASSED!")
            print("✅ PDF upload functionality is working correctly")
        else:
            print(f"\n❌ PDF UPLOAD ISSUES FOUND - {failed_tests} tests failed")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = PDFUploadTester()
    success = tester.run_pdf_upload_test()
    sys.exit(0 if success else 1)