"""
Matches router for finding and ranking service providers using MatchingCrew
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import logging

from schemas.matches import (
    FindMatchesRequest,
    FindMatchesResponse,
    MerchantOption,
    ErrorResponse
)
from models.user import User
from utils.auth import get_current_user
from services.crews.matching_crew import matching_crew

router = APIRouter(tags=["matches"])

# Configure logging
logger = logging.getLogger(__name__)

# Use the MatchingCrew (orchestrates MatchingAgent + AvailabilityAgent + RankingAgent)
crew = matching_crew


@router.post(
    "/find",
    response_model=FindMatchesResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request - invalid preferences"},
        401: {"description": "Unauthorized - invalid or missing token"},
        500: {"model": ErrorResponse, "description": "Server error"}
    }
)
async def find_matching_merchants(
    request: FindMatchesRequest,
    current_user: User = Depends(get_current_user)
) -> FindMatchesResponse:
    """
    Find and rank matching merchants for user preferences using MatchingCrew

    This endpoint uses MatchingCrew which orchestrates:
    1. MatchingAgent - Finds providers matching service type, budget, and location
    2. AvailabilityAgent - Checks available time slots for each provider
    3. RankingAgent - Ranks providers by relevance score

    Scoring weights:
    - Quality (rating): 40%
    - Price fit: 30%
    - Availability: 20%
    - Distance: 10%

    Args:
        request: FindMatchesRequest with user preferences
        current_user: Authenticated user (from JWT token)

    Returns:
        FindMatchesResponse with ranked merchant options

    Raises:
        HTTPException: If validation fails or crew execution errors
    """
    try:
        # Step 1: Validate required fields
        if not request.preferences.service_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="service_type is required"
            )

        # Step 2: Build preferences dict for crew
        preferences_dict: Dict[str, Any] = {
            "service_type": request.preferences.service_type,
            "budget_min": request.preferences.budget_min,
            "budget_max": request.preferences.budget_max,
            "time_urgency": request.preferences.time_urgency or "flexible",
            "artisan_preference": request.preferences.artisan_preference,
            "special_notes": request.preferences.special_notes
        }

        # Use location from request or preferences
        location = request.location or request.preferences.location or "Cambridge, MA"

        logger.info(
            f"Finding matches for user {current_user.id}: "
            f"service={request.preferences.service_type}, "
            f"budget={request.preferences.budget_max}, "
            f"location={location}"
        )

        # Step 3: Execute MatchingCrew
        crew_result = await crew.run(
            preferences=preferences_dict,
            location=location
        )

        # Step 4: Extract results
        ranked_options_raw = crew_result.get("ranked_options", [])
        total_found = crew_result.get("total_options_found", 0)
        search_summary = crew_result.get("search_summary", "No results found")

        logger.info(f"MatchingCrew found {total_found} options for user {current_user.id}")

        # Step 5: Convert to Pydantic models
        ranked_options = []
        for option in ranked_options_raw:
            try:
                merchant_option = MerchantOption(
                    rank=option.get("rank", 0),
                    merchant_id=option.get("merchant_id"),
                    merchant_name=option.get("merchant_name", "Unknown"),
                    service_name=option.get("service_name"),
                    service_type=option.get("service_type"),
                    distance=option.get("distance"),
                    price=float(option.get("price", 0)),
                    rating=float(option.get("rating", 0)),
                    reviews=int(option.get("reviews", 0)),
                    available_times=option.get("available_times", []),
                    why_recommended=option.get("why_recommended", "Good match"),
                    relevance_score=float(option.get("relevance_score", 0))
                )
                ranked_options.append(merchant_option)
            except (ValueError, TypeError) as e:
                logger.warning(f"Skipping invalid merchant option: {e}")
                continue

        # Step 6: Build response
        return FindMatchesResponse(
            success=True,
            ranked_options=ranked_options,
            total_options_found=total_found,
            search_summary=search_summary
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Log error
        logger.error(f"Error in find_matching_merchants: {str(e)}", exc_info=True)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find matches: {str(e)}"
        )


@router.post(
    "/find-public",
    response_model=FindMatchesResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request - invalid preferences"},
        500: {"model": ErrorResponse, "description": "Server error"}
    }
)
async def find_matching_merchants_public(
    request: FindMatchesRequest
) -> FindMatchesResponse:
    """
    Public endpoint for finding matches (no authentication required)

    This is useful for:
    - Testing the matching system
    - Allowing users to browse without login
    - Demo purposes

    Note: This endpoint has the same functionality as /find but doesn't require authentication.

    Args:
        request: FindMatchesRequest with user preferences

    Returns:
        FindMatchesResponse with ranked merchant options

    Raises:
        HTTPException: If validation fails or crew execution errors
    """
    try:
        # Step 1: Validate required fields
        if not request.preferences.service_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="service_type is required"
            )

        # Step 2: Build preferences dict for crew
        preferences_dict: Dict[str, Any] = {
            "service_type": request.preferences.service_type,
            "budget_min": request.preferences.budget_min,
            "budget_max": request.preferences.budget_max,
            "time_urgency": request.preferences.time_urgency or "flexible",
            "artisan_preference": request.preferences.artisan_preference,
            "special_notes": request.preferences.special_notes
        }

        # Use location from request or preferences
        location = request.location or request.preferences.location or "Cambridge, MA"

        logger.info(
            f"Public match request: "
            f"service={request.preferences.service_type}, "
            f"budget={request.preferences.budget_max}, "
            f"location={location}"
        )

        # Step 3: Execute MatchingCrew
        crew_result = await crew.run(
            preferences=preferences_dict,
            location=location
        )

        # Step 4: Extract results
        ranked_options_raw = crew_result.get("ranked_options", [])
        total_found = crew_result.get("total_options_found", 0)
        search_summary = crew_result.get("search_summary", "No results found")

        logger.info(f"Public MatchingCrew found {total_found} options")

        # Step 5: Convert to Pydantic models
        ranked_options = []
        for option in ranked_options_raw:
            try:
                merchant_option = MerchantOption(
                    rank=option.get("rank", 0),
                    merchant_id=option.get("merchant_id"),
                    merchant_name=option.get("merchant_name", "Unknown"),
                    service_name=option.get("service_name"),
                    service_type=option.get("service_type"),
                    distance=option.get("distance"),
                    price=float(option.get("price", 0)),
                    rating=float(option.get("rating", 0)),
                    reviews=int(option.get("reviews", 0)),
                    available_times=option.get("available_times", []),
                    why_recommended=option.get("why_recommended", "Good match"),
                    relevance_score=float(option.get("relevance_score", 0))
                )
                ranked_options.append(merchant_option)
            except (ValueError, TypeError) as e:
                logger.warning(f"Skipping invalid merchant option: {e}")
                continue

        # Step 6: Build response
        return FindMatchesResponse(
            success=True,
            ranked_options=ranked_options,
            total_options_found=total_found,
            search_summary=search_summary
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        # Log error
        logger.error(f"Error in find_matching_merchants_public: {str(e)}", exc_info=True)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find matches: {str(e)}"
        )
