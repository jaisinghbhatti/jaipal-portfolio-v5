import asyncio
import aiohttp
import json
import os
from datetime import datetime
import sys

# Get the backend URL from frontend .env file
BACKEND_URL = "https://jsb-showcase.preview.emergentagent.com/api"

class ContactFormTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        
    async def setup(self):
        """Setup test session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
            
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
            
    async def test_api_health_check(self):
        """Test GET /api/ endpoint to ensure backend is running"""
        try:
            async with self.session.get(f"{BACKEND_URL}/") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("message") == "Hello World":
                        self.log_result("API Health Check", True, "Backend is running and responding correctly")
                        
                        # Check CORS headers
                        cors_headers = response.headers.get('Access-Control-Allow-Origin')
                        if cors_headers:
                            self.log_result("CORS Headers", True, f"CORS headers present: {cors_headers}")
                        else:
                            self.log_result("CORS Headers", False, "CORS headers not found")
                    else:
                        self.log_result("API Health Check", False, f"Unexpected response: {data}")
                else:
                    self.log_result("API Health Check", False, f"HTTP {response.status}: {await response.text()}")
        except Exception as e:
            self.log_result("API Health Check", False, f"Connection error: {str(e)}")
            
    async def test_contact_form_valid_submission(self):
        """Test successful form submission with valid data"""
        test_data = {
            "name": "Test User",
            "email": "test@example.com",
            "message": "This is a test message from the automated testing system"
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/contact",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify response format matches ContactResponse model
                    required_fields = ["success", "message", "id"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_result("Valid Submission - Response Format", False, 
                                      f"Missing fields in response: {missing_fields}")
                    else:
                        if data.get("success") is True and data.get("id"):
                            self.log_result("Valid Submission", True, 
                                          f"Form submitted successfully. ID: {data.get('id')}")
                            return data.get("id")  # Return ID for database verification
                        else:
                            self.log_result("Valid Submission", False, 
                                          f"Unexpected response format: {data}")
                else:
                    error_text = await response.text()
                    self.log_result("Valid Submission", False, 
                                  f"HTTP {response.status}: {error_text}")
        except Exception as e:
            self.log_result("Valid Submission", False, f"Request error: {str(e)}")
            
        return None
        
    async def test_contact_form_validation_errors(self):
        """Test validation errors with invalid data"""
        
        # Test empty name
        test_cases = [
            {
                "name": "Empty Name",
                "data": {"name": "", "email": "test@example.com", "message": "This is a valid message"},
                "expected_error": "name validation"
            },
            {
                "name": "Invalid Email",
                "data": {"name": "Test User", "email": "invalid-email", "message": "This is a valid message"},
                "expected_error": "email validation"
            },
            {
                "name": "Short Message",
                "data": {"name": "Test User", "email": "test@example.com", "message": "Short"},
                "expected_error": "message length validation"
            }
        ]
        
        for test_case in test_cases:
            try:
                async with self.session.post(
                    f"{BACKEND_URL}/contact",
                    json=test_case["data"],
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == 422:
                        error_data = await response.json()
                        self.log_result(f"Validation - {test_case['name']}", True, 
                                      f"Correctly rejected invalid data with 422 status",
                                      f"Error details: {error_data}")
                    else:
                        response_text = await response.text()
                        self.log_result(f"Validation - {test_case['name']}", False, 
                                      f"Expected 422 but got {response.status}",
                                      f"Response: {response_text}")
            except Exception as e:
                self.log_result(f"Validation - {test_case['name']}", False, 
                              f"Request error: {str(e)}")
                
    async def test_malformed_requests(self):
        """Test error handling with malformed requests"""
        
        # Test with invalid JSON
        try:
            async with self.session.post(
                f"{BACKEND_URL}/contact",
                data="invalid json",
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status in [400, 422]:
                    self.log_result("Malformed JSON", True, 
                                  f"Correctly handled malformed JSON with status {response.status}")
                else:
                    self.log_result("Malformed JSON", False, 
                                  f"Unexpected status {response.status} for malformed JSON")
        except Exception as e:
            self.log_result("Malformed JSON", False, f"Request error: {str(e)}")
            
        # Test with missing content-type
        try:
            async with self.session.post(
                f"{BACKEND_URL}/contact",
                data=json.dumps({"name": "Test", "email": "test@example.com", "message": "Test message"})
            ) as response:
                
                # Should still work or give appropriate error
                if response.status in [200, 400, 422]:
                    self.log_result("Missing Content-Type", True, 
                                  f"Handled missing content-type appropriately with status {response.status}")
                else:
                    self.log_result("Missing Content-Type", False, 
                                  f"Unexpected status {response.status}")
        except Exception as e:
            self.log_result("Missing Content-Type", False, f"Request error: {str(e)}")
            
    async def test_database_integration(self):
        """Test database integration by retrieving submissions"""
        try:
            async with self.session.get(f"{BACKEND_URL}/contact") as response:
                if response.status == 200:
                    submissions = await response.json()
                    
                    if isinstance(submissions, list):
                        self.log_result("Database Retrieval", True, 
                                      f"Successfully retrieved {len(submissions)} submissions")
                        
                        # Check if submissions have proper structure
                        if submissions:
                            sample_submission = submissions[0]
                            required_fields = ["id", "name", "email", "message", "submitted_at", "status"]
                            missing_fields = [field for field in required_fields if field not in sample_submission]
                            
                            if missing_fields:
                                self.log_result("Database Structure", False, 
                                              f"Missing fields in submission: {missing_fields}")
                            else:
                                self.log_result("Database Structure", True, 
                                              "Submissions have correct structure with timestamps and status")
                        else:
                            self.log_result("Database Structure", True, 
                                          "No submissions found, but endpoint works correctly")
                    else:
                        self.log_result("Database Retrieval", False, 
                                      f"Expected list but got: {type(submissions)}")
                else:
                    error_text = await response.text()
                    self.log_result("Database Retrieval", False, 
                                  f"HTTP {response.status}: {error_text}")
        except Exception as e:
            self.log_result("Database Retrieval", False, f"Request error: {str(e)}")
            
    async def test_email_configuration(self):
        """Test that API handles email failures gracefully"""
        # Submit a form and verify it works even if email fails
        test_data = {
            "name": "Email Test User",
            "email": "emailtest@example.com",
            "message": "Testing email configuration handling in the system"
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/contact",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get("success") is True:
                        self.log_result("Email Failure Handling", True, 
                                      "API returns success even when email may fail")
                        
                        # Check if submission was stored despite email failure
                        await asyncio.sleep(1)  # Wait a moment for database write
                        
                        async with self.session.get(f"{BACKEND_URL}/contact") as get_response:
                            if get_response.status == 200:
                                submissions = await get_response.json()
                                
                                # Look for our test submission
                                found_submission = any(
                                    sub.get("email") == "emailtest@example.com" 
                                    for sub in submissions
                                )
                                
                                if found_submission:
                                    self.log_result("Database Storage Despite Email Failure", True, 
                                                  "Submission stored in database even if email fails")
                                else:
                                    self.log_result("Database Storage Despite Email Failure", False, 
                                                  "Submission not found in database")
                    else:
                        self.log_result("Email Failure Handling", False, 
                                      f"API returned failure: {data}")
                else:
                    self.log_result("Email Failure Handling", False, 
                                  f"HTTP {response.status}: {await response.text()}")
        except Exception as e:
            self.log_result("Email Failure Handling", False, f"Request error: {str(e)}")
            
    async def run_all_tests(self):
        """Run all tests"""
        print(f"🚀 Starting Contact Form API Tests")
        print(f"📍 Testing Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Run tests in order
            await self.test_api_health_check()
            await self.test_contact_form_valid_submission()
            await self.test_contact_form_validation_errors()
            await self.test_malformed_requests()
            await self.test_database_integration()
            await self.test_email_configuration()
            
        finally:
            await self.cleanup()
            
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  • {test['test']}: {test['message']}")
                if test['details']:
                    print(f"    Details: {test['details']}")
        
        return self.test_results

async def main():
    """Main test runner"""
    tester = ContactFormTester()
    results = await tester.run_all_tests()
    
    # Return appropriate exit code
    failed_count = sum(1 for result in results if not result["success"])
    sys.exit(failed_count)

if __name__ == "__main__":
    asyncio.run(main())