"""
Google Places API (New) Tools for GlowGo
Tools for fetching beauty service provider data from Google Places
"""

import logging
import httpx
import json
from typing import Dict, Any, List, Optional
from crewai.tools import BaseTool
from pydantic import Field

from config import settings

logger = logging.getLogger(__name__)


class GooglePlacesSearchTool(BaseTool):
    """
    Tool for searching beauty service providers on Google Places API (New)
    
    Returns structured data including:
    - Business name, address, phone
    - Rating, review count
    - Website, price level
    """
    
    name: str = "google_places_search"
    description: str = """
    Search for beauty service providers using Google Places API.
    Input should be a JSON with:
    - textQuery: Search query (e.g., "hair salon in Boston, MA")
    - maxResultCount: Number of results (default 20)
    
    Returns list of businesses with Google Places details.
    """
    
    api_key: str = Field(default_factory=lambda: settings.GOOGLE_PLACES_API_KEY or "")
    
    def _run(self, input_data: str) -> str:
        """Execute Google Places search"""
        try:
            # Parse input
            if isinstance(input_data, str):
                params = json.loads(input_data)
            else:
                params = input_data
                
            text_query = params.get("textQuery")
            if not text_query:
                # Construct from term and location if not provided directly
                term = params.get("term", "hair salon")
                location = params.get("location", "Boston, MA")
                text_query = f"{term} in {location}"
                
            limit = params.get("limit", 20)
            
            if not self.api_key:
                return json.dumps({
                    "error": "Google Places API key not configured",
                    "places": []
                })
                
            # Make Google Places API request
            headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": self.api_key,
                "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.priceLevel,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.businessStatus,places.photos,places.location,places.types,places.regularOpeningHours"
            }
            
            payload = {
                "textQuery": text_query,
                "maxResultCount": limit
            }
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    "https://places.googleapis.com/v1/places:searchText",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
            places = []
            for place in data.get("places", []):
                # Transform to standard structure somewhat compatible with Yelp result for easier merging
                # but keeping source distinct
                
                # Extract display name
                name = place.get("displayName", {}).get("text", "Unknown")
                
                # Extract price level
                price_level = place.get("priceLevel", "")
                price = ""
                if price_level == "PRICE_LEVEL_INEXPENSIVE":
                    price = "$"
                elif price_level == "PRICE_LEVEL_MODERATE":
                    price = "$$"
                elif price_level == "PRICE_LEVEL_EXPENSIVE":
                    price = "$$$"
                elif price_level == "PRICE_LEVEL_VERY_EXPENSIVE":
                    price = "$$$$"
                
                # Format photos
                photos = []
                if "photos" in place:
                    for photo in place["photos"]:
                        # Construct photo URL (requires another API call to actually fetch image bytes, 
                        # but we can store the resource name)
                        # Format: https://places.googleapis.com/v1/{name}/media?key=API_KEY&maxHeightPx=400&maxWidthPx=400
                        photo_name = photo.get("name")
                        if photo_name:
                            photos.append(f"https://places.googleapis.com/v1/{photo_name}/media?key={self.api_key}&maxHeightPx=800&maxWidthPx=800")
                
                place_obj = {
                    "google_id": place.get("id"),
                    "business_name": name,
                    "address": place.get("formattedAddress"),
                    "phone": place.get("nationalPhoneNumber"),
                    "rating": place.get("rating"),
                    "review_count": place.get("userRatingCount"),
                    "website": place.get("websiteUri"),
                    "price_range": price,
                    "location_lat": place.get("location", {}).get("latitude"),
                    "location_lon": place.get("location", {}).get("longitude"),
                    "photos": photos,
                    "types": place.get("types", []),
                    "business_hours": place.get("regularOpeningHours", {}).get("periods", []), # Needs processing
                    "data_source": "google_places"
                }
                places.append(place_obj)
                
            return json.dumps({
                "places": places,
                "count": len(places)
            })
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Google Places API HTTP error: {e.response.text}")
            return json.dumps({"error": f"API Error: {e.response.status_code}", "places": []})
        except Exception as e:
            logger.error(f"Google Places search error: {e}")
            return json.dumps({"error": str(e), "places": []})

# Instance
google_places_search_tool = GooglePlacesSearchTool()



