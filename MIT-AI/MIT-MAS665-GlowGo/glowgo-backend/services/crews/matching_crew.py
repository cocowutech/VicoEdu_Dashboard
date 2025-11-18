"""
Matching Crew - Orchestrates all 5 agents for end-to-end service matching

This crew manages the complete workflow from preference gathering through
final ranking of service providers.
"""

from typing import Dict, Any, List, Optional
import logging

from services.agents.conversation_agent import conversation_agent
from services.agents.quality_assurance_agent import quality_assurance_agent
from services.agents.matching_agent import matching_agent
from services.agents.availability_agent import availability_agent
from services.agents.ranking_agent import ranking_agent


# Configure logging
logger = logging.getLogger(__name__)


class MatchingCrew:
    """
    Production matching crew that orchestrates 5 agents:
    1. ConversationAgent - Gathers preferences naturally
    2. QualityAssuranceAgent - Validates preferences completeness
    3. MatchingAgent - Finds merchant candidates
    4. AvailabilityAgent - Checks time slots
    5. RankingAgent - Ranks options by fit
    """

    def __init__(self):
        """Initialize the matching crew with all agents"""
        self.conversation_agent = conversation_agent
        self.qa_agent = quality_assurance_agent
        self.matching_agent = matching_agent
        self.availability_agent = availability_agent
        self.ranking_agent = ranking_agent

        logger.info("MatchingCrew initialized with 5 agents")

    async def run_preference_gathering(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        current_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Phase 1: Gather and validate user preferences

        Args:
            user_message: Current message from user
            conversation_history: Previous conversation messages
            current_preferences: Already extracted preferences

        Returns:
            dict: {
                "ready_to_match": bool,
                "extracted_preferences": dict,
                "response_to_user": str,
                "next_question": str or None,
                "conversation_context": str
            }
        """
        try:
            # Step 1: Run ConversationAgent to extract preferences
            logger.info(f"Running ConversationAgent with message: {user_message[:50]}...")

            conversation_result = await self.conversation_agent.execute(
                user_message=user_message,
                conversation_history=conversation_history,
                current_preferences=current_preferences
            )

            extracted_preferences = conversation_result.get("extracted_preferences", {})
            ready_to_match = conversation_result.get("ready_to_match", False)
            response_to_user = conversation_result.get("response_to_user", "")
            next_question = conversation_result.get("next_question")
            conversation_context = conversation_result.get("conversation_context", "")

            # Step 2: If ready to match, run QualityAssuranceAgent
            if ready_to_match:
                logger.info("ConversationAgent says ready to match. Running QA validation...")

                qa_result = await self.qa_agent.execute(
                    preferences=extracted_preferences
                )

                # Check validation results
                validation_passed = qa_result.get("validation_passed", False)
                is_valid = qa_result.get("ready_to_proceed", validation_passed)
                issues = qa_result.get("issues", [])

                # Generate clarification message from issues
                if issues and not is_valid:
                    clarification_message = f"I need a bit more information: {issues[0].get('message', 'Please provide more details')}"
                else:
                    clarification_message = None

                if not is_valid:
                    # QA found issues - need more information
                    logger.warning(f"QA validation failed with issues: {issues}")

                    ready_to_match = False
                    response_to_user = clarification_message or "I need a bit more information."

                    # Extract which field needs clarification
                    if issues:
                        next_question = issues[0].get("field")
                else:
                    logger.info("QA validation passed. Ready to proceed to matching.")

            return {
                "ready_to_match": ready_to_match,
                "extracted_preferences": extracted_preferences,
                "response_to_user": response_to_user,
                "next_question": next_question,
                "conversation_context": conversation_context
            }

        except Exception as e:
            logger.error(f"Error in preference gathering: {e}", exc_info=True)

            # Fallback response
            return {
                "ready_to_match": False,
                "extracted_preferences": current_preferences,
                "response_to_user": "I'd love to help! What service are you looking for?",
                "next_question": "service_type",
                "conversation_context": ""
            }

    async def run(
        self,
        preferences: Dict[str, Any],
        location: str = "Cambridge, MA"
    ) -> Dict[str, Any]:
        """
        Simple run method for matching, checking availability, and ranking providers

        This is a simplified interface that follows the standard crew pattern.
        For more control, use run_matching_and_ranking() instead.

        Args:
            preferences: User preferences dict containing:
                - service_type: str (required)
                - budget_min: float (optional)
                - budget_max: float (optional)
                - time_urgency: str (optional: "ASAP", "today", "week", "flexible")
                - location: str (optional, overridden by location parameter)
            location: Location string (default: "Cambridge, MA")

        Returns:
            dict: {
                "ranked_options": [
                    {
                        "rank": int,
                        "merchant_id": str,
                        "merchant_name": str,
                        "service_type": str,
                        "distance": float,
                        "price": float,
                        "rating": float (0-5),
                        "reviews": int,
                        "available_times": [str],
                        "why_recommended": str,
                        "relevance_score": float (0-1)
                    }
                ],
                "total_options_found": int,
                "search_summary": str
            }
        """
        # For now, we'll use a default location (can be enhanced with geocoding)
        # This simplified version doesn't require exact coordinates
        user_location = None  # Let the matching agent handle location-based filtering

        # Call the comprehensive method
        return await self.run_matching_and_ranking(
            preferences=preferences,
            user_location=user_location,
            max_distance=10.0
        )

    async def run_matching_and_ranking(
        self,
        preferences: Dict[str, Any],
        user_location: Optional[Dict[str, float]] = None,
        max_distance: float = 10.0
    ) -> Dict[str, Any]:
        """
        Phase 2: Find, check availability, and rank service providers

        Args:
            preferences: User preferences dict containing:
                - service_type: str
                - budget_min: float (optional)
                - budget_max: float (optional)
                - time_urgency: str (ASAP, today, week, flexible)
                - artisan_preference: str (optional)
            user_location: {"lat": float, "lon": float} (optional)
            max_distance: Maximum search distance in miles

        Returns:
            dict: {
                "ranked_options": [
                    {
                        "rank": int,
                        "merchant_id": str,
                        "merchant_name": str,
                        "service_name": str,
                        "service_type": str,
                        "distance": float,
                        "price": float,
                        "available_times": [str],
                        "rating": float,
                        "why_recommended": str,
                        "relevance_score": float
                    }
                ],
                "total_options_found": int,
                "search_summary": str
            }
        """
        try:
            # Step 1: Run MatchingAgent to find candidates
            logger.info(f"Running MatchingAgent with preferences: {preferences.get('service_type')}")

            matching_result = await self.matching_agent.execute(
                preferences=preferences,
                user_location=user_location,
                max_distance=max_distance
            )

            if matching_result.get("status") != "success":
                logger.warning(f"MatchingAgent returned non-success: {matching_result.get('message')}")

                return {
                    "ranked_options": [],
                    "total_options_found": 0,
                    "search_summary": matching_result.get("message", "No providers found matching your criteria.")
                }

            candidates = matching_result.get("candidates", [])
            candidate_count = matching_result.get("candidate_count", 0)

            if candidate_count == 0:
                return {
                    "ranked_options": [],
                    "total_options_found": 0,
                    "search_summary": "No providers found. Try adjusting your budget or location."
                }

            logger.info(f"MatchingAgent found {candidate_count} candidates")

            # Step 2: Run AvailabilityAgent to check time slots
            logger.info("Running AvailabilityAgent to check availability...")

            time_urgency = preferences.get("time_urgency", "flexible")
            preferred_date = preferences.get("preferred_date")
            preferred_time = preferences.get("preferred_time")
            time_constraint = preferences.get("time_constraint")

            availability_result = await self.availability_agent.execute(
                candidates=candidates,
                preferred_date=preferred_date,
                preferred_time=preferred_time,
                time_constraint=time_constraint,
                time_urgency=time_urgency
            )

            available_providers = availability_result.get("candidates_with_slots", [])
            available_count = availability_result.get("providers_available", 0)

            if available_count == 0:
                logger.warning("No providers have availability")

                return {
                    "ranked_options": [],
                    "total_options_found": candidate_count,
                    "search_summary": f"Found {candidate_count} providers, but none have availability. Try selecting flexible timing."
                }

            logger.info(f"AvailabilityAgent found {available_count} available providers")

            # Step 3: Run RankingAgent to rank by fit
            logger.info("Running RankingAgent to rank providers...")

            ranking_result = await self.ranking_agent.execute(
                candidates=available_providers,
                user_preferences=preferences,
                user_location=user_location
            )

            ranked_providers = ranking_result.get("ranked_providers", [])

            if not ranked_providers:
                logger.warning("RankingAgent returned no ranked providers")

                return {
                    "ranked_options": [],
                    "total_options_found": available_count,
                    "search_summary": f"Found {available_count} available providers but couldn't rank them."
                }

            logger.info(f"RankingAgent ranked {len(ranked_providers)} providers")

            # Format output
            ranked_options = []

            for rank, provider in enumerate(ranked_providers[:10], start=1):
                # Format available times as time strings
                available_slots = provider.get("available_slots", [])
                formatted_times = []
                for slot in available_slots[:5]:  # First 5 slots
                    if isinstance(slot, dict):
                        time_str = slot.get("time", slot.get("datetime", ""))
                        formatted_times.append(time_str)
                    else:
                        formatted_times.append(str(slot))

                ranked_options.append({
                    "rank": rank,
                    "merchant_id": provider.get("provider_id"),
                    "merchant_name": provider.get("provider_name"),
                    "service_name": provider.get("service_name"),
                    "service_type": preferences.get("service_type"),
                    "distance": round(provider.get("distance_miles", 0), 1) if provider.get("distance_miles") else None,
                    "price": float(provider.get("price", 0)),
                    "rating": float(provider.get("rating", 0)),
                    "reviews": int(provider.get("review_count", 0)),
                    "available_times": formatted_times,
                    "why_recommended": provider.get("recommendation_reason", "Great match for your needs"),
                    "relevance_score": round(provider.get("overall_score", 0) / 100, 2)  # Convert to 0-1 scale
                })

            search_summary = (
                f"Found {len(ranked_options)} excellent matches! "
                f"Top choice: {ranked_options[0]['merchant_name']} "
                f"(${ranked_options[0]['price']}, {ranked_options[0]['rating']}⭐)"
            )

            return {
                "ranked_options": ranked_options,
                "total_options_found": len(ranked_options),
                "search_summary": search_summary
            }

        except Exception as e:
            logger.error(f"Error in matching and ranking: {e}", exc_info=True)

            # Fallback response
            return {
                "ranked_options": [],
                "total_options_found": 0,
                "search_summary": f"An error occurred during matching: {str(e)}"
            }

    async def run_complete_flow(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        current_preferences: Dict[str, Any],
        user_location: Optional[Dict[str, float]] = None,
        max_distance: float = 10.0
    ) -> Dict[str, Any]:
        """
        Run complete flow: preference gathering + matching + ranking

        This is a convenience method that runs both phases if ready to match.

        Args:
            user_message: Current user message
            conversation_history: Previous messages
            current_preferences: Already extracted preferences
            user_location: User coordinates (optional)
            max_distance: Search radius in miles

        Returns:
            dict: Combined result from both phases
        """
        try:
            # Phase 1: Gather preferences
            gathering_result = await self.run_preference_gathering(
                user_message=user_message,
                conversation_history=conversation_history,
                current_preferences=current_preferences
            )

            # If not ready to match, return just the gathering result
            if not gathering_result.get("ready_to_match"):
                return {
                    "phase": "preference_gathering",
                    "ready_to_match": False,
                    "response_to_user": gathering_result.get("response_to_user"),
                    "next_question": gathering_result.get("next_question"),
                    "extracted_preferences": gathering_result.get("extracted_preferences")
                }

            # Phase 2: Match and rank
            logger.info("Preferences complete. Running matching and ranking...")

            matching_result = await self.run_matching_and_ranking(
                preferences=gathering_result.get("extracted_preferences"),
                user_location=user_location,
                max_distance=max_distance
            )

            return {
                "phase": "matching_complete",
                "ready_to_match": True,
                "extracted_preferences": gathering_result.get("extracted_preferences"),
                "ranked_options": matching_result.get("ranked_options", []),
                "total_options_found": matching_result.get("total_options_found", 0),
                "search_summary": matching_result.get("search_summary", "")
            }

        except Exception as e:
            logger.error(f"Error in complete flow: {e}", exc_info=True)

            return {
                "phase": "error",
                "ready_to_match": False,
                "response_to_user": "I encountered an error. Please try again.",
                "next_question": None,
                "extracted_preferences": current_preferences
            }


# Global crew instance for easy import
matching_crew = MatchingCrew()
