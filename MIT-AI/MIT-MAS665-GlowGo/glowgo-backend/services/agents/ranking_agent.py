"""
Ranking Agent - The Core Matching Agent
Intelligently scores and ranks providers based on multiple factors
"""
from typing import Dict, List, Any, Optional
from crewai import Agent, Task
from services.tools.ranking_tools import (
    distance_calculator_tool,
    rating_normalizer_tool,
    price_fit_calculator_tool,
    match_score_calculator_tool,
    recommendation_explainer_tool
)


def create_ranking_agent() -> Agent:
    """
    Create the Ranking Agent with all ranking tools

    This is THE MOST IMPORTANT AGENT - it performs the core matching logic
    by scoring providers across multiple dimensions and producing ranked results.
    """
    return Agent(
        role="Intelligent Provider Ranking and Scoring Specialist",
        goal="Score and intelligently rank providers by match quality using multi-factor analysis",
        backstory=(
            "You are an expert at complex multi-factor ranking and optimization. "
            "You understand the subtle trade-offs between quality, price, distance, and availability. "
            "You balance competing factors to create perfect matches that delight users. "
            "You consider not just individual scores but how they work together to create "
            "the best overall experience. You provide clear explanations for your rankings."
        ),
        tools=[],  # Tools called manually in execute method
        verbose=True,
        allow_delegation=False,
        max_iter=15
    )


def create_ranking_task(
    agent: Agent,
    candidates_with_slots: List[Dict[str, Any]],
    user_location: Dict[str, float],
    budget_min: float,
    budget_max: float,
    time_urgency: str,
    user_preferences: Optional[Dict[str, Any]] = None
) -> Task:
    """
    Create a ranking task for the agent

    Args:
        agent: The ranking agent
        candidates_with_slots: List of providers with availability data
        user_location: User's coordinates {lat, lon}
        budget_min: Minimum budget (for price fit calculation)
        budget_max: Maximum budget
        time_urgency: Time urgency level (ASAP, today, week, flexible)
        user_preferences: Optional user preferences

    Returns:
        Task configured for ranking providers
    """

    # Build context with all necessary data
    context_data = {
        "candidates_with_slots": candidates_with_slots,
        "user_location": user_location,
        "budget_min": budget_min,
        "budget_max": budget_max,
        "time_urgency": time_urgency,
        "total_candidates": len(candidates_with_slots)
    }

    if user_preferences:
        context_data["user_preferences"] = user_preferences

    description = f"""
    Rank and score {len(candidates_with_slots)} provider candidates to find the best matches.

    USER CONTEXT:
    - Location: {user_location['lat']}, {user_location['lon']}
    - Budget Range: ${budget_min} - ${budget_max}
    - Time Urgency: {time_urgency}

    CANDIDATES TO EVALUATE:
    {_format_candidates_summary(candidates_with_slots)}

    YOUR TASK:
    For each candidate, you must:
    1. Calculate distance score using DistanceCalculatorTool
    2. Calculate rating score using RatingNormalizerTool
    3. Calculate price fit score using PriceFitCalculatorTool
    4. Calculate discount potential using DiscountPotentialCalculatorTool
    5. Determine availability score (1.0 if has slots, 0.5 if limited, 0.0 if none)
    6. Calculate overall match score using MatchScoreCalculatorTool
    7. Generate explanation using RecommendationExplainerTool

    Then:
    8. Use ResultSorterTool to sort all candidates by match score
    9. Return the top 3-4 providers

    SCORING WEIGHTS (built into MatchScoreCalculatorTool):
    - Quality (rating): 30%
    - Proximity (distance): 20%
    - Price fit: 20%
    - Discount potential: 20%
    - Availability: 10%

    OUTPUT REQUIREMENTS:
    Return a structured JSON with:
    {{
        "ranked_matches": [
            {{
                "rank": 1,
                "provider_id": "uuid",
                "provider_name": "name",
                "match_score": 0.92,
                "distance_miles": 2.3,
                "rating": 4.8,
                "review_count": 120,
                "price": 45.00,
                "available_slots": ["14:00", "14:30"],
                "components": {{
                    "rating_score": 0.96,
                    "distance_score": 0.88,
                    "price_fit_score": 0.93,
                    "discount_potential": 20.0,
                    "availability_score": 1.0
                }},
                "explanation": "Top-rated closest provider with availability now"
            }},
            ...
        ],
        "top_3": ["uuid1", "uuid2", "uuid3"],
        "total_ranked": 12,
        "scoring_explanation": {{
            "rating_weight": 0.30,
            "distance_weight": 0.20,
            "price_weight": 0.20,
            "discount_weight": 0.20,
            "availability_weight": 0.10,
            "methodology": "Multi-factor weighted scoring with quality prioritization"
        }}
    }}

    IMPORTANT:
    - Score ALL candidates thoroughly
    - Use EXACT tool outputs in your calculations
    - Do NOT make up scores or skip tools
    - Return top 3-4 matches only
    - Include clear explanations
    - Be precise with numbers
    """

    expected_output = """
    A complete JSON object containing:
    1. ranked_matches: Array of top 3-4 providers with full scoring details
    2. top_3: Array of provider IDs for quick reference
    3. total_ranked: Total number of candidates evaluated
    4. scoring_explanation: Details about the scoring methodology

    Each ranked match must include:
    - rank, provider_id, provider_name, match_score
    - distance_miles, rating, review_count, price
    - available_slots array
    - components object with all individual scores
    - explanation string describing why this provider ranks here
    """

    return Task(
        description=description,
        expected_output=expected_output,
        agent=agent
    )


def _format_candidates_summary(candidates: List[Dict[str, Any]]) -> str:
    """Format candidates for task description"""
    if not candidates:
        return "No candidates provided"

    summary_lines = []
    for i, candidate in enumerate(candidates[:5], 1):  # Show first 5 as examples
        provider_name = candidate.get("provider_name", candidate.get("name", "Unknown"))
        rating = candidate.get("rating", 0)
        price = candidate.get("price", candidate.get("service_price", 0))
        slots_count = len(candidate.get("available_slots", []))

        summary_lines.append(
            f"  {i}. {provider_name} - Rating: {rating}★, Price: ${price}, Slots: {slots_count}"
        )

    if len(candidates) > 5:
        summary_lines.append(f"  ... and {len(candidates) - 5} more candidates")

    return "\n".join(summary_lines)


def rank_providers(
    candidates_with_slots: List[Dict[str, Any]],
    user_location: Dict[str, float],
    budget_min: float,
    budget_max: float,
    time_urgency: str,
    user_preferences: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Main function to rank providers using the Ranking Agent

    This is a convenience function that creates the agent and task,
    then executes the ranking workflow.

    Args:
        candidates_with_slots: List of providers with their availability
        user_location: User's location {lat, lon}
        budget_min: Minimum budget
        budget_max: Maximum budget
        time_urgency: Time urgency level
        user_preferences: Optional user preferences

    Returns:
        Ranked results with top matches
    """
    from crewai import Crew

    # Create agent
    ranking_agent = create_ranking_agent()

    # Create task
    ranking_task = create_ranking_task(
        agent=ranking_agent,
        candidates_with_slots=candidates_with_slots,
        user_location=user_location,
        budget_min=budget_min,
        budget_max=budget_max,
        time_urgency=time_urgency,
        user_preferences=user_preferences
    )

    # Create crew and execute
    crew = Crew(
        agents=[ranking_agent],
        tasks=[ranking_task],
        verbose=True
    )

    result = crew.kickoff()

    return result


def calculate_availability_score(available_slots: List[str]) -> float:
    """
    Helper function to calculate availability score

    Args:
        available_slots: List of available time slots

    Returns:
        Score from 0.0 to 1.0
    """
    if not available_slots:
        return 0.0
    elif len(available_slots) >= 3:
        return 1.0  # Excellent availability
    elif len(available_slots) >= 1:
        return 0.7  # Limited availability
    else:
        return 0.0


class RankingAgent:
    """
    Ranking Agent wrapper for consistent interface with other agents
    """

    def __init__(self):
        """Initialize ranking agent"""
        pass

    async def execute(
        self,
        candidates: List[Dict[str, Any]],
        user_preferences: Dict[str, Any],
        user_location: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Execute ranking agent to score and rank candidates

        Args:
            candidates: List of provider candidates with availability
            user_preferences: User preferences including budget, etc.
            user_location: User location coordinates (optional)

        Returns:
            dict: {
                "ranked_providers": [...],
                "status": "success"
            }
        """
        try:
            ranked_providers = []

            # Simple scoring without complex tools for now
            for i, candidate in enumerate(candidates[:10]):
                # Calculate simple scores
                rating = candidate.get("rating", 0)
                price = candidate.get("price", 0)
                budget_max = user_preferences.get("budget_max", 999999)

                # Rating score (0-1)
                rating_score = rating / 5.0

                # Price score (1.0 if within budget, 0.0 otherwise)
                price_score = 1.0 if price <= budget_max else 0.0

                # Availability score
                slots = candidate.get("available_slots", [])
                availability_score = min(len(slots) / 3.0, 1.0)

                # Distance score (if available)
                distance = candidate.get("distance_miles", 0)
                if distance:
                    distance_score = max(1.0 - (distance / 10.0), 0.0)
                else:
                    distance_score = 0.5

                # Overall score (weighted)
                overall_score = (
                    rating_score * 0.40 +
                    price_score * 0.30 +
                    availability_score * 0.20 +
                    distance_score * 0.10
                ) * 100

                # Generate explanation
                explanation_parts = []
                if rating >= 4.5:
                    explanation_parts.append("Top-rated")
                if price <= budget_max:
                    explanation_parts.append("Within budget")
                if len(slots) > 0:
                    explanation_parts.append("Available")

                ranked_providers.append({
                    **candidate,
                    "overall_score": round(overall_score, 2),
                    "component_scores": {
                        "rating_score": round(rating_score, 2),
                        "price_score": round(price_score, 2),
                        "availability_score": round(availability_score, 2),
                        "distance_score": round(distance_score, 2)
                    },
                    "recommendation_reason": ", ".join(explanation_parts) if explanation_parts else "Good match"
                })

            # Sort by overall score
            ranked_providers.sort(key=lambda x: x["overall_score"], reverse=True)

            return {
                "ranked_providers": ranked_providers,
                "status": "success"
            }

        except Exception as e:
            print(f"RankingAgent error: {e}")
            import traceback
            traceback.print_exc()

            return {
                "ranked_providers": candidates[:10] if candidates else [],
                "status": "error",
                "error": str(e)
            }


# Global agent instance
ranking_agent = RankingAgent()


# Export functions and classes
__all__ = [
    "create_ranking_agent",
    "create_ranking_task",
    "rank_providers",
    "calculate_availability_score",
    "RankingAgent",
    "ranking_agent"
]
