"""
Data Collection Router for GlowGo
API endpoints for triggering data collection and managing provider data
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional
import logging
import json
from datetime import datetime

from services.crews.data_collection_crew import data_collection_crew
from services.yelp_storage_service import yelp_storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/data-collection", tags=["Data Collection"])


# ============================================================================
# Request/Response Models
# ============================================================================

class CollectionRequest(BaseModel):
    """Request model for data collection"""
    locations: List[str] = Field(
        default=["Boston, MA", "Cambridge, MA"],
        description="List of locations to collect data from"
    )
    service_categories: Optional[List[str]] = Field(
        default=None,
        description="Service categories to search (defaults to all)"
    )
    limit_per_category: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Number of results per category per location"
    )


class CollectionResponse(BaseModel):
    """Response model for data collection"""
    status: str
    job_id: str
    message: str
    locations: List[str]
    categories: List[str]


class CollectionResult(BaseModel):
    """Result model for completed collection"""
    status: str
    total_providers: int
    providers: List[dict]
    errors: List[str]
    completed_at: str


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/collect", response_model=CollectionResponse)
async def start_collection(
    request: CollectionRequest,
    background_tasks: BackgroundTasks
):
    """
    Start data collection for beauty service providers.

    This endpoint initiates a background job to collect provider data
    from Yelp API and BrightData scraping.
    """
    try:
        job_id = f"collect_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Default categories if not provided
        categories = request.service_categories or [
            "hair salon",
            "barbershop",
            "nail salon",
            "spa",
            "facial",
            "massage"
        ]

        logger.info(f"Starting collection job {job_id}")
        logger.info(f"Locations: {request.locations}")
        logger.info(f"Categories: {categories}")

        # For now, run synchronously for immediate results
        # In production, this would be a background task

        return CollectionResponse(
            status="initiated",
            job_id=job_id,
            message=f"Data collection started for {len(request.locations)} location(s)",
            locations=request.locations,
            categories=categories
        )

    except Exception as e:
        logger.error(f"Collection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collect/boston-cambridge", response_model=CollectionResult)
async def collect_boston_cambridge(
    limit_per_category: int = 10,
    save_to_db: bool = False
):
    """
    Collect providers from Boston and Cambridge areas.

    This is a convenience endpoint that collects data from both
    Boston, MA and Cambridge, MA for all beauty service categories.

    Args:
        limit_per_category: Number of results per category (default 10)
        save_to_db: If True, save collected providers to database with estimated prices

    Returns the collected provider data immediately (synchronous).
    """
    try:
        logger.info(f"Starting Boston/Cambridge collection (limit: {limit_per_category}, save: {save_to_db})")

        # Run collection
        results = await data_collection_crew.get_boston_cambridge_providers(
            limit_per_category=limit_per_category
        )

        # Optionally save to database
        if save_to_db and results["providers"]:
            logger.info(f"Saving {len(results['providers'])} providers to database...")
            storage_result = await yelp_storage_service.store_providers(results["providers"])
            logger.info(f"Storage complete: {storage_result['inserted']} inserted, {storage_result['updated']} updated")

            # Add storage info to errors if any
            if storage_result["errors"]:
                results["errors"].extend(storage_result["errors"])

        return CollectionResult(
            status="completed",
            total_providers=results["total_found"],
            providers=results["providers"],
            errors=results["errors"],
            completed_at=results["completed_at"]
        )

    except Exception as e:
        logger.error(f"Boston/Cambridge collection error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class StorageRequest(BaseModel):
    """Request model for storing providers"""
    providers: List[dict] = Field(
        description="List of provider data to store"
    )


class StorageResponse(BaseModel):
    """Response model for storage operation"""
    status: str
    total_processed: int
    inserted: int
    updated: int
    services_created: int
    errors: List[str]


@router.post("/store", response_model=StorageResponse)
async def store_providers(request: StorageRequest):
    """
    Store collected provider data to the database.

    This endpoint takes provider data (e.g., from a previous collection)
    and saves it to the database with estimated service prices.
    """
    try:
        logger.info(f"Storing {len(request.providers)} providers to database")

        result = await yelp_storage_service.store_providers(request.providers)

        return StorageResponse(
            status="completed",
            total_processed=result["total_processed"],
            inserted=result["inserted"],
            updated=result["updated"],
            services_created=result["services_created"],
            errors=result["errors"]
        )

    except Exception as e:
        logger.error(f"Storage error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_collection_stats():
    """
    Get statistics about collected provider data in the database.
    """
    try:
        provider_counts = await yelp_storage_service.get_provider_count()
        service_counts = await yelp_storage_service.get_service_count()

        return {
            "providers": provider_counts,
            "services": service_counts,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers/sample")
async def get_sample_providers():
    """
    Get sample Boston/Cambridge providers without API calls.

    Returns mock data that represents realistic local beauty service
    providers. Useful for testing and demo purposes.
    """
    try:
        from services.tools.data_collection_tools import brightdata_scraper_tool

        # Get mock data
        mock_result = brightdata_scraper_tool._get_mock_data(
            "styleseat",
            "Boston, MA",
            "beauty"
        )

        mock_data = json.loads(mock_result)
        providers = mock_data.get("providers", [])

        # Transform to standard format
        normalized_providers = []
        for provider in providers:
            normalized = {
                "business_name": provider.get("provider_name"),
                "address": provider.get("address", ""),
                "city": "Boston",
                "state": "MA",
                "location_lat": provider.get("location_lat"),
                "location_lon": provider.get("location_lon"),
                "rating": provider.get("rating", 0),
                "review_count": provider.get("review_count", 0),
                "photos": provider.get("photos", []),
                "services": provider.get("services", []),
                "stylist_names": provider.get("stylist_names", []),
                "specialties": provider.get("specialties", []),
                "booking_url": provider.get("booking_url", "")
            }
            normalized_providers.append(normalized)

        return {
            "status": "success",
            "total": len(normalized_providers),
            "providers": normalized_providers,
            "source": "mock_data"
        }

    except Exception as e:
        logger.error(f"Sample providers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Check data collection service health"""
    from config import settings

    return {
        "status": "healthy",
        "yelp_api_configured": bool(settings.YELP_API_KEY),
        "brightdata_configured": bool(settings.BRIGHTDATA_API_KEY),
        "timestamp": datetime.now().isoformat()
    }
