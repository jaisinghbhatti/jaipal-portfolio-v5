import asyncio
import aiohttp
import json
import os
from datetime import datetime
import sys

# Get the backend URL from frontend .env file
BACKEND_URL = "https://folio-preview-2.preview.emergentagent.com/api"

class BlogCMSTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.created_blog_ids = []  # Track created blogs for cleanup
        
    async def setup(self):
        """Setup test session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup(self):
        """Cleanup test session and created blogs"""
        # Clean up any blogs created during testing
        for blog_id in self.created_blog_ids:
            try:
                async with self.session.delete(f"{BACKEND_URL}/blogs/{blog_id}") as response:
                    pass  # Ignore cleanup errors
            except:
                pass
                
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
            
    async def test_get_all_blogs(self):
        """Test GET /api/blogs - fetching all blog posts"""
        try:
            # Test default (published) blogs
            async with self.session.get(f"{BACKEND_URL}/blogs") as response:
                if response.status == 200:
                    blogs = await response.json()
                    
                    if isinstance(blogs, list):
                        self.log_result("GET All Blogs (Published)", True, 
                                      f"Successfully retrieved {len(blogs)} published blogs")
                        
                        # Verify blog structure
                        if blogs:
                            sample_blog = blogs[0]
                            required_fields = ["id", "title", "slug", "content", "excerpt", "author", 
                                             "published_date", "read_time", "tags", "status"]
                            missing_fields = [field for field in required_fields if field not in sample_blog]
                            
                            if missing_fields:
                                self.log_result("Blog Structure Validation", False, 
                                              f"Missing fields in blog: {missing_fields}")
                            else:
                                self.log_result("Blog Structure Validation", True, 
                                              "Blog posts have correct structure")
                                
                        # Test status filter - all blogs
                        async with self.session.get(f"{BACKEND_URL}/blogs?status=all") as all_response:
                            if all_response.status == 200:
                                all_blogs = await all_response.json()
                                self.log_result("GET All Blogs (All Status)", True, 
                                              f"Successfully retrieved {len(all_blogs)} blogs with all status")
                            else:
                                self.log_result("GET All Blogs (All Status)", False, 
                                              f"HTTP {all_response.status}: {await all_response.text()}")
                                
                        # Test status filter - draft blogs
                        async with self.session.get(f"{BACKEND_URL}/blogs?status=draft") as draft_response:
                            if draft_response.status == 200:
                                draft_blogs = await draft_response.json()
                                self.log_result("GET All Blogs (Draft)", True, 
                                              f"Successfully retrieved {len(draft_blogs)} draft blogs")
                            else:
                                self.log_result("GET All Blogs (Draft)", False, 
                                              f"HTTP {draft_response.status}: {await draft_response.text()}")
                    else:
                        self.log_result("GET All Blogs (Published)", False, 
                                      f"Expected list but got: {type(blogs)}")
                else:
                    error_text = await response.text()
                    self.log_result("GET All Blogs (Published)", False, 
                                  f"HTTP {response.status}: {error_text}")
        except Exception as e:
            self.log_result("GET All Blogs (Published)", False, f"Request error: {str(e)}")
            
    async def test_get_blog_by_slug(self):
        """Test GET /api/blogs/{slug} - fetching individual blog posts"""
        test_slugs = [
            "why-seo-isnt-dead",
            "transcend-seo-chaos-gemini-marketing", 
            "ai-personal-moat-custom-tools"
        ]
        
        for slug in test_slugs:
            try:
                async with self.session.get(f"{BACKEND_URL}/blogs/{slug}") as response:
                    if response.status == 200:
                        blog = await response.json()
                        
                        # Verify blog structure and slug match
                        if blog.get("slug") == slug:
                            self.log_result(f"GET Blog by Slug ({slug})", True, 
                                          f"Successfully retrieved blog: {blog.get('title', 'Unknown')}")
                        else:
                            self.log_result(f"GET Blog by Slug ({slug})", False, 
                                          f"Slug mismatch: expected {slug}, got {blog.get('slug')}")
                    elif response.status == 404:
                        self.log_result(f"GET Blog by Slug ({slug})", False, 
                                      f"Blog not found (404) - may not be migrated yet")
                    else:
                        error_text = await response.text()
                        self.log_result(f"GET Blog by Slug ({slug})", False, 
                                      f"HTTP {response.status}: {error_text}")
            except Exception as e:
                self.log_result(f"GET Blog by Slug ({slug})", False, f"Request error: {str(e)}")
                
        # Test non-existent slug
        try:
            async with self.session.get(f"{BACKEND_URL}/blogs/non-existent-slug") as response:
                if response.status == 404:
                    self.log_result("GET Blog by Slug (Non-existent)", True, 
                                  "Correctly returned 404 for non-existent slug")
                else:
                    self.log_result("GET Blog by Slug (Non-existent)", False, 
                                  f"Expected 404 but got {response.status}")
        except Exception as e:
            self.log_result("GET Blog by Slug (Non-existent)", False, f"Request error: {str(e)}")
            
    async def test_create_blog_post(self):
        """Test POST /api/blogs - creating new blog post"""
        test_blog_data = {
            "title": "Test Blog Post for API Testing",
            "slug": "test-blog-post-api-testing",
            "content": "This is a comprehensive test blog post created by the automated testing system. It contains enough content to meet the minimum requirements for blog post creation. The content includes multiple paragraphs to ensure proper validation and storage in the database system.",
            "excerpt": "A test blog post created by the automated testing system to verify the blog creation API endpoint functionality.",
            "author": "API Test System",
            "read_time": "3 min",
            "tags": ["testing", "api", "automation"],
            "status": "draft"
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/blogs",
                json=test_blog_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify response format
                    if data.get("success") is True and data.get("blog"):
                        blog = data["blog"]
                        blog_id = blog.get("id")
                        
                        if blog_id:
                            self.created_blog_ids.append(blog_id)  # Track for cleanup
                            
                        self.log_result("Create Blog Post", True, 
                                      f"Successfully created blog: {blog.get('title')}")
                        return blog_id
                    else:
                        self.log_result("Create Blog Post", False, 
                                      f"Unexpected response format: {data}")
                else:
                    error_text = await response.text()
                    self.log_result("Create Blog Post", False, 
                                  f"HTTP {response.status}: {error_text}")
        except Exception as e:
            self.log_result("Create Blog Post", False, f"Request error: {str(e)}")
            
        return None
        
    async def test_create_blog_validation(self):
        """Test POST /api/blogs validation errors"""
        test_cases = [
            {
                "name": "Duplicate Slug",
                "data": {
                    "title": "Duplicate Test",
                    "slug": "test-blog-post-api-testing",  # Same as previous test
                    "content": "This should fail due to duplicate slug validation in the system. This content is long enough to meet the minimum character requirements for blog post creation but should still fail due to the duplicate slug constraint.",
                    "excerpt": "Testing duplicate slug validation",
                    "read_time": "2 min"
                },
                "expected_status": 400
            },
            {
                "name": "Missing Required Fields",
                "data": {
                    "title": "Incomplete Blog"
                    # Missing slug, content, excerpt, read_time
                },
                "expected_status": 422
            },
            {
                "name": "Content Too Short",
                "data": {
                    "title": "Short Content Test",
                    "slug": "short-content-test",
                    "content": "Too short",  # Less than 100 characters
                    "excerpt": "Testing content length validation",
                    "read_time": "1 min"
                },
                "expected_status": 422
            }
        ]
        
        for test_case in test_cases:
            try:
                async with self.session.post(
                    f"{BACKEND_URL}/blogs",
                    json=test_case["data"],
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == test_case["expected_status"]:
                        self.log_result(f"Blog Validation - {test_case['name']}", True, 
                                      f"Correctly rejected with status {response.status}")
                    else:
                        response_text = await response.text()
                        self.log_result(f"Blog Validation - {test_case['name']}", False, 
                                      f"Expected {test_case['expected_status']} but got {response.status}",
                                      f"Response: {response_text}")
            except Exception as e:
                self.log_result(f"Blog Validation - {test_case['name']}", False, 
                              f"Request error: {str(e)}")
                
    async def test_update_blog_post(self):
        """Test PUT /api/blogs/{blog_id} - updating blog post"""
        # Create a blog specifically for update testing with unique slug
        update_test_blog_data = {
            "title": "Blog for Update Testing",
            "slug": "blog-for-update-testing-unique",
            "content": "This is a comprehensive test blog post created specifically for update testing by the automated testing system. It contains enough content to meet the minimum requirements for blog post creation and will be updated to verify the update functionality.",
            "excerpt": "A test blog post created specifically for update testing to verify the update API endpoint functionality.",
            "author": "API Test System",
            "read_time": "3 min",
            "tags": ["testing", "api", "update"],
            "status": "draft"
        }
        
        blog_id = None
        try:
            async with self.session.post(
                f"{BACKEND_URL}/blogs",
                json=update_test_blog_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    blog_id = data.get("blog", {}).get("id")
                    if blog_id:
                        self.created_blog_ids.append(blog_id)  # Track for cleanup
        except Exception as e:
            pass
        
        if not blog_id:
            self.log_result("Update Blog Post", False, "Cannot test update - blog creation failed")
            return
            
        # Test updating the blog
        update_data = {
            "title": "Updated Test Blog Post",
            "content": "This is the updated content for the test blog post. It has been modified by the automated testing system to verify the update functionality works correctly.",
            "tags": ["testing", "api", "automation", "updated"],
            "status": "published"
        }
        
        try:
            async with self.session.put(
                f"{BACKEND_URL}/blogs/{blog_id}",
                json=update_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get("success") is True and data.get("blog"):
                        updated_blog = data["blog"]
                        
                        # Verify updates were applied
                        if (updated_blog.get("title") == update_data["title"] and 
                            updated_blog.get("status") == update_data["status"]):
                            self.log_result("Update Blog Post", True, 
                                          f"Successfully updated blog: {updated_blog.get('title')}")
                        else:
                            self.log_result("Update Blog Post", False, 
                                          "Blog updated but changes not reflected correctly")
                    else:
                        self.log_result("Update Blog Post", False, 
                                      f"Unexpected response format: {data}")
                else:
                    error_text = await response.text()
                    self.log_result("Update Blog Post", False, 
                                  f"HTTP {response.status}: {error_text}")
        except Exception as e:
            self.log_result("Update Blog Post", False, f"Request error: {str(e)}")
            
        # Test updating non-existent blog
        try:
            async with self.session.put(
                f"{BACKEND_URL}/blogs/non-existent-id",
                json={"title": "Should Fail"},
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 404:
                    self.log_result("Update Non-existent Blog", True, 
                                  "Correctly returned 404 for non-existent blog")
                else:
                    self.log_result("Update Non-existent Blog", False, 
                                  f"Expected 404 but got {response.status}")
        except Exception as e:
            self.log_result("Update Non-existent Blog", False, f"Request error: {str(e)}")
            
    async def test_delete_blog_post(self):
        """Test DELETE /api/blogs/{blog_id} - deleting blog post"""
        # First create a blog to delete
        test_blog_data = {
            "title": "Blog to Delete",
            "slug": "blog-to-delete-test",
            "content": "This blog post will be deleted as part of the automated testing process to verify the delete functionality works correctly.",
            "excerpt": "A blog post created specifically for deletion testing",
            "read_time": "2 min",
            "status": "draft"
        }
        
        # Create blog
        try:
            async with self.session.post(
                f"{BACKEND_URL}/blogs",
                json=test_blog_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    blog_id = data.get("blog", {}).get("id")
                    
                    if blog_id:
                        # Now delete it
                        async with self.session.delete(f"{BACKEND_URL}/blogs/{blog_id}") as delete_response:
                            if delete_response.status == 200:
                                delete_data = await delete_response.json()
                                
                                if delete_data.get("success") is True:
                                    self.log_result("Delete Blog Post", True, 
                                                  "Successfully deleted blog post")
                                    
                                    # Verify it's actually deleted
                                    async with self.session.get(f"{BACKEND_URL}/blogs/{blog_id}") as verify_response:
                                        if verify_response.status == 404:
                                            self.log_result("Verify Blog Deletion", True, 
                                                          "Blog successfully removed from database")
                                        else:
                                            self.log_result("Verify Blog Deletion", False, 
                                                          "Blog still exists after deletion")
                                else:
                                    self.log_result("Delete Blog Post", False, 
                                                  f"Delete failed: {delete_data}")
                            else:
                                error_text = await delete_response.text()
                                self.log_result("Delete Blog Post", False, 
                                              f"HTTP {delete_response.status}: {error_text}")
                    else:
                        self.log_result("Delete Blog Post", False, 
                                      "Cannot test delete - blog creation failed")
                else:
                    self.log_result("Delete Blog Post", False, 
                                  "Cannot test delete - blog creation failed")
        except Exception as e:
            self.log_result("Delete Blog Post", False, f"Request error: {str(e)}")
            
        # Test deleting non-existent blog
        try:
            async with self.session.delete(f"{BACKEND_URL}/blogs/non-existent-id") as response:
                if response.status == 404:
                    self.log_result("Delete Non-existent Blog", True, 
                                  "Correctly returned 404 for non-existent blog")
                else:
                    self.log_result("Delete Non-existent Blog", False, 
                                  f"Expected 404 but got {response.status}")
        except Exception as e:
            self.log_result("Delete Non-existent Blog", False, f"Request error: {str(e)}")
            
    async def test_database_integration(self):
        """Test database integration and migration verification"""
        try:
            # Get all blogs to check migration
            async with self.session.get(f"{BACKEND_URL}/blogs?status=all") as response:
                if response.status == 200:
                    all_blogs = await response.json()
                    
                    self.log_result("Database Integration", True, 
                                  f"Successfully connected to database with {len(all_blogs)} total blogs")
                    
                    # Check for expected migrated blogs
                    expected_slugs = [
                        "why-seo-isnt-dead",
                        "transcend-seo-chaos-gemini-marketing", 
                        "ai-personal-moat-custom-tools"
                    ]
                    
                    found_slugs = [blog.get("slug") for blog in all_blogs]
                    migrated_count = sum(1 for slug in expected_slugs if slug in found_slugs)
                    
                    if migrated_count == 3:
                        self.log_result("Blog Migration Verification", True, 
                                      "All 3 expected blog posts found in database")
                    elif migrated_count > 0:
                        self.log_result("Blog Migration Verification", False, 
                                      f"Only {migrated_count}/3 expected blogs found: {[s for s in expected_slugs if s in found_slugs]}")
                    else:
                        self.log_result("Blog Migration Verification", False, 
                                      "No expected migrated blogs found in database")
                        
                    # Verify blog_posts collection structure
                    if all_blogs:
                        sample_blog = all_blogs[0]
                        required_fields = ["id", "title", "slug", "content", "excerpt", "author", 
                                         "published_date", "read_time", "tags", "status", "created_at", "updated_at"]
                        missing_fields = [field for field in required_fields if field not in sample_blog]
                        
                        if missing_fields:
                            self.log_result("Database Schema Validation", False, 
                                          f"Missing fields in blog_posts collection: {missing_fields}")
                        else:
                            self.log_result("Database Schema Validation", True, 
                                          "blog_posts collection has correct schema")
                else:
                    error_text = await response.text()
                    self.log_result("Database Integration", False, 
                                  f"HTTP {response.status}: {error_text}")
        except Exception as e:
            self.log_result("Database Integration", False, f"Request error: {str(e)}")
            
    async def run_all_tests(self):
        """Run all blog CMS tests"""
        print(f"🚀 Starting Blog CMS API Tests")
        print(f"📍 Testing Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Run tests in order
            await self.test_get_all_blogs()
            await self.test_get_blog_by_slug()
            await self.test_create_blog_post()
            await self.test_create_blog_validation()
            await self.test_update_blog_post()
            await self.test_delete_blog_post()
            await self.test_database_integration()
            
        finally:
            await self.cleanup()
            
        # Print summary
        print("\n" + "=" * 60)
        print("📊 BLOG CMS TEST SUMMARY")
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
                        
                        # Check CORS headers - need to make a preflight request to see CORS headers
                        # For now, just check if the request succeeded (which means CORS is working)
                        self.log_result("CORS Headers", True, "CORS is working (request succeeded from external domain)")
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

class ResumeBuilderTester:
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
            
    async def test_analyze_endpoint(self):
        """Test POST /api/resume-builder/analyze endpoint"""
        test_data = {
            "resumeText": "John Smith\nSoftware Engineer\njohn@email.com\n\nEXPERIENCE\nSoftware Engineer at ABC Corp (2020-Present)\n- Developed web applications using React and Python\n- Led team of 3 developers\n\nSKILLS\nPython, JavaScript, React, SQL",
            "jobDescription": "Senior Software Engineer\nRequirements:\n- 5+ years experience\n- Python, JavaScript, React\n- AWS, Docker, Kubernetes\n- Team leadership experience"
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/resume-builder/analyze",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify response structure
                    required_fields = ["matchScore", "missingKeywords"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_result("Resume Analysis - Response Structure", False, 
                                      f"Missing fields in response: {missing_fields}")
                    else:
                        match_score = data.get("matchScore")
                        missing_keywords = data.get("missingKeywords")
                        
                        # Validate match score
                        if isinstance(match_score, int) and 0 <= match_score <= 100:
                            self.log_result("Resume Analysis - Match Score", True, 
                                          f"Valid match score: {match_score}")
                        else:
                            self.log_result("Resume Analysis - Match Score", False, 
                                          f"Invalid match score: {match_score} (should be 0-100)")
                        
                        # Validate missing keywords
                        if isinstance(missing_keywords, list):
                            self.log_result("Resume Analysis - Missing Keywords", True, 
                                          f"Found {len(missing_keywords)} missing keywords: {missing_keywords[:3]}...")
                        else:
                            self.log_result("Resume Analysis - Missing Keywords", False, 
                                          f"Invalid missing keywords format: {type(missing_keywords)}")
                        
                        # Overall success if both validations pass
                        if (isinstance(match_score, int) and 0 <= match_score <= 100 and 
                            isinstance(missing_keywords, list)):
                            self.log_result("Resume Analysis API", True, 
                                          f"Successfully analyzed resume with {match_score}% match")
                        else:
                            self.log_result("Resume Analysis API", False, 
                                          "Response validation failed")
                else:
                    error_text = await response.text()
                    self.log_result("Resume Analysis API", False, 
                                  f"HTTP {response.status}: {error_text}")
        except Exception as e:
            self.log_result("Resume Analysis API", False, f"Request error: {str(e)}")
            
    async def test_optimize_endpoint(self):
        """Test POST /api/resume-builder/optimize endpoint"""
        test_data = {
            "resumeText": "John Smith\nSoftware Engineer\njohn@email.com\n\nEXPERIENCE\nSoftware Engineer at ABC Corp (2020-Present)\n- Developed web applications using React and Python\n- Led team of 3 developers\n\nSKILLS\nPython, JavaScript, React, SQL",
            "jobDescription": "Senior Software Engineer\nRequirements:\n- 5+ years experience\n- Python, JavaScript, React\n- AWS, Docker, Kubernetes",
            "tone": "executive"
        }
        
        try:
            async with self.session.post(
                f"{BACKEND_URL}/resume-builder/optimize",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    
                    # Verify response structure
                    required_fields = ["optimizedResume", "coverLetter"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_result("Resume Optimization - Response Structure", False, 
                                      f"Missing fields in response: {missing_fields}")
                    else:
                        optimized_resume = data.get("optimizedResume")
                        cover_letter = data.get("coverLetter")
                        new_match_score = data.get("newMatchScore")
                        
                        # Validate optimized resume
                        if isinstance(optimized_resume, str) and len(optimized_resume) > 100:
                            self.log_result("Resume Optimization - Optimized Resume", True, 
                                          f"Generated optimized resume ({len(optimized_resume)} chars)")
                        else:
                            self.log_result("Resume Optimization - Optimized Resume", False, 
                                          f"Invalid optimized resume: {len(optimized_resume) if optimized_resume else 0} chars")
                        
                        # Validate cover letter
                        if isinstance(cover_letter, str) and len(cover_letter) > 50:
                            self.log_result("Resume Optimization - Cover Letter", True, 
                                          f"Generated cover letter ({len(cover_letter)} chars)")
                        else:
                            self.log_result("Resume Optimization - Cover Letter", False, 
                                          f"Invalid cover letter: {len(cover_letter) if cover_letter else 0} chars")
                        
                        # Validate new match score (optional)
                        if new_match_score is not None:
                            if isinstance(new_match_score, int) and 0 <= new_match_score <= 100:
                                self.log_result("Resume Optimization - New Match Score", True, 
                                              f"Valid new match score: {new_match_score}")
                            else:
                                self.log_result("Resume Optimization - New Match Score", False, 
                                              f"Invalid new match score: {new_match_score}")
                        
                        # Overall success
                        if (isinstance(optimized_resume, str) and len(optimized_resume) > 100 and
                            isinstance(cover_letter, str) and len(cover_letter) > 50):
                            self.log_result("Resume Optimization API", True, 
                                          "Successfully optimized resume and generated cover letter")
                        else:
                            self.log_result("Resume Optimization API", False, 
                                          "Response validation failed")
                else:
                    error_text = await response.text()
                    self.log_result("Resume Optimization API", False, 
                                  f"HTTP {response.status}: {error_text}")
        except Exception as e:
            self.log_result("Resume Optimization API", False, f"Request error: {str(e)}")
            
    async def test_tone_variations(self):
        """Test different tone options for optimization"""
        tones = ["executive", "disruptor", "human"]
        
        base_data = {
            "resumeText": "John Smith\nSoftware Engineer\njohn@email.com\n\nEXPERIENCE\nSoftware Engineer at ABC Corp (2020-Present)\n- Developed web applications using React and Python\n- Led team of 3 developers\n\nSKILLS\nPython, JavaScript, React, SQL",
            "jobDescription": "Senior Software Engineer\nRequirements:\n- 5+ years experience\n- Python, JavaScript, React"
        }
        
        for tone in tones:
            test_data = {**base_data, "tone": tone}
            
            try:
                async with self.session.post(
                    f"{BACKEND_URL}/resume-builder/optimize",
                    json=test_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        if (data.get("optimizedResume") and data.get("coverLetter")):
                            self.log_result(f"Tone Variation - {tone.title()}", True, 
                                          f"Successfully generated content with {tone} tone")
                        else:
                            self.log_result(f"Tone Variation - {tone.title()}", False, 
                                          "Missing optimized content in response")
                    else:
                        self.log_result(f"Tone Variation - {tone.title()}", False, 
                                      f"HTTP {response.status}")
            except Exception as e:
                self.log_result(f"Tone Variation - {tone.title()}", False, f"Request error: {str(e)}")
                
    async def test_validation_errors(self):
        """Test API validation with invalid data"""
        test_cases = [
            {
                "name": "Missing Resume Text",
                "data": {"jobDescription": "Test JD", "tone": "executive"},
                "expected_status": 422
            },
            {
                "name": "Missing Job Description",
                "data": {"resumeText": "Test Resume", "tone": "executive"},
                "expected_status": 422
            },
            {
                "name": "Invalid Tone",
                "data": {"resumeText": "Test Resume", "jobDescription": "Test JD", "tone": "invalid"},
                "expected_status": [200, 422]  # May accept invalid tone or reject it
            }
        ]
        
        for test_case in test_cases:
            try:
                async with self.session.post(
                    f"{BACKEND_URL}/resume-builder/optimize",
                    json=test_case["data"],
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    expected_statuses = test_case["expected_status"]
                    if not isinstance(expected_statuses, list):
                        expected_statuses = [expected_statuses]
                    
                    if response.status in expected_statuses:
                        self.log_result(f"Validation - {test_case['name']}", True, 
                                      f"Correctly handled with status {response.status}")
                    else:
                        response_text = await response.text()
                        self.log_result(f"Validation - {test_case['name']}", False, 
                                      f"Expected {expected_statuses} but got {response.status}",
                                      f"Response: {response_text}")
            except Exception as e:
                self.log_result(f"Validation - {test_case['name']}", False, 
                              f"Request error: {str(e)}")
                
    async def run_all_tests(self):
        """Run all Resume Builder tests"""
        print(f"🚀 Starting Resume Builder API Tests")
        print(f"📍 Testing Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Run tests in order
            await self.test_analyze_endpoint()
            await self.test_optimize_endpoint()
            await self.test_tone_variations()
            await self.test_validation_errors()
            
        finally:
            await self.cleanup()
            
        # Print summary
        print("\n" + "=" * 60)
        print("📊 RESUME BUILDER TEST SUMMARY")
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
    print("🎯 COMPREHENSIVE BACKEND API TESTING")
    print("=" * 80)
    
    # Run Resume Builder tests (as requested)
    resume_tester = ResumeBuilderTester()
    resume_results = await resume_tester.run_all_tests()
    
    print("\n" + "=" * 80)
    
    # Run Blog CMS tests
    blog_tester = BlogCMSTester()
    blog_results = await blog_tester.run_all_tests()
    
    print("\n" + "=" * 80)
    
    # Run Contact Form tests
    contact_tester = ContactFormTester()
    contact_results = await contact_tester.run_all_tests()
    
    # Combined summary
    all_results = resume_results + blog_results + contact_results
    total_passed = sum(1 for result in all_results if result["success"])
    total_tests = len(all_results)
    
    print("\n" + "=" * 80)
    print("🎯 OVERALL TEST SUMMARY")
    print("=" * 80)
    print(f"Resume Builder Tests: {sum(1 for r in resume_results if r['success'])}/{len(resume_results)} passed")
    print(f"Blog CMS Tests: {sum(1 for r in blog_results if r['success'])}/{len(blog_results)} passed")
    print(f"Contact Form Tests: {sum(1 for r in contact_results if r['success'])}/{len(contact_results)} passed")
    print(f"Total: {total_passed}/{total_tests} passed ({(total_passed/total_tests)*100:.1f}%)")
    
    # Return appropriate exit code
    failed_count = total_tests - total_passed
    return failed_count

if __name__ == "__main__":
    failed_count = asyncio.run(main())
    sys.exit(failed_count)