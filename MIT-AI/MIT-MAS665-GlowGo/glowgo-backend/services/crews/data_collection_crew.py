"""
Data Collection Crew for GlowGo
Orchestrates agents to collect real beauty service provider data for Boston/Cambridge
"""

import logging
import json
import asyncio
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
from services.tools.google_places_tools import google_places_search_tool

logger = logging.getLogger(__name__)


class DataCollectionCrew:
    """
    Crew for collecting real beauty service provider data from multiple sources.

    Agents:
    1. Scout Agent - Finds providers via Yelp API and Google Places
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

        # Scout Agent - Uses Yelp API and Google Places to find providers
        self.scout_agent = Agent(
            role="Beauty Service Scout",
            goal="Find and list beauty service providers in the target area using Yelp API and Google Places",
            backstory="""You are an expert at discovering beauty service providers.
            You use the Yelp API and Google Places to search for hair salons, barbershops, nail salons,
            spas, and other beauty services. You know the best search terms and
            categories to find high-quality providers.""",
            tools=[yelp_search_tool, yelp_details_tool, google_places_search_tool],
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
            # STEP 1: Scout - Search Yelp AND Google for each category
            # ======================================================================
            all_raw_results = []

            async def fetch_category_yelp(category):
                search_params = json.dumps({
                    "term": category,
                    "location": location,
                    "limit": limit_per_category
                })
                try:
                    # Run synchronous tool in thread
                    res = await asyncio.to_thread(yelp_search_tool._run, search_params)
                    data = json.loads(res)
                    if "businesses" in data:
                        businesses = data["businesses"]
                        logger.info(f"Yelp: Found {len(businesses)} for {category}")
                        return businesses
                    else:
                        if "error" in data:
                            results["errors"].append(f"Yelp {category}: {data['error']}")
                        return []
                except Exception as e:
                    logger.error(f"Yelp error {category}: {e}")
                    results["errors"].append(f"Yelp {category}: {str(e)}")
                    return []

            async def fetch_category_google(category):
                search_params = json.dumps({
                    "textQuery": f"{category} in {location}",
                    "limit": limit_per_category
                })
                try:
                    # Run synchronous tool in thread
                    res = await asyncio.to_thread(google_places_search_tool._run, search_params)
                    data = json.loads(res)
                    if "places" in data:
                        places = data["places"]
                        logger.info(f"Google: Found {len(places)} for {category}")
                        return places
                    else:
                        if "error" in data:
                            results["errors"].append(f"Google {category}: {data['error']}")
                        return []
                except Exception as e:
                    logger.error(f"Google error {category}: {e}")
                    results["errors"].append(f"Google {category}: {str(e)}")
                    return []
            
            # Create tasks for all categories and both sources
            tasks = []
            for category in service_categories:
                tasks.append(fetch_category_yelp(category))
                tasks.append(fetch_category_google(category))
            
            # Execute all searches concurrently
            logger.info(f"Launching {len(tasks)} search tasks concurrently...")
            search_results_list = await asyncio.gather(*tasks)
            
            # Flatten results
            for res in search_results_list:
                all_raw_results.extend(res)

            # ======================================================================
            # STEP 2: Deduplicate
            # ======================================================================
            seen_ids = set() # Track yelp_id and google_id
            seen_names = set() # Track simplified name+address for cross-source dedupe
            unique_providers = []

            for provider in all_raw_results:
                # Check ID uniqueness
                is_duplicate = False
                
                # ID based check
                yelp_id = provider.get("yelp_id")
                google_id = provider.get("google_id")
                
                if yelp_id and f"yelp:{yelp_id}" in seen_ids:
                    is_duplicate = True
                if google_id and f"google:{google_id}" in seen_ids:
                    is_duplicate = True
                    
                # Name+Address fuzzy check (simple normalization)
                if not is_duplicate:
                    name = provider.get("business_name", "").lower()
                    addr = provider.get("address", "").split(",")[0].lower() # Just first part of address
                    name_key = f"{name}|{addr}"
                    
                    if name_key in seen_names:
                        # If we have a duplicate from different source, we might want to merge.
                        # For now, we skip to keep it simple or prefer the first one found (usually Yelp as it was first in list logic if we processed sequentially, but here it's mixed).
                        # Let's prefer Yelp data if we have to choose, but actually we just want to avoid duplicate entries in output.
                        # We'll check if the existing one needs enrichment? 
                        # For simplicity: skip if duplicate name+addr found.
                        is_duplicate = True
                    else:
                        seen_names.add(name_key)

                if not is_duplicate:
                    if yelp_id: seen_ids.add(f"yelp:{yelp_id}")
                    if google_id: seen_ids.add(f"google:{google_id}")
                    unique_providers.append(provider)

            logger.info(f"After deduplication: {len(unique_providers)} unique providers")

            # ======================================================================
            # STEP 2.5: Enrich with Yelp business details (only for Yelp providers)
            # ======================================================================
            # Google providers already have hours from the search tool
            for provider in unique_providers:
                yelp_id = provider.get("yelp_id")
                if yelp_id and not provider.get("business_hours"):
                    try:
                        details_raw = await asyncio.to_thread(yelp_details_tool._run, yelp_id)
                        details = json.loads(details_raw)

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
                scrape_result = await asyncio.to_thread(brightdata_scraper_tool._run, scrape_params)
                scrape_data = json.loads(scrape_result)
                scraped_providers = scrape_data.get("providers", [])

                logger.info(f"Got {len(scraped_providers)} providers from BrightData")

                # Merge scraped data
                for provider in unique_providers:
                    provider_name = provider.get("business_name", "").lower()
                    for scraped in scraped_providers:
                        scraped_name = scraped.get("provider_name", "").lower()
                        if provider_name in scraped_name or scraped_name in provider_name:
                            provider["services"] = scraped.get("services", [])
                            provider["stylist_names"] = scraped.get("stylist_names", [])
                            provider["specialties"] = scraped.get("specialties", [])
                            provider["booking_url"] = scraped.get("booking_url", "")
                            break
                
                # Add scraped providers not in results (simplified, similar logic to before)
                for scraped in scraped_providers:
                    scraped_name = scraped.get("provider_name", "").lower()
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
            # Map categories (handle Yelp list or Google types list or single string)
            categories = provider.get("categories", [])
            if not categories:
                categories = provider.get("types", []) # Google types
            
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
                    # Try to find state/zip
                    last_part = parts[-1].strip()
                    # Check if last part contains numbers (zip)
                    if any(char.isdigit() for char in last_part):
                         # likely "State Zip" or "Zip" or "Country"
                         # Google format: "Street, City, State Zip, Country"
                         if len(parts) >= 3:
                             city = parts[-3].strip() # Assuming country is last or standard format
                             state_zip = parts[-2].strip().split()
                             if state_zip:
                                 state = state_zip[0]
                             if len(state_zip) > 1:
                                 zip_code = state_zip[1]
                    else:
                        # maybe "City, State"
                        city = parts[-2].strip()
                        state_zip = last_part.split()
                        if state_zip:
                             state = state_zip[0]

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
                "google_id": provider.get("google_id"),
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
