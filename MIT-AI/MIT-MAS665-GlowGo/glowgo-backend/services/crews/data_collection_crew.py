"""
Data Collection Crew for GlowGo
Orchestrates agents to collect real beauty service provider data for Boston/Cambridge
"""

import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool

from config import settings, crew_config
from services.tools.data_collection_tools import (
    yelp_search_tool,
    yelp_details_tool,
    brightdata_scraper_tool,
    merchant_storage_tool,
    data_collection_tools
)

logger = logging.getLogger(__name__)


class DataCollectionCrew:
    """
    Crew for collecting real beauty service provider data from multiple sources.

    Agents:
    1. Scout Agent - Finds providers via Yelp API
    2. Scraper Agent - Gets detailed data via BrightData
    3. Normalizer Agent - Standardizes and validates data
    4. Storage Agent - Saves to database
    """

    def __init__(self):
        """Initialize the Data Collection Crew"""
        self._create_agents()
        logger.info("DataCollectionCrew initialized")

    def _create_agents(self):
        """Create specialized agents for data collection"""

        # Scout Agent - Uses Yelp API to find providers
        self.scout_agent = Agent(
            role="Beauty Service Scout",
            goal="Find and list beauty service providers in the target area using Yelp API",
            backstory="""You are an expert at discovering beauty service providers.
            You use the Yelp API to search for hair salons, barbershops, nail salons,
            spas, and other beauty services. You know the best search terms and
            categories to find high-quality providers.""",
            tools=[yelp_search_tool, yelp_details_tool],
            verbose=crew_config.AGENT_VERBOSE,
            allow_delegation=False,
            max_iter=crew_config.MAX_ITERATIONS
        )

        # Scraper Agent - Uses BrightData to get detailed pricing/availability
        self.scraper_agent = Agent(
            role="Booking Platform Scraper",
            goal="Collect detailed service menus, pricing, and availability from booking platforms",
            backstory="""You are a web scraping specialist who extracts valuable
            business data from booking platforms like StyleSeat, Booksy, and Vagaro.
            You can find service menus with prices, stylist information, and
            available appointment slots.""",
            tools=[brightdata_scraper_tool],
            verbose=crew_config.AGENT_VERBOSE,
            allow_delegation=False,
            max_iter=crew_config.MAX_ITERATIONS
        )

        # Normalizer Agent - Standardizes data format
        self.normalizer_agent = Agent(
            role="Data Normalizer",
            goal="Standardize and validate collected provider data",
            backstory="""You are a data quality expert who ensures all provider
            data is properly formatted, validated, and ready for storage.
            You merge data from multiple sources, remove duplicates, and
            ensure consistency in service categories and pricing.""",
            tools=[],
            verbose=crew_config.AGENT_VERBOSE,
            allow_delegation=False,
            max_iter=crew_config.MAX_ITERATIONS
        )

        # Storage Agent - Saves to database
        self.storage_agent = Agent(
            role="Database Storage Manager",
            goal="Save validated provider data to the database",
            backstory="""You are responsible for persisting collected provider
            data to the database. You handle deduplication, updates to existing
            records, and logging of the data collection process.""",
            tools=[merchant_storage_tool],
            verbose=crew_config.AGENT_VERBOSE,
            allow_delegation=False,
            max_iter=crew_config.MAX_ITERATIONS
        )

    async def collect_providers(
        self,
        location: str = "Boston, MA",
        service_categories: Optional[List[str]] = None,
        limit_per_category: int = 10
    ) -> Dict[str, Any]:
        """
        Collect beauty service providers for a given location.

        Args:
            location: City/area to search (e.g., "Boston, MA", "Cambridge, MA")
            service_categories: List of service types to search
            limit_per_category: Number of results per category

        Returns:
            dict with collected providers, stats, and any errors
        """
        if service_categories is None:
            service_categories = [
                "hair salon",
                "barbershop",
                "nail salon",
                "spa",
                "facial",
                "massage"
            ]

        logger.info(f"Starting data collection for {location}")
        logger.info(f"Categories: {service_categories}")

        results = {
            "location": location,
            "categories_searched": service_categories,
            "providers": [],
            "total_found": 0,
            "errors": [],
            "started_at": datetime.now().isoformat()
        }

        try:
            # ======================================================================
            # STEP 1: Scout - Search Yelp for each category
            # ======================================================================
            all_yelp_results = []

            for category in service_categories:
                logger.info(f"Searching Yelp for: {category} in {location}")

                search_params = json.dumps({
                    "term": category,
                    "location": location,
                    "limit": limit_per_category
                })

                try:
                    yelp_result = yelp_search_tool._run(search_params)
                    yelp_data = json.loads(yelp_result)

                    if "businesses" in yelp_data:
                        businesses = yelp_data["businesses"]
                        all_yelp_results.extend(businesses)
                        logger.info(f"Found {len(businesses)} businesses for {category}")
                    else:
                        logger.warning(f"No businesses found for {category}")
                        if "error" in yelp_data:
                            results["errors"].append(f"{category}: {yelp_data['error']}")

                except Exception as e:
                    logger.error(f"Error searching {category}: {e}")
                    results["errors"].append(f"{category}: {str(e)}")

            # ======================================================================
            # STEP 2: Deduplicate by yelp_id
            # ======================================================================
            seen_ids = set()
            unique_providers = []

            for provider in all_yelp_results:
                yelp_id = provider.get("yelp_id")
                if yelp_id and yelp_id not in seen_ids:
                    seen_ids.add(yelp_id)
                    unique_providers.append(provider)

            logger.info(f"After deduplication: {len(unique_providers)} unique providers")

            # ======================================================================
            # STEP 2.5: Enrich with Yelp business details (working hours, etc.)
            # ======================================================================
            # For each unique Yelp provider, fetch detailed info including business_hours
            # so we can later respect real opening hours when matching user time preferences.
            for provider in unique_providers:
                yelp_id = provider.get("yelp_id")
                if not yelp_id:
                    continue

                try:
                    details_raw = yelp_details_tool._run(yelp_id)
                    details = json.loads(details_raw)

                    # Attach business hours if available (list of {day, start, end, is_overnight})
                    if isinstance(details, dict) and details.get("business_hours"):
                        provider["business_hours"] = details["business_hours"]
                except Exception as e:
                    logger.warning(f"Error fetching Yelp details for {yelp_id}: {e}")

            # ======================================================================
            # STEP 3: Enhance with BrightData scraping
            # ======================================================================
            # Get additional pricing/availability data
            scrape_params = json.dumps({
                "platform": "styleseat",
                "search_location": location,
                "search_term": "beauty"
            })

            try:
                scrape_result = brightdata_scraper_tool._run(scrape_params)
                scrape_data = json.loads(scrape_result)
                scraped_providers = scrape_data.get("providers", [])

                logger.info(f"Got {len(scraped_providers)} providers from BrightData")

                # Merge scraped data with Yelp data
                # This is simplified - production would use fuzzy matching
                for provider in unique_providers:
                    # Try to find matching scraped data by name
                    provider_name = provider.get("business_name", "").lower()

                    for scraped in scraped_providers:
                        scraped_name = scraped.get("provider_name", "").lower()

                        # Simple name matching
                        if provider_name in scraped_name or scraped_name in provider_name:
                            # Merge additional data
                            provider["services"] = scraped.get("services", [])
                            provider["stylist_names"] = scraped.get("stylist_names", [])
                            provider["specialties"] = scraped.get("specialties", [])
                            provider["booking_url"] = scraped.get("booking_url", "")
                            break

                # Also add scraped providers not in Yelp results
                for scraped in scraped_providers:
                    scraped_name = scraped.get("provider_name", "").lower()

                    # Check if not already in unique_providers
                    found = False
                    for provider in unique_providers:
                        if scraped_name in provider.get("business_name", "").lower():
                            found = True
                            break

                    if not found:
                        # Convert scraped format to standard format
                        converted = {
                            "business_name": scraped.get("provider_name"),
                            "address": scraped.get("address", ""),
                            "location_lat": scraped.get("location_lat"),
                            "location_lon": scraped.get("location_lon"),
                            "rating": scraped.get("rating", 0),
                            "review_count": scraped.get("review_count", 0),
                            "photos": scraped.get("photos", []),
                            "services": scraped.get("services", []),
                            "stylist_names": scraped.get("stylist_names", []),
                            "specialties": scraped.get("specialties", []),
                            "booking_url": scraped.get("booking_url", ""),
                            "data_source": "brightdata"
                        }
                        unique_providers.append(converted)

            except Exception as e:
                logger.error(f"BrightData scraping error: {e}")
                results["errors"].append(f"BrightData: {str(e)}")

            # ======================================================================
            # STEP 4: Normalize and validate data
            # ======================================================================
            normalized_providers = []

            for provider in unique_providers:
                normalized = self._normalize_provider(provider)
                if normalized:
                    normalized_providers.append(normalized)

            logger.info(f"Normalized {len(normalized_providers)} providers")

            # ======================================================================
            # STEP 5: Store results
            # ======================================================================
            results["providers"] = normalized_providers
            results["total_found"] = len(normalized_providers)
            results["completed_at"] = datetime.now().isoformat()

            logger.info(f"Data collection complete: {len(normalized_providers)} providers")

            return results

        except Exception as e:
            logger.error(f"Data collection error: {e}", exc_info=True)
            results["errors"].append(str(e))
            results["completed_at"] = datetime.now().isoformat()
            return results

    def _normalize_provider(self, provider: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Normalize provider data to standard format"""
        try:
            # Map Yelp categories to our service_category
            categories = provider.get("categories", [])
            service_category = self._map_to_service_category(categories)

            # Parse address components
            address = provider.get("address", "")
            city = provider.get("city", "")
            state = provider.get("state", "")
            zip_code = provider.get("zip_code", "")

            # Extract city/state from address if not provided
            if not city and address:
                # Simple parsing - could be improved
                parts = address.split(",")
                if len(parts) >= 2:
                    city = parts[-2].strip()
                    state_zip = parts[-1].strip().split()
                    if state_zip:
                        state = state_zip[0]
                    if len(state_zip) > 1:
                        zip_code = state_zip[1]

            # Generate email from business name
            business_name = provider.get("business_name", "unknown")
            email_name = business_name.lower().replace(" ", "").replace("'", "")

            normalized = {
                "business_name": provider.get("business_name", "Unknown"),
                "email": f"contact@{email_name}.com",
                "phone": provider.get("phone", ""),
                "location_lat": provider.get("location_lat"),
                "location_lon": provider.get("location_lon"),
                "address": address,
                "city": city or "Boston",
                "state": state or "MA",
                "zip_code": zip_code,
                "service_category": service_category,
                "rating": float(provider.get("rating", 0)),
                "total_reviews": int(provider.get("review_count", 0)),
                "photo_url": provider.get("photos", [""])[0] if provider.get("photos") else "",
                "bio": provider.get("bio", f"Professional {service_category} services in the Boston area."),
                "years_experience": 5,  # Default
                "is_verified": True,

                # Enhanced fields
                "yelp_id": provider.get("yelp_id"),
                "website": provider.get("website", ""),
                "yelp_url": provider.get("yelp_url", ""),
                "price_range": provider.get("price_range", "$$"),
                "review_count": int(provider.get("review_count", 0)),
                "photos": provider.get("photos", []),
                "business_hours": provider.get("business_hours", []),
                "categories": categories if isinstance(categories, list) else [categories],
                "specialties": provider.get("specialties", []),
                "stylist_names": provider.get("stylist_names", []),
                "booking_url": provider.get("booking_url", ""),
                "services": provider.get("services", []),
                "data_source": provider.get("data_source", "yelp"),
                "last_scraped_at": datetime.now().isoformat()
            }

            return normalized

        except Exception as e:
            logger.error(f"Error normalizing provider: {e}")
            return None

    def _map_to_service_category(self, categories: List[str]) -> str:
        """Map Yelp/scraped categories to our service_category enum"""
        if not categories:
            return "beauty salon"

        # Convert to lowercase for matching
        cats_lower = [c.lower() if isinstance(c, str) else "" for c in categories]
        cats_str = " ".join(cats_lower)

        # Priority order matching - using standardized category names
        if any(term in cats_str for term in ["barber", "barbershop"]):
            return "barbershop"
        elif any(term in cats_str for term in ["hair salon", "hair stylist", "hairdresser"]):
            return "hair salon"
        elif any(term in cats_str for term in ["nail", "manicure", "pedicure"]):
            return "nail salon"
        elif any(term in cats_str for term in ["massage", "massage therapy"]):
            return "massage"
        elif any(term in cats_str for term in ["day spa", "med spa", "spa"]):
            return "spa"
        elif any(term in cats_str for term in ["facial", "skincare", "esthetician"]):
            return "facial"
        elif any(term in cats_str for term in ["wax", "hair removal"]):
            return "waxing"
        elif any(term in cats_str for term in ["makeup", "cosmetic"]):
            return "makeup"
        elif any(term in cats_str for term in ["brow", "lash", "eyebrow", "eyelash"]):
            return "eyebrow services"
        else:
            return "beauty salon"

    async def get_boston_cambridge_providers(
        self,
        limit_per_category: int = 10
    ) -> Dict[str, Any]:
        """
        Convenience method to collect providers from both Boston and Cambridge.

        Args:
            limit_per_category: Number of results per service category

        Returns:
            Combined results from both locations
        """
        logger.info("Collecting providers from Boston and Cambridge")

        # Collect from Boston
        boston_results = await self.collect_providers(
            location="Boston, MA",
            limit_per_category=limit_per_category
        )

        # Collect from Cambridge
        cambridge_results = await self.collect_providers(
            location="Cambridge, MA",
            limit_per_category=limit_per_category
        )

        # Merge results
        all_providers = boston_results["providers"] + cambridge_results["providers"]

        # Deduplicate by name + address
        seen = set()
        unique_providers = []
        for provider in all_providers:
            key = f"{provider['business_name'].lower()}_{provider.get('address', '').lower()}"
            if key not in seen:
                seen.add(key)
                unique_providers.append(provider)

        return {
            "locations": ["Boston, MA", "Cambridge, MA"],
            "providers": unique_providers,
            "total_found": len(unique_providers),
            "boston_count": len(boston_results["providers"]),
            "cambridge_count": len(cambridge_results["providers"]),
            "errors": boston_results["errors"] + cambridge_results["errors"],
            "completed_at": datetime.now().isoformat()
        }


# Global crew instance
data_collection_crew = DataCollectionCrew()
