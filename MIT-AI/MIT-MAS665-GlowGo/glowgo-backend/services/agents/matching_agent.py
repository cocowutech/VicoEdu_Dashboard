"""
Matching Agent for GlowGo Provider Discovery
Uses CrewAI framework with specialized matching tools
"""

from typing import Dict, Any, List, Optional
from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI

from config import settings, crew_config
from models.database import SessionLocal
from services.tools.matching_tools import (
    service_filter_tool,
    location_filter_tool,
    budget_filter_tool,
    availability_filter_tool,
    provider_status_checker_tool,
    candidate_aggregator_tool
)


class MatchingAgent:
    """
    Provider Filtering and Discovery Expert

    Orchestrates multi-stage filtering to find providers that
    perfectly match user preferences across all dimensions.
    """

    def __init__(self):
        """Initialize the Matching Agent with LLM and tools"""
        # Configure LLM
        self.llm = ChatGoogleGenerativeAI(
            model=settings.GOOGLE_GEMINI_MODEL or crew_config.LLM_MODEL,
            google_api_key=settings.GOOGLE_GEMINI_API_KEY,
            temperature=crew_config.LLM_TEMPERATURE,
            max_tokens=crew_config.LLM_MAX_TOKENS
        )

        # Create CrewAI agent
        self.agent = Agent(
            name="Matching Agent",
            role="Provider Filtering and Discovery Expert",
            goal="Find providers that perfectly fit user criteria",
            backstory="""You are an expert at filtering large provider databases.
            You quickly narrow down to the best candidates by applying multiple filters.
            You understand all matching dimensions: service type, location, budget, availability, and quality.
            You never compromise on quality - only verified, highly-rated providers make the cut.""",
            tools=[],  # Tools will be called manually for better control
            llm=self.llm,
            max_iterations=crew_config.MAX_ITERATIONS,
            memory=crew_config.AGENT_MEMORY,
            verbose=crew_config.AGENT_VERBOSE,
            allow_delegation=False
        )

    async def execute(
        self,
        preferences: Dict[str, Any],
        user_location: Optional[Dict[str, float]] = None,
        max_distance: float = 10.0
    ) -> Dict[str, Any]:
        """
        Execute matching agent workflow

        Args:
            preferences: User preferences dict containing:
                - service_type: str
                - budget_min: float (optional)
                - budget_max: float (optional)
                - time_urgency: str (ASAP, today, week, flexible)
                - artisan_preference: str (optional)
            user_location: {"lat": float, "lon": float} (optional)
            max_distance: Maximum distance in miles (default: 10)

        Returns:
            dict: {
                "candidates": list,
                "candidate_count": int,
                "filters_applied": list,
                "match_quality": float (0-1),
                "status": str,
                "message": str
            }
        """
        try:
            # Create database session
            db_session = SessionLocal()

            try:
                filters_applied = []

                # Step 1: Filter by service type
                service_type = preferences.get("service_type")
                if not service_type:
                    return {
                        "candidates": [],
                        "candidate_count": 0,
                        "filters_applied": [],
                        "match_quality": 0.0,
                        "status": "error",
                        "message": "Service type is required"
                    }

                # Get location from preferences (Boston/Cambridge filtering)
                location = preferences.get("location", "")

                print(f"🔍 Step 1: Filtering by service type: {service_type}" + (f" in {location}" if location else ""))
                service_result = service_filter_tool.execute({
                    "service_type": service_type,
                    "location": location,
                    "db_session": db_session
                })

                matching_services = service_result.get("matching_services", [])
                location_note = f" in {location}" if location else ""
                filters_applied.append(f"service_type: {service_type}{location_note} ({len(matching_services)} found)")

                if not matching_services:
                    return {
                        "candidates": [],
                        "candidate_count": 0,
                        "filters_applied": filters_applied,
                        "match_quality": 0.0,
                        "status": "no_results",
                        "message": f"No services found matching '{service_type}'"
                    }

                print(f"✅ Found {len(matching_services)} matching services")

                # Step 2: Filter by location (if user location provided)
                location_filtered = matching_services
                if user_location and user_location.get("lat") and user_location.get("lon"):
                    print(f"📍 Step 2: Filtering by location (max {max_distance} miles)")
                    location_result = location_filter_tool.execute({
                        "user_location": user_location,
                        "max_distance": max_distance,
                        "providers_db": matching_services
                    })

                    location_filtered = location_result.get("providers_within_distance", [])
                    filters_applied.append(f"location: < {max_distance} miles ({len(location_filtered)} within range)")

                    if not location_filtered:
                        return {
                            "candidates": [],
                            "candidate_count": 0,
                            "filters_applied": filters_applied,
                            "match_quality": 0.0,
                            "status": "no_results",
                            "message": f"No providers found within {max_distance} miles"
                        }

                    print(f"✅ {len(location_filtered)} providers within range")
                else:
                    print("⏭️  Step 2: Skipping location filter (no user location)")
                    filters_applied.append("location: not filtered (location not provided)")

                # Step 3: Filter by budget
                budget_min = preferences.get("budget_min")
                budget_max = preferences.get("budget_max")
                budget_filtered = location_filtered

                if budget_min or budget_max:
                    print(f"💰 Step 3: Filtering by budget (${budget_min or 0} - ${budget_max or 'unlimited'})")
                    budget_result = budget_filter_tool.execute({
                        "budget_min": budget_min,
                        "budget_max": budget_max,
                        "services": location_filtered
                    })

                    budget_filtered = budget_result.get("affordable_services", [])
                    budget_range = f"${budget_min or 0}-${budget_max or 'unlimited'}"
                    filters_applied.append(f"budget: {budget_range} ({len(budget_filtered)} affordable)")

                    if not budget_filtered:
                        return {
                            "candidates": [],
                            "candidate_count": 0,
                            "filters_applied": filters_applied,
                            "match_quality": 0.0,
                            "status": "no_results",
                            "message": f"No services found within budget {budget_range}"
                        }

                    print(f"✅ {len(budget_filtered)} services within budget")
                else:
                    print("⏭️  Step 3: Skipping budget filter (no budget specified)")
                    filters_applied.append("budget: not filtered (budget not specified)")

                # Step 4: Filter by availability
                time_urgency = preferences.get("time_urgency", "flexible")
                print(f"📅 Step 4: Filtering by availability (urgency: {time_urgency})")

                availability_result = availability_filter_tool.execute({
                    "time_urgency": time_urgency,
                    "providers": budget_filtered,
                    "db_session": db_session
                })

                availability_filtered = availability_result.get("available_providers", [])
                filters_applied.append(f"availability: {time_urgency} ({len(availability_filtered)} available)")

                if not availability_filtered:
                    return {
                        "candidates": [],
                        "candidate_count": 0,
                        "filters_applied": filters_applied,
                        "match_quality": 0.0,
                        "status": "no_results",
                        "message": f"No providers available for time urgency: {time_urgency}"
                    }

                print(f"✅ {len(availability_filtered)} providers available")

                # Step 5: Check provider status (quality control)
                print(f"🔐 Step 5: Checking provider status and quality")

                # Extract unique merchant IDs
                merchant_ids = list(set(
                    p.get("merchant_id") for p in availability_filtered
                    if p.get("merchant_id")
                ))

                status_result = provider_status_checker_tool.execute({
                    "provider_ids": merchant_ids,
                    "db_session": db_session
                })

                valid_providers = status_result.get("valid_providers", [])
                invalid_providers = status_result.get("invalid", [])

                filters_applied.append(f"provider_quality: verified & rated 4.0+ ({len(valid_providers)} passed)")

                if invalid_providers:
                    print(f"⚠️  Filtered out {len(invalid_providers)} low-quality providers")

                if not valid_providers:
                    return {
                        "candidates": [],
                        "candidate_count": 0,
                        "filters_applied": filters_applied,
                        "match_quality": 0.0,
                        "status": "no_results",
                        "message": "No verified, high-quality providers found"
                    }

                print(f"✅ {len(valid_providers)} high-quality providers validated")

                # Step 6: Aggregate final candidates
                print(f"🎯 Step 6: Aggregating final candidates")

                aggregator_result = candidate_aggregator_tool.execute({
                    "matching_services": matching_services,
                    "location_filtered": location_filtered,
                    "budget_filtered": budget_filtered,
                    "availability_filtered": availability_filtered,
                    "status_checked": valid_providers
                })

                final_candidates = aggregator_result.get("final_candidates", [])
                candidate_count = aggregator_result.get("count", 0)

                # Calculate overall match quality
                if final_candidates:
                    avg_match_score = sum(c.get("match_score", 0) for c in final_candidates) / len(final_candidates)
                    match_quality = round(avg_match_score / 100, 2)  # Convert to 0-1 scale
                else:
                    match_quality = 0.0

                print(f"🎉 Found {candidate_count} final candidates (avg quality: {match_quality})")

                # Format candidates for output
                formatted_candidates = []
                for candidate in final_candidates[:10]:  # Limit to top 10
                    formatted_candidates.append({
                        "provider_id": candidate.get("merchant_id"),
                        "provider_name": candidate.get("merchant_name"),
                        "service_id": candidate.get("id"),
                        "service_name": candidate.get("service_name"),
                        "price": float(candidate.get("base_price", 0)),
                        "distance": candidate.get("distance_miles"),
                        "rating": candidate.get("merchant_rating", 0),
                        "available": candidate.get("availability_score", 0) > 0.5,
                        "match_score": candidate.get("match_score", 0),
                        "is_verified": candidate.get("is_verified", False),
                        "duration_minutes": candidate.get("duration_minutes"),
                        "city": candidate.get("city"),
                        "state": candidate.get("state"),
                        # Enhanced fields for real provider data
                        "photo_url": candidate.get("merchant_photo") or candidate.get("photo_url", ""),
                        "photos": candidate.get("photos", []),
                        "address": candidate.get("address", ""),
                        "phone": candidate.get("phone", ""),
                        "price_range": candidate.get("price_range", ""),
                        "specialties": candidate.get("specialties", []),
                        "stylist_names": candidate.get("stylist_names", []),
                        "booking_url": candidate.get("booking_url", ""),
                        "yelp_url": candidate.get("yelp_url", ""),
                        "bio": candidate.get("bio", "")
                    })

                return {
                    "candidates": formatted_candidates,
                    "candidate_count": len(formatted_candidates),
                    "filters_applied": filters_applied,
                    "match_quality": match_quality,
                    "status": "success",
                    "message": f"Found {len(formatted_candidates)} excellent matches!"
                }

            finally:
                # Always close the session
                db_session.close()

        except Exception as e:
            print(f"MatchingAgent execution error: {e}")
            import traceback
            traceback.print_exc()

            # Fallback response
            return {
                "candidates": [],
                "candidate_count": 0,
                "filters_applied": ["error occurred"],
                "match_quality": 0.0,
                "status": "error",
                "message": f"Error during matching: {str(e)}"
            }

    def sync_execute(
        self,
        preferences: Dict[str, Any],
        user_location: Optional[Dict[str, float]] = None,
        max_distance: float = 10.0
    ) -> Dict[str, Any]:
        """
        Synchronous version of execute for non-async contexts

        Args:
            preferences: User preferences
            user_location: User location coordinates
            max_distance: Maximum search distance in miles

        Returns:
            Same as execute()
        """
        import asyncio

        # Check if there's a running event loop
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            # No running loop, create new one
            return asyncio.run(self.execute(preferences, user_location, max_distance))
        else:
            # Already in async context, create task
            return loop.run_until_complete(self.execute(preferences, user_location, max_distance))


# Global agent instance
matching_agent = MatchingAgent()
