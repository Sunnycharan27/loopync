#!/usr/bin/env python3
"""
PDF Resources Upload Feature Testing

Test the Free Resources (Digital Products) upload feature with PDF files.

Test Steps:
1. Login and get auth token
2. Upload a PDF file to /api/upload endpoint
3. Create a digital product with the uploaded PDF:
   - POST /api/digital-products?authorId={userId}
   - Body: { title, description, category: "pdfs", fileUrl, fileType: "pdf", fileSize }
4. Verify the product was created via GET /api/digital-products

Test Credentials:
- Email: test@test.com
- Password: testpassword123

Expected Result:
- PDF upload should succeed (no "file type not supported" error)
- Digital product should be created with fileType: "pdf"
"""

import requests
import json
import sys
import io
import time
from datetime import datetime

# Configuration
BASE_URL = "https://talentloop-4.preview.emergentagent.com/api"
TEST_EMAIL = "test@test.com"
TEST_PASSWORD = "testpassword123"

class PDFResourcesTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_results = []
        
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
    
    def create_test_pdf(self):
        """Create a test PDF file in memory"""
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
    
    def test_step_1_login(self):
        """Step 1: Login and get auth token"""
        self.log("Step 1: Login and get auth token")
        
        response = self.make_request("POST", "/auth/login", {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if not response:
            self.log_result("Step 1: Login", False, error="No response from login endpoint")
            return False
        
        if response.status_code == 200:
            result = response.json()
            if "token" in result and "user" in result:
                self.token = result["token"]
                self.user_id = result["user"]["id"]
                self.log_result("Step 1: Login", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_result("Step 1: Login", False, error="Invalid login response format")
                return False
        else:
            error_msg = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Step 1: Login", False, error=error_msg)
            return False
    
    def test_step_2_upload_pdf(self):
        """Step 2: Upload a PDF file to /api/upload endpoint"""
        self.log("Step 2: Upload PDF file to /api/upload endpoint")
        
        # Create test PDF file
        pdf_file = self.create_test_pdf()
        if not pdf_file:
            self.log_result("Step 2: PDF Upload", False, error="Failed to create test PDF")
            return None
        
        # Prepare file for upload
        files = {
            'file': ('test_resource.pdf', pdf_file, 'application/pdf')
        }
        
        # Upload file (remove Authorization header for file upload if needed)
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else None
        
        response = self.make_request("POST", "/upload", files=files, headers=headers)
        
        if not response:
            self.log_result("Step 2: PDF Upload", False, error="No response from upload endpoint")
            return None
        
        if response.status_code == 200:
            result = response.json()
            file_url = result.get("url") or result.get("fileUrl")
            file_size = result.get("size") or result.get("fileSize", "Unknown")
            
            if file_url:
                self.log_result("Step 2: PDF Upload", True, f"File URL: {file_url}, Size: {file_size}")
                return file_url
            else:
                self.log_result("Step 2: PDF Upload", False, error="No file URL in upload response")
                return None
        else:
            error_msg = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Step 2: PDF Upload", False, error=error_msg)
            return None
    
    def test_step_3_create_digital_product(self, file_url):
        """Step 3: Create a digital product with the uploaded PDF"""
        self.log("Step 3: Create digital product with uploaded PDF")
        
        if not file_url:
            self.log_result("Step 3: Create Digital Product", False, error="No file URL provided")
            return None
        
        # Create digital product data
        product_data = {
            "title": "Test PDF Resource",
            "description": "A test PDF resource for backend testing",
            "category": "pdfs",
            "fileUrl": file_url,
            "fileType": "pdf",
            "fileSize": "1.2 KB",
            "tags": ["test", "pdf", "resource"]
        }
        
        response = self.make_request("POST", "/digital-products", product_data, params={"authorId": self.user_id})
        
        if not response:
            self.log_result("Step 3: Create Digital Product", False, error="No response from digital-products endpoint")
            return None
        
        if response.status_code == 200:
            result = response.json()
            product_id = result.get("id")
            
            if product_id:
                self.log_result("Step 3: Create Digital Product", True, f"Product ID: {product_id}")
                return product_id
            else:
                self.log_result("Step 3: Create Digital Product", False, error="No product ID in response")
                return None
        else:
            error_msg = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Step 3: Create Digital Product", False, error=error_msg)
            return None
    
    def test_step_4_verify_product(self, product_id):
        """Step 4: Verify the product was created via GET /api/digital-products"""
        self.log("Step 4: Verify product creation via GET /api/digital-products")
        
        response = self.make_request("GET", "/digital-products")
        
        if not response:
            self.log_result("Step 4: Verify Product", False, error="No response from digital-products endpoint")
            return False
        
        if response.status_code == 200:
            response_data = response.json()
            
            # Handle both direct array and object with products array
            if isinstance(response_data, list):
                products = response_data
            elif isinstance(response_data, dict) and "products" in response_data:
                products = response_data["products"]
            else:
                self.log_result("Step 4: Verify Product", False, error="Invalid response format")
                return False
            
            # Find our created product
            created_product = None
            for product in products:
                if product.get("id") == product_id:
                    created_product = product
                    break
            
            if created_product:
                # Verify product details
                file_type = created_product.get("fileType")
                category = created_product.get("category")
                title = created_product.get("title")
                
                if file_type == "pdf" and category == "pdfs":
                    self.log_result("Step 4: Verify Product", True, 
                                  f"Product found: {title}, Type: {file_type}, Category: {category}")
                    return True
                else:
                    self.log_result("Step 4: Verify Product", False, 
                                  error=f"Product found but incorrect details: fileType={file_type}, category={category}")
                    return False
            else:
                self.log_result("Step 4: Verify Product", False, error=f"Product with ID {product_id} not found")
                return False
        else:
            error_msg = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Step 4: Verify Product", False, error=error_msg)
            return False
    
    def run_pdf_resources_test(self):
        """Run the complete PDF Resources upload test"""
        print("🚀 Starting PDF Resources Upload Feature Testing")
        print("=" * 80)
        print(f"📍 API Base URL: {BASE_URL}")
        print(f"📧 Test Email: {TEST_EMAIL}")
        print("=" * 80)
        
        # Step 1: Login
        if not self.test_step_1_login():
            print("❌ Login failed. Stopping tests.")
            return False
        
        # Step 2: Upload PDF
        file_url = self.test_step_2_upload_pdf()
        if not file_url:
            print("❌ PDF upload failed. Stopping tests.")
            return False
        
        # Step 3: Create Digital Product
        product_id = self.test_step_3_create_digital_product(file_url)
        if not product_id:
            print("❌ Digital product creation failed. Stopping tests.")
            return False
        
        # Step 4: Verify Product
        if not self.test_step_4_verify_product(product_id):
            print("❌ Product verification failed.")
            return False
        
        # Print summary
        self.print_summary()
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 PDF RESOURCES UPLOAD TEST SUMMARY")
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
            print("\n🎉 ALL PDF RESOURCES TESTS PASSED!")
            print("✅ PDF upload functionality is working correctly")
            print("✅ Digital product creation with PDF files is functional")
            print("✅ No 'file type not supported' errors found")
        else:
            print(f"\n❌ {failed_tests} TEST(S) FAILED")
            print("❌ PDF Resources upload feature has issues")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = PDFResourcesTester()
    success = tester.run_pdf_resources_test()
    sys.exit(0 if success else 1)