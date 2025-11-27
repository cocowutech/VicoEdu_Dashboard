"""
Matching Tools for CrewAI Multi-Agent System
Production-ready tools with Pydantic validation for service and provider matching
"""

import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from models.database import SessionLocal


class ServiceFilterTool(BaseModel):
    """Tool to filter services by service type with fuzzy matching"""

    name: str = "service_filter"
    description: str = "Filters services by type with exact and partial matching"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter services by service type

        Args:
            inputs: {
                "service_type": str,  # e.g., "haircut", "nails"
                "location": str (optional),  # e.g., "Boston", "Cambridge"
                "db_session": Session (optional, will create if not provided)
            }

        Returns:
            {
                "matching_services": list,  # List of service objects
                "count": int
            }
        """
        try:
            service_type = inputs.get("service_type", "").lower()
            location = inputs.get("location", "")
            db_session = inputs.get("db_session")
            close_session = False

            if not service_type:
                return {"matching_services": [], "count": 0}

            # Create session if not provided
            if db_session is None:
                db_session = SessionLocal()
                close_session = True

            try:
                # Import here to avoid circular imports
                from sqlalchemy import text

                # Keyword mappings for fuzzy matching
                service_keywords = {
                    "haircut": ["haircut", "cut", "trim", "style", "barber", "hair"],
                    "nails": ["nail", "manicure", "pedicure", "mani", "pedi"],
                    "massage": ["massage", "deep tissue", "swedish", "hot stone", "body work"],
                    "spa": ["spa", "relaxation", "treatment"],
                    "facial": ["facial", "skincare", "skin care", "face"],
                    "waxing": ["wax", "hair removal", "brazilian"],
                    "makeup": ["makeup", "cosmetic", "beauty", "glam"],
                    "cleaning": ["clean", "maid", "housekeeping"]
                }

                # Get keywords for the service type
                keywords = service_keywords.get(service_type, [service_type])

                # Build SQL query with ILIKE for case-insensitive matching
                # Match against service_name - including enhanced fields

                # Build location filter clause
                location_clause = ""
                if location:
                    # Handle "Boston/Cambridge" (either location) or specific city
                    if "/" in location:
                        cities = [c.strip() for c in location.split("/")]
                        location_clause = " AND (" + " OR ".join([f"LOWER(m.city) LIKE :city_{i}" for i in range(len(cities))]) + ")"
                    else:
                        location_clause = " AND LOWER(m.city) LIKE :city_0"

                query = text("""
                    SELECT DISTINCT
                           s.id, s.merchant_id, s.service_name, s.description,
                           s.base_price, s.duration_minutes, s.photo_url, s.is_active,
                           m.business_name, m.rating, m.is_verified,
                           m.location_lat, m.location_lon, m.city, m.state,
                           m.phone, m.address, m.photo_url as merchant_photo,
                           m.price_range, m.photos, m.specialties, m.stylist_names,
                           m.booking_url, m.yelp_url, m.bio, m.data_source
                    FROM services s
                    JOIN merchants m ON s.merchant_id = m.id
                    WHERE s.is_active = true
                    AND (
                        """ + " OR ".join([f"LOWER(s.service_name) LIKE :keyword_{i}" for i in range(len(keywords))]) + """
                        OR """ + " OR ".join([f"LOWER(m.service_category) LIKE :cat_keyword_{i}" for i in range(len(keywords))]) + """
                    )
                    """ + location_clause + """
                    ORDER BY m.rating DESC, s.base_price ASC
                """)

                # Build parameters
                params = {}
                for i, keyword in enumerate(keywords):
                    params[f"keyword_{i}"] = f"%{keyword}%"
                    params[f"cat_keyword_{i}"] = f"%{keyword}%"

                # Add location parameters
                if location:
                    if "/" in location:
                        cities = [c.strip() for c in location.split("/")]
                        for i, city in enumerate(cities):
                            params[f"city_{i}"] = f"%{city.lower()}%"
                    else:
                        params["city_0"] = f"%{location.lower()}%"

                result = db_session.execute(query, params)
                rows = result.fetchall()

                # Convert to dictionaries with enhanced fields
                matching_services = []
                for row in rows:
                    service_dict = {
                        "id": str(row[0]),
                        "merchant_id": str(row[1]),
                        "service_name": row[2],
                        "description": row[3],
                        "base_price": float(row[4]) if row[4] else 0.0,
                        "duration_minutes": row[5],
                        "photo_url": row[6],
                        "is_active": row[7],
                        "merchant_name": row[8],
                        "merchant_rating": float(row[9]) if row[9] else 0.0,
                        "is_verified": row[10],
                        "location_lat": float(row[11]) if row[11] else None,
                        "location_lon": float(row[12]) if row[12] else None,
                        "city": row[13] if len(row) > 13 else "",
                        "state": row[14] if len(row) > 14 else "",
                        # Enhanced fields
                        "phone": row[15] if len(row) > 15 else "",
                        "address": row[16] if len(row) > 16 else "",
                        "merchant_photo": row[17] if len(row) > 17 else "",
                        "price_range": row[18] if len(row) > 18 else "",
                        "photos": row[19] if len(row) > 19 else [],
                        "specialties": row[20] if len(row) > 20 else [],
                        "stylist_names": row[21] if len(row) > 21 else [],
                        "booking_url": row[22] if len(row) > 22 else "",
                        "yelp_url": row[23] if len(row) > 23 else "",
                        "bio": row[24] if len(row) > 24 else "",
                        "data_source": row[25] if len(row) > 25 else "manual"
                    }
                    matching_services.append(service_dict)

                return {
                    "matching_services": matching_services,
                    "count": len(matching_services)
                }

            finally:
                if close_session:
                    db_session.close()

        except Exception as e:
            print(f"ServiceFilterTool error: {e}")
            return {"matching_services": [], "count": 0}


class LocationFilterTool(BaseModel):
    """Tool to filter providers by distance using Haversine formula"""

    name: str = "location_filter"
    description: str = "Filters providers within specified distance using Haversine calculation"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter providers by location proximity

        Args:
            inputs: {
                "user_location": {"lat": float, "lon": float},
                "max_distance": float,  # in miles
                "providers_db": list  # List of provider/service objects with location
            }

        Returns:
            {
                "providers_within_distance": list,  # Sorted by distance
                "count": int
            }
        """
        try:
            user_location = inputs.get("user_location", {})
            max_distance = inputs.get("max_distance", 10.0)  # Default 10 miles
            providers = inputs.get("providers_db", [])

            user_lat = user_location.get("lat")
            user_lon = user_location.get("lon")

            if user_lat is None or user_lon is None:
                # If no user location, return all providers
                return {
                    "providers_within_distance": providers,
                    "count": len(providers)
                }

            # Calculate distance for each provider
            providers_with_distance = []
            for provider in providers:
                provider_lat = provider.get("location_lat")
                provider_lon = provider.get("location_lon")

                if provider_lat is None or provider_lon is None:
                    # Skip providers without location
                    continue

                # Calculate Haversine distance
                distance = self._haversine_distance(
                    user_lat, user_lon,
                    provider_lat, provider_lon
                )

                if distance <= max_distance:
                    provider_copy = provider.copy()
                    provider_copy["distance_miles"] = round(distance, 2)
                    providers_with_distance.append(provider_copy)

            # Sort by distance (closest first)
            providers_with_distance.sort(key=lambda x: x["distance_miles"])

            return {
                "providers_within_distance": providers_with_distance,
                "count": len(providers_with_distance)
            }

        except Exception as e:
            print(f"LocationFilterTool error: {e}")
            return {"providers_within_distance": [], "count": 0}

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates using Haversine formula

        Returns distance in miles
        """
        # Earth radius in miles
        R = 3959.0

        # Convert to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
        c = 2 * math.asin(math.sqrt(a))

        distance = R * c
        return distance


class BudgetFilterTool(BaseModel):
    """Tool to filter services by budget with flexibility"""

    name: str = "budget_filter"
    description: str = "Filters services within budget range with 10% flexibility"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter services by budget

        Args:
            inputs: {
                "budget_min": float (optional),
                "budget_max": float (optional),
                "services": list  # List of service objects
            }

        Returns:
            {
                "affordable_services": list,  # Sorted by price
                "count": int
            }
        """
        try:
            budget_min = inputs.get("budget_min")
            budget_max = inputs.get("budget_max")
            services = inputs.get("services", [])

            if not services:
                return {"affordable_services": [], "count": 0}

            # If no budget specified, return all services
            if budget_min is None and budget_max is None:
                services.sort(key=lambda x: x.get("base_price", 0))
                return {
                    "affordable_services": services,
                    "count": len(services)
                }

            # Apply 10% flexibility
            flexibility = 0.10

            if budget_max is not None:
                flexible_max = budget_max * (1 + flexibility)
            else:
                flexible_max = float('inf')

            if budget_min is not None:
                flexible_min = budget_min * (1 - flexibility)
            else:
                flexible_min = 0.0

            # Filter services
            affordable_services = []
            for service in services:
                price = service.get("base_price", 0)

                if flexible_min <= price <= flexible_max:
                    affordable_services.append(service)

            # Sort by price (cheapest first)
            affordable_services.sort(key=lambda x: x.get("base_price", 0))

            return {
                "affordable_services": affordable_services,
                "count": len(affordable_services)
            }

        except Exception as e:
            print(f"BudgetFilterTool error: {e}")
            return {"affordable_services": [], "count": 0}


class AvailabilityFilterTool(BaseModel):
    """Tool to filter providers by availability based on time urgency"""

    name: str = "availability_filter"
    description: str = "Filters providers based on availability and time urgency"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter providers by availability

        Enhanced to handle:
        1. preferred_date (ISO format)
        2. preferred_time (HH:MM format)
        3. time_constraint ("before", "after", "by")
        4. time_urgency (fallback: "ASAP", "today", "week", "flexible")

        Args:
            inputs: {
                "preferred_date": str (optional),  # ISO format date
                "preferred_time": str (optional),  # HH:MM format
                "time_constraint": str (optional),  # "before", "after", "by"
                "time_urgency": str,  # "ASAP", "today", "week", "flexible"
                "providers": list,  # List of provider objects
                "db_session": Session (optional)
            }

        Returns:
            {
                "available_providers": list,
                "count": int
            }
        """
        try:
            preferred_date = inputs.get("preferred_date")
            preferred_time = inputs.get("preferred_time")
            time_constraint = inputs.get("time_constraint")
            time_urgency = inputs.get("time_urgency", "flexible").lower()
            providers = inputs.get("providers", [])
            db_session = inputs.get("db_session")
            close_session = False

            if not providers:
                return {"available_providers": [], "count": 0}

            # Create session if not provided
            if db_session is None:
                db_session = SessionLocal()
                close_session = True

            try:
                # Import here to avoid circular imports
                from sqlalchemy import text

                today = datetime.now().date()

                # Determine date range based on preferences
                # Priority: preferred_date > time_urgency

                if preferred_date:
                    # User specified a specific date
                    target_date = datetime.fromisoformat(preferred_date).date()

                    if time_constraint == "before":
                        # "before [date]" means from today up to (but not including) that date
                        start_date = today
                        end_date = target_date - timedelta(days=1)
                    elif time_constraint == "by":
                        # "by [date]" means from today up to and including that date
                        start_date = today
                        end_date = target_date
                    elif time_constraint == "after":
                        # "after [date]" means from the day after onwards (next 7 days)
                        start_date = target_date + timedelta(days=1)
                        end_date = target_date + timedelta(days=8)
                    else:
                        # No constraint - just that specific date
                        start_date = target_date
                        end_date = target_date

                elif time_urgency in ["asap", "today"]:
                    start_date = today
                    end_date = today
                elif time_urgency == "week":
                    start_date = today
                    end_date = today + timedelta(days=7)
                else:  # flexible
                    # All providers are considered available for flexible timing
                    return {
                        "available_providers": providers,
                        "count": len(providers)
                    }

                # Check availability by looking at existing bookings
                available_providers = []

                for provider in providers:
                    merchant_id = provider.get("merchant_id")

                    if not merchant_id:
                        continue

                    # Query to check if provider has availability
                    # A provider is available if they don't have bookings filling all time slots
                    query = text("""
                        SELECT COUNT(*) as booking_count
                        FROM bookings
                        WHERE merchant_id = :merchant_id
                        AND booking_date BETWEEN :start_date AND :end_date
                        AND status IN ('confirmed', 'pending')
                    """)

                    result = db_session.execute(
                        query,
                        {
                            "merchant_id": merchant_id,
                            "start_date": start_date,
                            "end_date": end_date
                        }
                    )
                    row = result.fetchone()
                    booking_count = row[0] if row else 0

                    # Simple heuristic: if fewer than 8 bookings per day in the range,
                    # consider them available (assuming 8-hour workday)
                    days_in_range = (end_date - start_date).days + 1
                    max_bookings = days_in_range * 8

                    if booking_count < max_bookings:
                        provider_copy = provider.copy()
                        provider_copy["availability_score"] = 1 - (booking_count / max_bookings)
                        available_providers.append(provider_copy)

                # Sort by availability score (most available first)
                available_providers.sort(key=lambda x: x.get("availability_score", 0), reverse=True)

                return {
                    "available_providers": available_providers,
                    "count": len(available_providers)
                }

            finally:
                if close_session:
                    db_session.close()

        except Exception as e:
            print(f"AvailabilityFilterTool error: {e}")
            # On error, return all providers as potentially available
            return {
                "available_providers": inputs.get("providers", []),
                "count": len(inputs.get("providers", []))
            }


class ProviderStatusCheckerTool(BaseModel):
    """Tool to check provider status, rating, and verification"""

    name: str = "provider_status_checker"
    description: str = "Validates provider status, rating, and verification"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check provider status and quality

        Args:
            inputs: {
                "provider_ids": list,  # List of merchant/provider IDs
                "db_session": Session (optional)
            }

        Returns:
            {
                "valid_providers": list,
                "invalid": list,
                "count": int
            }
        """
        try:
            provider_ids = inputs.get("provider_ids", [])
            db_session = inputs.get("db_session")
            close_session = False

            if not provider_ids:
                return {"valid_providers": [], "invalid": [], "count": 0}

            # Create session if not provided
            if db_session is None:
                db_session = SessionLocal()
                close_session = True

            try:
                # Import here to avoid circular imports
                from sqlalchemy import text

                # Quality thresholds
                MIN_RATING = 4.0

                valid_providers = []
                invalid_providers = []

                for provider_id in provider_ids:
                    # Query merchant status with enhanced fields
                    query = text("""
                        SELECT id, business_name, email, phone, location_lat, location_lon,
                               address, city, state, zip_code, service_category,
                               rating, total_reviews, is_verified, photo_url, bio,
                               years_experience, yelp_id, price_range, photos, specialties,
                               stylist_names, booking_url, yelp_url, data_source
                        FROM merchants
                        WHERE id = :provider_id
                    """)

                    result = db_session.execute(query, {"provider_id": provider_id})
                    row = result.fetchone()

                    if not row:
                        invalid_providers.append({
                            "id": provider_id,
                            "reason": "Provider not found"
                        })
                        continue

                    # Extract data
                    rating = float(row[11]) if row[11] else 0.0
                    is_verified = row[13]

                    # Check status criteria
                    reasons = []

                    # Must be verified
                    if not is_verified:
                        reasons.append("Not verified")

                    # Must have minimum rating
                    if rating < MIN_RATING:
                        reasons.append(f"Rating below minimum ({rating} < {MIN_RATING})")

                    if reasons:
                        invalid_providers.append({
                            "id": str(row[0]),
                            "business_name": row[1],
                            "rating": rating,
                            "is_verified": is_verified,
                            "reasons": reasons
                        })
                    else:
                        # Valid provider with enhanced fields
                        provider_dict = {
                            "id": str(row[0]),
                            "business_name": row[1],
                            "email": row[2],
                            "phone": row[3],
                            "location_lat": float(row[4]) if row[4] else None,
                            "location_lon": float(row[5]) if row[5] else None,
                            "address": row[6],
                            "city": row[7],
                            "state": row[8],
                            "zip_code": row[9],
                            "service_category": row[10],
                            "rating": rating,
                            "total_reviews": row[12],
                            "is_verified": is_verified,
                            "photo_url": row[14],
                            "bio": row[15],
                            "years_experience": row[16],
                            # Enhanced fields
                            "yelp_id": row[17] if len(row) > 17 else None,
                            "price_range": row[18] if len(row) > 18 else "",
                            "photos": row[19] if len(row) > 19 else [],
                            "specialties": row[20] if len(row) > 20 else [],
                            "stylist_names": row[21] if len(row) > 21 else [],
                            "booking_url": row[22] if len(row) > 22 else "",
                            "yelp_url": row[23] if len(row) > 23 else "",
                            "data_source": row[24] if len(row) > 24 else "manual"
                        }
                        valid_providers.append(provider_dict)

                return {
                    "valid_providers": valid_providers,
                    "invalid": invalid_providers,
                    "count": len(valid_providers)
                }

            finally:
                if close_session:
                    db_session.close()

        except Exception as e:
            print(f"ProviderStatusCheckerTool error: {e}")
            return {"valid_providers": [], "invalid": [], "count": 0}


class CandidateAggregatorTool(BaseModel):
    """Tool to aggregate and rank final candidates from all filters"""

    name: str = "candidate_aggregator"
    description: str = "Aggregates filtered results and ranks candidates by match quality"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Aggregate and rank final candidates

        Args:
            inputs: {
                "matching_services": list,
                "location_filtered": list,
                "budget_filtered": list,
                "availability_filtered": list,
                "status_checked": list
            }

        Returns:
            {
                "final_candidates": list,  # Sorted by match quality
                "count": int,
                "filters_applied": int
            }
        """
        try:
            matching_services = inputs.get("matching_services", [])
            location_filtered = inputs.get("location_filtered", [])
            budget_filtered = inputs.get("budget_filtered", [])
            availability_filtered = inputs.get("availability_filtered", [])
            status_checked = inputs.get("status_checked", [])

            # Count how many filters were applied
            filters_applied = 0
            if matching_services:
                filters_applied += 1
            if location_filtered:
                filters_applied += 1
            if budget_filtered:
                filters_applied += 1
            if availability_filtered:
                filters_applied += 1
            if status_checked:
                filters_applied += 1

            if filters_applied == 0:
                return {
                    "final_candidates": [],
                    "count": 0,
                    "filters_applied": 0
                }

            # Create sets of service IDs from each filter for intersection
            service_ids = set(s.get("id") for s in matching_services if s.get("id"))

            # If we have other filters, intersect them
            if budget_filtered:
                budget_ids = set(s.get("id") for s in budget_filtered if s.get("id"))
                service_ids = service_ids.intersection(budget_ids) if service_ids else budget_ids

            # Build merchant ID sets for provider-level filters
            if location_filtered:
                location_merchant_ids = set(
                    p.get("merchant_id") or p.get("id")
                    for p in location_filtered
                    if p.get("merchant_id") or p.get("id")
                )
            else:
                location_merchant_ids = None

            if availability_filtered:
                availability_merchant_ids = set(
                    p.get("merchant_id") or p.get("id")
                    for p in availability_filtered
                    if p.get("merchant_id") or p.get("id")
                )
            else:
                availability_merchant_ids = None

            if status_checked:
                status_merchant_ids = set(
                    p.get("id") for p in status_checked if p.get("id")
                )
            else:
                status_merchant_ids = None

            # Aggregate candidates with metadata
            candidates_map = {}

            for service in matching_services:
                service_id = service.get("id")
                merchant_id = service.get("merchant_id")

                # Check if service passes all filters
                if service_ids and service_id not in service_ids:
                    continue

                # Check provider-level filters
                if location_merchant_ids and merchant_id not in location_merchant_ids:
                    continue
                if availability_merchant_ids and merchant_id not in availability_merchant_ids:
                    continue
                if status_merchant_ids and merchant_id not in status_merchant_ids:
                    continue

                # Build comprehensive candidate object
                candidate = service.copy()

                # Add metadata from other filters
                for loc_provider in location_filtered:
                    if (loc_provider.get("merchant_id") == merchant_id or
                        loc_provider.get("id") == merchant_id):
                        candidate["distance_miles"] = loc_provider.get("distance_miles")
                        break

                for avail_provider in availability_filtered:
                    if (avail_provider.get("merchant_id") == merchant_id or
                        avail_provider.get("id") == merchant_id):
                        candidate["availability_score"] = avail_provider.get("availability_score", 1.0)
                        break

                # Calculate match quality score
                candidate["match_score"] = self._calculate_match_score(candidate)

                candidates_map[service_id] = candidate

            # Convert to list and sort by match score
            final_candidates = list(candidates_map.values())
            final_candidates.sort(key=lambda x: x.get("match_score", 0), reverse=True)

            return {
                "final_candidates": final_candidates,
                "count": len(final_candidates),
                "filters_applied": filters_applied
            }

        except Exception as e:
            print(f"CandidateAggregatorTool error: {e}")
            return {
                "final_candidates": [],
                "count": 0,
                "filters_applied": 0
            }

    def _calculate_match_score(self, candidate: Dict[str, Any]) -> float:
        """
        Calculate match quality score (0-100)

        Factors:
        - Merchant rating (40%)
        - Distance proximity (30%)
        - Availability (20%)
        - Verification status (10%)
        """
        score = 0.0

        # Rating score (0-40 points)
        rating = candidate.get("merchant_rating", 0)
        score += (rating / 5.0) * 40

        # Distance score (0-30 points)
        distance = candidate.get("distance_miles")
        if distance is not None:
            # Closer is better: 0 miles = 30 points, 10+ miles = 0 points
            distance_score = max(0, 30 - (distance * 3))
            score += distance_score
        else:
            # No distance data, give neutral score
            score += 15

        # Availability score (0-20 points)
        availability = candidate.get("availability_score", 0.5)
        score += availability * 20

        # Verification bonus (0-10 points)
        if candidate.get("is_verified"):
            score += 10

        return round(score, 2)


# Tool instances for easy import
service_filter_tool = ServiceFilterTool()
location_filter_tool = LocationFilterTool()
budget_filter_tool = BudgetFilterTool()
availability_filter_tool = AvailabilityFilterTool()
provider_status_checker_tool = ProviderStatusCheckerTool()
candidate_aggregator_tool = CandidateAggregatorTool()
