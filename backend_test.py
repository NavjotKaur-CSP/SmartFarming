import requests
import sys
import json
from datetime import datetime, timezone

class SmartFarmAPITester:
    def __init__(self, base_url="https://infallible-newton-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def test_health_check(self):
        """Test API health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_register(self):
        """Test user registration"""
        test_user_data = {
            "email": f"test_{datetime.now().strftime('%H%M%S')}@smartfarm.com",
            "password": "testpass123",
            "name": "Test Farmer",
            "phone": "1234567890",
            "farm_name": "Test Farm",
            "location": "Test Location"
        }
        
        result = self.run_test("User Registration", "POST", "auth/register", 200, test_user_data)
        if result:
            self.token = result.get('access_token')
            self.user_id = result.get('id')
            return True
        return False

    def test_login(self):
        """Test admin login"""
        login_data = {
            "email": "admin@smartfarm.com",
            "password": "admin123"
        }
        
        result = self.run_test("Admin Login", "POST", "auth/login", 200, login_data)
        if result:
            self.token = result.get('access_token')
            self.user_id = result.get('id')
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_weather_data(self):
        """Test weather data endpoint"""
        return self.run_test("Weather Data", "GET", "weather", 200)

    def test_soil_data(self):
        """Test soil data endpoint"""
        return self.run_test("Soil Data", "GET", "soil", 200)

    def test_market_prices(self):
        """Test market prices endpoint"""
        return self.run_test("Market Prices", "GET", "market-prices", 200)

    def test_crop_crud(self):
        """Test crop CRUD operations"""
        # Create crop
        crop_data = {
            "name": "Test Wheat",
            "variety": "HD-2967",
            "planted_date": "2024-01-15T00:00:00Z",
            "expected_harvest_date": "2024-05-15T00:00:00Z",
            "field_area": 5.5,
            "location": "North Field",
            "notes": "Test crop for API testing"
        }
        
        create_result = self.run_test("Create Crop", "POST", "crops", 200, crop_data)
        if not create_result:
            return False
        
        crop_id = create_result.get('id')
        
        # Get crops
        self.run_test("Get Crops", "GET", "crops", 200)
        
        # Get specific crop
        self.run_test("Get Specific Crop", "GET", f"crops/{crop_id}", 200)
        
        # Update crop
        update_data = {
            "notes": "Updated test crop",
            "health_status": "healthy"
        }
        self.run_test("Update Crop", "PUT", f"crops/{crop_id}", 200, update_data)
        
        # Delete crop
        self.run_test("Delete Crop", "DELETE", f"crops/{crop_id}", 200)
        
        return True

    def test_alerts(self):
        """Test alerts functionality"""
        # Get alerts
        return self.run_test("Get Alerts", "GET", "alerts", 200)

    def test_ai_features(self):
        """Test AI-powered features"""
        # First create a crop for AI testing
        crop_data = {
            "name": "AI Test Crop",
            "variety": "Test Variety",
            "planted_date": "2024-01-01T00:00:00Z",
            "field_area": 2.0,
            "location": "Test Field"
        }
        
        create_result = self.run_test("Create Crop for AI", "POST", "crops", 200, crop_data)
        if not create_result:
            return False
        
        crop_id = create_result.get('id')
        
        # Test yield prediction
        yield_data = {"crop_id": crop_id}
        self.run_test("AI Yield Prediction", "POST", "ai/yield-prediction", 200, yield_data)
        
        # Test crop health analysis
        health_data = {
            "crop_id": crop_id,
            "symptoms": "Yellowing leaves observed"
        }
        self.run_test("AI Crop Health Analysis", "POST", "ai/crop-health", 200, health_data)
        
        # Clean up
        self.run_test("Delete AI Test Crop", "DELETE", f"crops/{crop_id}", 200)
        
        return True

    def test_profile_update(self):
        """Test profile update"""
        update_data = {
            "name": "Updated Admin",
            "location": "Updated Location",
            "language": "en"
        }
        return self.run_test("Update Profile", "PUT", "auth/profile", 200, update_data)

    def test_logout(self):
        """Test logout"""
        return self.run_test("Logout", "POST", "auth/logout", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Smart Farming Platform API Tests")
        print("=" * 50)
        
        # Basic health check
        self.test_health_check()
        
        # Authentication tests
        if not self.test_login():
            print("❌ Login failed - stopping tests")
            return False
        
        # Core functionality tests
        self.test_get_me()
        self.test_dashboard_stats()
        
        # Data endpoints
        self.test_weather_data()
        self.test_soil_data()
        self.test_market_prices()
        
        # CRUD operations
        self.test_crop_crud()
        self.test_alerts()
        
        # Profile management
        self.test_profile_update()
        
        # AI features (may use mock data if API key issues)
        self.test_ai_features()
        
        # Registration test (separate user)
        self.test_register()
        
        # Logout
        self.test_logout()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Show failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = SmartFarmAPITester()
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        
        # Save detailed results
        with open('/app/backend_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': tester.tests_run,
                    'passed': tester.tests_passed,
                    'failed': tester.tests_run - tester.tests_passed,
                    'success_rate': (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0
                },
                'results': tester.test_results,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        return 0 if success else 1
        
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())