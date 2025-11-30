"""
Pydantic schemas for matching endpoints
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class PreferencesModel(BaseModel):
    """User preferences for matching"""
    service_type: str = Field(..., description="Type of service (e.g., 'haircut', 'manicure')")
    budget_min: Optional[float] = Field(None, description="Minimum budget", ge=0)
    budget_max: Optional[float] = Field(None, description="Maximum budget", ge=0)
    time_urgency: Optional[str] = Field("flexible", description="Time urgency: 'ASAP', 'today', 'week', or 'flexible'")
    location: Optional[str] = Field(None, description="Location string (e.g., 'Cambridge, MA')")
    artisan_preference: Optional[str] = Field(None, description="Preference for specific provider type")
    special_notes: Optional[str] = Field(None, description="Additional requirements or notes")

    class Config:
        json_schema_extra = {
            "example": {
                "service_type": "haircut",
                "budget_min": 40,
                "budget_max": 60,
                "time_urgency": "ASAP",
                "location": "Cambridge, MA"
            }
        }


class FindMatchesRequest(BaseModel):
    """Request schema for finding matches"""
    preferences: PreferencesModel = Field(..., description="User preferences for matching")
    location: Optional[str] = Field("Cambridge, MA", description="Override location")

    class Config:
        json_schema_extra = {
            "example": {
                "preferences": {
                    "service_type": "haircut",
                    "budget_min": 40,
                    "budget_max": 60,
                    "time_urgency": "ASAP"
                },
                "location": "Cambridge, MA"
            }
        }


class MerchantOption(BaseModel):
    """Single merchant option with ranking details"""
    rank: int = Field(..., description="Ranking position (1-based)")
    merchant_id: Optional[str] = Field(None, description="Merchant unique ID")
    merchant_name: str = Field(..., description="Merchant business name")
    service_name: Optional[str] = Field(None, description="Specific service name")
    service_type: Optional[str] = Field(None, description="Service category")
    distance: Optional[float] = Field(None, description="Distance in miles")
    price: float = Field(..., description="Service price in USD", ge=0)
    rating: float = Field(..., description="Average rating (0-5)", ge=0, le=5)
    reviews: int = Field(0, description="Number of reviews", ge=0)
    available_times: List[str] = Field(default_factory=list, description="Available time slots")
    why_recommended: str = Field(..., description="Explanation for ranking")
    relevance_score: float = Field(..., description="Overall match score (0-1)", ge=0, le=1)

    # Enhanced fields for real provider data
    photo_url: Optional[str] = Field(None, description="Primary photo URL")
    photos: List[str] = Field(default_factory=list, description="Additional photo URLs")
    address: Optional[str] = Field(None, description="Full street address")
    city: Optional[str] = Field(None, description="City name")
    state: Optional[str] = Field(None, description="State abbreviation")
    phone: Optional[str] = Field(None, description="Business phone number")
    price_range: Optional[str] = Field(None, description="Price range ($, $$, $$$, $$$$)")
    specialties: List[str] = Field(default_factory=list, description="Specialties and expertise")
    stylist_names: List[str] = Field(default_factory=list, description="Names of stylists")
    booking_url: Optional[str] = Field(None, description="Direct booking URL")
    bio: Optional[str] = Field(None, description="Business description")
    yelp_url: Optional[str] = Field(None, description="Yelp business page URL")
    data_source: Optional[str] = Field(None, description="Data source: 'yelp', 'google_places', 'brightdata', or 'manual'")

    class Config:
        json_schema_extra = {
            "example": {
                "rank": 1,
                "merchant_id": "uuid-here",
                "merchant_name": "Tony's Barbershop",
                "service_name": "Men's Haircut",
                "service_type": "haircut",
                "distance": 1.2,
                "price": 45.0,
                "rating": 4.8,
                "reviews": 127,
                "available_times": ["2:00 PM", "3:30 PM", "5:00 PM"],
                "why_recommended": "Best price + highly rated",
                "relevance_score": 0.95
            }
        }


class FindMatchesResponse(BaseModel):
    """Response schema for find matches endpoint"""
    success: bool = Field(True, description="Whether the request succeeded")
    ranked_options: List[MerchantOption] = Field(default_factory=list, description="Ranked merchant options")
    total_options_found: int = Field(0, description="Total number of options found", ge=0)
    search_summary: str = Field(..., description="Human-readable search summary")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "ranked_options": [
                    {
                        "rank": 1,
                        "merchant_name": "Tony's Barbershop",
                        "service_name": "Men's Haircut",
                        "price": 45.0,
                        "rating": 4.8,
                        "reviews": 127,
                        "distance": 1.2,
                        "available_times": ["2:00 PM", "3:30 PM"],
                        "why_recommended": "Best price + highly rated",
                        "relevance_score": 0.95
                    }
                ],
                "total_options_found": 12,
                "search_summary": "Found 12 excellent matches! Top choice: Tony's Barbershop ($45, 4.8⭐)"
            }
        }


class ErrorResponse(BaseModel):
    """Error response schema"""
    success: bool = Field(False, description="Always false for errors")
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")

    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": "Invalid preferences",
                "detail": "service_type is required"
            }
        }
