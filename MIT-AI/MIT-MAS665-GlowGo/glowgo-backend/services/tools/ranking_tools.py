"""
Ranking and Scoring Tools for Provider Matching
Simple Pydantic-based tools without crewai_tools dependency
"""
from typing import Dict, List, Any
from math import radians, sin, cos, sqrt, atan2
from pydantic import BaseModel, Field


# Tool 1: Distance Calculator
class DistanceCalculatorTool(BaseModel):
    """Tool to calculate distance between user and provider"""

    name: str = "distance_calculator"
    description: str = "Calculate distance between user and provider using Haversine formula and convert to 0-1 score"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, float]:
        """Calculate distance and convert to score"""
        try:
            provider_lat = inputs.get("provider_lat")
            provider_lon = inputs.get("provider_lon")
            user_lat = inputs.get("user_lat")
            user_lon = inputs.get("user_lon")

            # Haversine formula
            R = 3959.0  # Earth radius in miles

            lat1, lon1 = radians(user_lat), radians(user_lon)
            lat2, lon2 = radians(provider_lat), radians(provider_lon)

            dlat = lat2 - lat1
            dlon = lon2 - lon1

            a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
            c = 2 * atan2(sqrt(a), sqrt(1 - a))

            distance_miles = R * c

            # Convert to score (0-1)
            # 0 miles = 1.0, 5 miles = 0.5, 10+ miles = 0.0
            if distance_miles <= 0:
                distance_score = 1.0
            elif distance_miles >= 10:
                distance_score = 0.0
            else:
                # Linear interpolation
                distance_score = 1.0 - (distance_miles / 10.0)

            return {
                "distance_miles": round(distance_miles, 2),
                "distance_score": round(distance_score, 3)
            }
        except Exception as e:
            return {
                "distance_miles": 0.0,
                "distance_score": 0.0,
                "error": str(e)
            }


# Tool 2: Rating Normalizer
class RatingNormalizerTool(BaseModel):
    """Tool to normalize provider ratings"""

    name: str = "rating_normalizer"
    description: str = "Normalize provider rating to 0-1 score with confidence adjustment based on review count"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, float]:
        """Normalize rating with confidence adjustment"""
        try:
            provider_rating = inputs.get("provider_rating", 0.0)
            review_count = inputs.get("review_count", 0)

            # Determine confidence based on review count
            if review_count < 10:
                confidence = 0.7  # Lower confidence
            elif review_count < 50:
                confidence = 0.85  # Medium confidence
            else:
                confidence = 1.0  # High confidence

            # Normalize rating to 0-1 scale
            normalized_rating = provider_rating / 5.0

            # Apply confidence adjustment
            rating_score = normalized_rating * confidence

            return {
                "rating_score": round(rating_score, 3),
                "confidence": round(confidence, 2)
            }
        except Exception as e:
            return {
                "rating_score": 0.0,
                "confidence": 0.0,
                "error": str(e)
            }


# Tool 3: Price Fit Calculator
class PriceFitCalculatorTool(BaseModel):
    """Tool to calculate price fit"""

    name: str = "price_fit_calculator"
    description: str = "Calculate how well service price fits within user budget"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate price fit score"""
        try:
            service_price = inputs.get("service_price", 0.0)
            budget_min = inputs.get("budget_min", 0.0)
            budget_max = inputs.get("budget_max", 999999.0)

            if budget_min > budget_max:
                budget_min, budget_max = budget_max, budget_min

            # Price below minimum (too cheap - quality concern)
            if service_price < budget_min:
                price_fit_score = 0.6
                fit_category = "cheap"
            # Price above maximum (too expensive)
            elif service_price > budget_max:
                price_fit_score = 0.0
                fit_category = "expensive"
            else:
                # Price within budget
                budget_range = budget_max - budget_min
                budget_middle = budget_min + (budget_range / 2)

                # Calculate distance from middle
                distance_from_middle = abs(service_price - budget_middle)
                relative_distance = distance_from_middle / (budget_range / 2) if budget_range > 0 else 0

                # Perfect fit in middle, acceptable at edges
                if relative_distance <= 0.2:  # Within 20% of middle
                    price_fit_score = 1.0
                    fit_category = "perfect"
                elif relative_distance <= 0.8:  # Within 80% of middle
                    price_fit_score = 0.9
                    fit_category = "acceptable"
                else:  # At edges
                    price_fit_score = 0.8
                    fit_category = "acceptable"

            return {
                "price_fit_score": round(price_fit_score, 3),
                "fit_category": fit_category
            }
        except Exception as e:
            return {
                "price_fit_score": 0.0,
                "fit_category": "unknown",
                "error": str(e)
            }


# Tool 4: Match Score Calculator
class MatchScoreCalculatorTool(BaseModel):
    """Tool to calculate overall match score"""

    name: str = "match_score_calculator"
    description: str = "Calculate overall match score using weighted formula"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate weighted match score"""
        try:
            rating_score = inputs.get("rating_score", 0.0)
            distance_score = inputs.get("distance_score", 0.5)
            price_fit_score = inputs.get("price_fit_score", 0.5)
            availability_score = inputs.get("availability_score", 0.5)

            # Weighted formula
            weights = {
                "quality": 0.35,
                "proximity": 0.20,
                "price": 0.25,
                "convenience": 0.20
            }

            quality_component = rating_score * weights["quality"]
            proximity_component = distance_score * weights["proximity"]
            price_component = price_fit_score * weights["price"]
            convenience_component = availability_score * weights["convenience"]

            # Calculate total match score
            match_score = (
                quality_component +
                proximity_component +
                price_component +
                convenience_component
            )

            component_breakdown = {
                "quality_component": round(quality_component, 3),
                "proximity_component": round(proximity_component, 3),
                "price_component": round(price_component, 3),
                "convenience_component": round(convenience_component, 3),
                "weights": weights
            }

            return {
                "match_score": round(match_score, 3),
                "component_breakdown": component_breakdown
            }
        except Exception as e:
            return {
                "match_score": 0.0,
                "component_breakdown": {},
                "error": str(e)
            }


# Tool 5: Recommendation Explainer
class RecommendationExplainerTool(BaseModel):
    """Tool to generate recommendation explanations"""

    name: str = "recommendation_explainer"
    description: str = "Generate human-readable explanation for why a provider is recommended"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, str]:
        """Generate recommendation explanation"""
        try:
            provider = inputs.get("provider", {})
            match_score = inputs.get("match_score", 0.0)
            components = inputs.get("components", {})

            explanation_parts = []

            # Extract provider details
            provider_name = provider.get("provider_name", provider.get("name", "This provider"))
            rating = provider.get("rating", 0)
            distance = provider.get("distance_miles", 0)
            price = provider.get("price", 0)

            # Match score quality
            if match_score >= 0.8:
                explanation_parts.append("Excellent match")
            elif match_score >= 0.6:
                explanation_parts.append("Great match")
            elif match_score >= 0.4:
                explanation_parts.append("Good match")
            else:
                explanation_parts.append("Suitable option")

            # Rating highlight
            if rating >= 4.5:
                explanation_parts.append(f"top-rated ({rating}★)")
            elif rating >= 4.0:
                explanation_parts.append(f"highly-rated ({rating}★)")

            # Distance highlight
            if distance and distance <= 2:
                explanation_parts.append("very close by")
            elif distance and distance <= 5:
                explanation_parts.append("nearby")

            # Price
            if price:
                explanation_parts.append(f"${price}")

            # Component highlights
            breakdown = components.get("component_breakdown", {})
            price_score = breakdown.get("price_component", 0)

            if price_score >= 0.20:
                explanation_parts.append("within budget")

            # Availability
            if provider.get("available", False):
                explanation_parts.append("available now")

            # Construct final explanation
            if explanation_parts:
                explanation = ", ".join(explanation_parts)
            else:
                explanation = "Matches your criteria"

            return {
                "explanation": explanation
            }
        except Exception as e:
            return {
                "explanation": "Matches your criteria",
                "error": str(e)
            }


# Create singleton instances
distance_calculator_tool = DistanceCalculatorTool()
rating_normalizer_tool = RatingNormalizerTool()
price_fit_calculator_tool = PriceFitCalculatorTool()
match_score_calculator_tool = MatchScoreCalculatorTool()
recommendation_explainer_tool = RecommendationExplainerTool()


# Export all tools
__all__ = [
    "DistanceCalculatorTool",
    "RatingNormalizerTool",
    "PriceFitCalculatorTool",
    "MatchScoreCalculatorTool",
    "RecommendationExplainerTool",
    "distance_calculator_tool",
    "rating_normalizer_tool",
    "price_fit_calculator_tool",
    "match_score_calculator_tool",
    "recommendation_explainer_tool"
]
