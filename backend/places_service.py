import os
import requests
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

class PlacesService:
    def __init__(self):
        self.api_key = os.environ.get('GOOGLE_PLACES_API_KEY')
        self.base_url = "https://places.googleapis.com/v1"
        
    def geocode_location(self, location: str) -> Optional[Dict[str, float]]:
        """Convert a location string to latitude/longitude coordinates."""
        geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
        
        try:
            response = requests.get(
                geocode_url,
                params={
                    "address": location,
                    "key": self.api_key
                },
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") == "OK" and data.get("results"):
                location_data = data["results"][0]["geometry"]["location"]
                return {
                    "latitude": location_data["lat"],
                    "longitude": location_data["lng"]
                }
            logger.warning(f"Geocoding failed for location: {location}")
            return None
            
        except Exception as e:
            logger.error(f"Error geocoding location: {str(e)}")
            return None
    
    def search_nearby(
        self,
        latitude: float,
        longitude: float,
        keyword: str,
        radius: int = 5000,
        max_results: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Search for businesses near a location using Text Search.
        """
        url = f"{self.base_url}/places:searchText"
        
        payload = {
            "textQuery": keyword,
            "locationBias": {
                "circle": {
                    "center": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "radius": float(radius)
                }
            },
            "maxResultCount": min(max_results, 20)
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.types,places.location,places.businessStatus"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            places = data.get("places", [])
            logger.info(f"Found {len(places)} places for keyword: {keyword}")
            return places
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error from Places API: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error searching nearby places: {str(e)}")
            raise
    
    def calculate_distance(
        self,
        lat1: float,
        lng1: float,
        lat2: float,
        lng2: float
    ) -> float:
        """Calculate distance between two points in kilometers using Haversine formula."""
        import math
        
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return round(R * c, 2)
    
    def format_places_for_leads(
        self,
        places: List[Dict[str, Any]],
        user_lat: float,
        user_lng: float
    ) -> List[Dict[str, Any]]:
        """Format places data for lead generation output."""
        leads = []
        
        for place in places:
            place_location = place.get("location", {})
            place_lat = place_location.get("latitude", 0)
            place_lng = place_location.get("longitude", 0)
            
            distance = self.calculate_distance(user_lat, user_lng, place_lat, place_lng)
            
            phone = place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber") or ""
            
            # Get primary type from types list
            types = place.get("types", [])
            industry = types[0] if types else "business"
            
            lead = {
                "name": place.get("displayName", {}).get("text", "Unknown Business"),
                "address": place.get("formattedAddress", ""),
                "phone": phone,
                "distance_km": distance,
                "industry": industry.replace("_", " ").title(),
                "status": place.get("businessStatus", "OPERATIONAL")
            }
            
            leads.append(lead)
        
        # Sort by distance
        leads.sort(key=lambda x: x["distance_km"])
        
        return leads


places_service = PlacesService()
