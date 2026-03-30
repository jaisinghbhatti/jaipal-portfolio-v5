import requests
import sys
import json
from datetime import datetime

class LeadSniperAPITester:
    def __init__(self, base_url="https://workflow-sniper.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and 'message' in response_data:
                        print(f"   Message: {response_data['message']}")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timed out after {timeout} seconds")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health and status endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        # Test root endpoint
        self.run_test("Root API", "GET", "", 200)
        
        # Test health endpoint
        self.run_test("Health Check", "GET", "health", 200)

    def test_status_endpoints(self):
        """Test status check endpoints"""
        print("\n" + "="*50)
        print("TESTING STATUS ENDPOINTS")
        print("="*50)
        
        # Test create status check
        status_data = {
            "client_name": f"test_client_{datetime.now().strftime('%H%M%S')}"
        }
        success, response = self.run_test("Create Status Check", "POST", "status", 200, status_data)
        
        if success:
            print(f"   Created status with ID: {response.get('id', 'N/A')}")
        
        # Test get status checks
        self.run_test("Get Status Checks", "GET", "status", 200)

    def test_lead_search_basic(self):
        """Test basic lead search functionality"""
        print("\n" + "="*50)
        print("TESTING LEAD SEARCH - BASIC")
        print("="*50)
        
        # Test with default parameters (similar to frontend defaults)
        search_data = {
            "user_business_name": "Jai Packaging Industries",
            "user_location": "Sahibabad, Ghaziabad",
            "user_core_offering": "Packaging Boxes, Paper Boxes, Corrugated Boxes, Paper Bags",
            "target_industry": "Shoe manufacturers",
            "search_radius_km": 10,
            "use_ai_pitch": False
        }
        
        success, response = self.run_test(
            "Lead Search - Basic", 
            "POST", 
            "leads/search", 
            200, 
            search_data,
            timeout=45  # Longer timeout for API calls
        )
        
        if success and isinstance(response, dict):
            print(f"   Success: {response.get('success', False)}")
            print(f"   Total Results: {response.get('total_results', 0)}")
            print(f"   User Location: {response.get('user_location', 'N/A')}")
            print(f"   Search Radius: {response.get('search_radius_km', 0)} km")
            
            leads = response.get('leads', [])
            if leads:
                print(f"   Sample Lead: {leads[0].get('name', 'N/A')}")
                print(f"   Sample Distance: {leads[0].get('distance_km', 0)} km")
                print(f"   Sample Phone: {leads[0].get('phone', 'N/A')}")
                print(f"   Sample WhatsApp Link: {'Yes' if leads[0].get('whatsapp_link') else 'No'}")
                print(f"   Sample Power Pitch: {leads[0].get('power_pitch', 'N/A')[:50]}...")
            
            return leads
        
        return []

    def test_lead_search_ai_enhanced(self):
        """Test AI-enhanced lead search"""
        print("\n" + "="*50)
        print("TESTING LEAD SEARCH - AI ENHANCED")
        print("="*50)
        
        search_data = {
            "user_business_name": "Tech Solutions Inc",
            "user_location": "Delhi, India",
            "user_core_offering": "Software Development, Web Applications",
            "target_industry": "Restaurants",
            "search_radius_km": 5,
            "use_ai_pitch": True  # Enable AI pitches
        }
        
        success, response = self.run_test(
            "Lead Search - AI Enhanced", 
            "POST", 
            "leads/search", 
            200, 
            search_data,
            timeout=60  # Even longer timeout for AI processing
        )
        
        if success and isinstance(response, dict):
            leads = response.get('leads', [])
            if leads:
                print(f"   AI Pitch Sample: {leads[0].get('power_pitch', 'N/A')[:100]}...")
        
        return success

    def test_lead_search_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n" + "="*50)
        print("TESTING LEAD SEARCH - EDGE CASES")
        print("="*50)
        
        # Test with invalid location
        invalid_location_data = {
            "user_business_name": "Test Business",
            "user_location": "InvalidLocationThatDoesNotExist12345",
            "user_core_offering": "Test Offering",
            "target_industry": "Test Industry",
            "search_radius_km": 10,
            "use_ai_pitch": False
        }
        
        self.run_test(
            "Lead Search - Invalid Location", 
            "POST", 
            "leads/search", 
            400,  # Should return 400 for invalid location
            invalid_location_data
        )
        
        # Test with missing required fields
        incomplete_data = {
            "user_business_name": "Test Business"
            # Missing other required fields
        }
        
        self.run_test(
            "Lead Search - Missing Fields", 
            "POST", 
            "leads/search", 
            422,  # Should return 422 for validation error
            incomplete_data
        )

    def test_lead_history(self):
        """Test lead search history endpoint"""
        print("\n" + "="*50)
        print("TESTING LEAD HISTORY")
        print("="*50)
        
        success, response = self.run_test("Get Lead History", "GET", "leads/history", 200)
        
        if success and isinstance(response, dict):
            searches = response.get('searches', [])
            print(f"   Found {len(searches)} historical searches")
            if searches:
                print(f"   Latest search: {searches[0].get('user_business_name', 'N/A')} -> {searches[0].get('target_industry', 'N/A')}")

def main():
    print("🎯 Lead Sniper API Testing Suite")
    print("=" * 60)
    
    # Initialize tester
    tester = LeadSniperAPITester()
    
    # Run all tests
    try:
        tester.test_health_endpoints()
        tester.test_status_endpoints()
        leads = tester.test_lead_search_basic()
        tester.test_lead_search_ai_enhanced()
        tester.test_lead_search_edge_cases()
        tester.test_lead_history()
        
        # Print final results
        print("\n" + "="*60)
        print("📊 FINAL TEST RESULTS")
        print("="*60)
        print(f"Tests Run: {tester.tests_run}")
        print(f"Tests Passed: {tester.tests_passed}")
        print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
        
        if tester.tests_passed == tester.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
            return 1
            
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())