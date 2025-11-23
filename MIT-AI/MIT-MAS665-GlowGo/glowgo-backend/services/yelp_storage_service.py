"""
Yelp Storage Service for GlowGo
Saves Yelp providers to database with estimated prices
"""

import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session

from models.database import SessionLocal
from utils.price_estimation import (
    estimate_price_from_range,
    generate_services_for_merchant,
    map_yelp_category_to_service
)

logger = logging.getLogger(__name__)


class YelpStorageService:
    """
    Service for storing Yelp provider data to the database.

    Handles:
    - Upserting merchants with Yelp data
    - Generating estimated services with prices
    - Deduplication by yelp_id
    """

    async def store_providers(self, providers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Store a list of providers to the database.

        Args:
            providers: List of normalized provider dictionaries from data collection

        Returns:
            Summary of storage operation
        """
        results = {
            "total_processed": len(providers),
            "inserted": 0,
            "updated": 0,
            "services_created": 0,
            "errors": [],
            "stored_at": datetime.now().isoformat()
        }

        db = SessionLocal()

        try:
            for provider in providers:
                try:
                    merchant_id, was_inserted = await self._upsert_merchant(db, provider)

                    if was_inserted:
                        results["inserted"] += 1
                    else:
                        results["updated"] += 1

                    # Generate and store services with estimated prices
                    if merchant_id:
                        services_count = await self._create_services(db, merchant_id, provider)
                        results["services_created"] += services_count

                except Exception as e:
                    error_msg = f"Error storing {provider.get('business_name', 'unknown')}: {str(e)}"
                    logger.error(error_msg)
                    results["errors"].append(error_msg)

            db.commit()
            logger.info(f"Storage complete: {results['inserted']} inserted, {results['updated']} updated")

        except Exception as e:
            db.rollback()
            logger.error(f"Storage transaction error: {e}")
            results["errors"].append(str(e))
        finally:
            db.close()

        return results

    async def _upsert_merchant(self, db: Session, provider: Dict[str, Any]) -> tuple:
        """
        Insert or update a merchant record.

        Returns:
            Tuple of (merchant_id, was_inserted)
        """
        yelp_id = provider.get("yelp_id")
        business_name = provider.get("business_name", "Unknown")

        # Check if merchant exists by yelp_id
        if yelp_id:
            existing = db.execute(
                text("SELECT id FROM merchants WHERE yelp_id = :yelp_id"),
                {"yelp_id": yelp_id}
            ).fetchone()
        else:
            # Fallback to name + address matching
            existing = db.execute(
                text("""
                    SELECT id FROM merchants
                    WHERE LOWER(business_name) = LOWER(:name)
                    AND LOWER(address) = LOWER(:address)
                """),
                {
                    "name": business_name,
                    "address": provider.get("address", "")
                }
            ).fetchone()

        # Map Yelp categories to our service_category
        categories = provider.get("categories", [])
        service_category = map_yelp_category_to_service(
            [{"alias": c} if isinstance(c, str) else c for c in categories]
        )

        # Prepare merchant data
        merchant_data = {
            "business_name": business_name,
            "email": provider.get("email", f"contact@{business_name.lower().replace(' ', '')}.com"),
            "phone": provider.get("phone", ""),
            "location_lat": provider.get("location_lat"),
            "location_lon": provider.get("location_lon"),
            "address": provider.get("address", ""),
            "city": provider.get("city", "Boston"),
            "state": provider.get("state", "MA"),
            "zip_code": provider.get("zip_code", ""),
            "service_category": service_category,
            "rating": float(provider.get("rating", 0)),
            "total_reviews": int(provider.get("review_count", provider.get("total_reviews", 0))),
            "photo_url": provider.get("photo_url") or (provider.get("photos", [""])[0] if provider.get("photos") else ""),
            "bio": provider.get("bio", f"Professional {service_category} services."),
            "years_experience": provider.get("years_experience", 5),
            "is_verified": provider.get("is_verified", True),
            # Yelp-specific fields
            "yelp_id": yelp_id,
            "price_range": provider.get("price_range", "$$"),
            "photos": json.dumps(provider.get("photos", [])),
            "specialties": json.dumps(provider.get("specialties", [])),
            "stylist_names": json.dumps(provider.get("stylist_names", [])),
            "booking_url": provider.get("booking_url", ""),
            "yelp_url": provider.get("yelp_url", ""),
            "business_hours": json.dumps(provider.get("business_hours", [])),
            "website": provider.get("website", ""),
            "yelp_categories": json.dumps(categories),
            "data_source": provider.get("data_source", "yelp"),
            "last_synced_at": datetime.now()
        }

        if existing:
            # Update existing merchant
            merchant_id = existing[0]

            update_query = text("""
                UPDATE merchants SET
                    phone = :phone,
                    location_lat = :location_lat,
                    location_lon = :location_lon,
                    address = :address,
                    city = :city,
                    state = :state,
                    zip_code = :zip_code,
                    rating = :rating,
                    total_reviews = :total_reviews,
                    photo_url = :photo_url,
                    price_range = :price_range,
                    photos = :photos::jsonb,
                    specialties = :specialties::jsonb,
                    stylist_names = :stylist_names::jsonb,
                    booking_url = :booking_url,
                    yelp_url = :yelp_url,
                    business_hours = :business_hours::jsonb,
                    website = :website,
                    yelp_categories = :yelp_categories::jsonb,
                    last_synced_at = :last_synced_at,
                    updated_at = NOW()
                WHERE id = :id
            """)

            db.execute(update_query, {**merchant_data, "id": merchant_id})
            logger.debug(f"Updated merchant: {business_name} (ID: {merchant_id})")

            return merchant_id, False
        else:
            # Insert new merchant
            insert_query = text("""
                INSERT INTO merchants (
                    business_name, email, phone, location_lat, location_lon,
                    address, city, state, zip_code, service_category,
                    rating, total_reviews, photo_url, bio, years_experience, is_verified,
                    yelp_id, price_range, photos, specialties, stylist_names,
                    booking_url, yelp_url, business_hours, website, yelp_categories,
                    data_source, last_synced_at
                ) VALUES (
                    :business_name, :email, :phone, :location_lat, :location_lon,
                    :address, :city, :state, :zip_code, :service_category,
                    :rating, :total_reviews, :photo_url, :bio, :years_experience, :is_verified,
                    :yelp_id, :price_range, :photos::jsonb, :specialties::jsonb, :stylist_names::jsonb,
                    :booking_url, :yelp_url, :business_hours::jsonb, :website, :yelp_categories::jsonb,
                    :data_source, :last_synced_at
                )
                RETURNING id
            """)

            result = db.execute(insert_query, merchant_data)
            merchant_id = result.fetchone()[0]

            logger.debug(f"Inserted merchant: {business_name} (ID: {merchant_id})")

            return merchant_id, True

    async def _create_services(
        self,
        db: Session,
        merchant_id: str,
        provider: Dict[str, Any]
    ) -> int:
        """
        Create service entries for a merchant.

        If provider has actual services from BrightData, use those.
        Otherwise, generate estimated services from price_range.

        Returns:
            Number of services created
        """
        # First, delete existing estimated services for this merchant
        # Keep manually entered or actual services
        db.execute(
            text("""
                DELETE FROM services
                WHERE merchant_id = :merchant_id
                AND (is_estimated_price = true OR data_source = 'yelp_estimated')
            """),
            {"merchant_id": merchant_id}
        )

        services_created = 0
        provider_services = provider.get("services", [])

        if provider_services:
            # Use actual services from BrightData scraping
            for service in provider_services:
                service_data = {
                    "merchant_id": merchant_id,
                    "service_name": service.get("name", "Service"),
                    "description": f"{service.get('name', 'Service')} at {provider.get('business_name', '')}",
                    "base_price": float(service.get("price", 50)),
                    "duration_minutes": int(service.get("duration", 60)),
                    "is_estimated_price": False,
                    "data_source": "brightdata"
                }

                db.execute(
                    text("""
                        INSERT INTO services (
                            merchant_id, service_name, description,
                            base_price, duration_minutes, is_estimated_price, data_source
                        ) VALUES (
                            :merchant_id, :service_name, :description,
                            :base_price, :duration_minutes, :is_estimated_price, :data_source
                        )
                    """),
                    service_data
                )
                services_created += 1
        else:
            # Generate estimated services from price_range
            price_range = provider.get("price_range", "$$")
            service_category = map_yelp_category_to_service(
                [{"alias": c} if isinstance(c, str) else c
                 for c in provider.get("categories", [])]
            )

            estimated_services = generate_services_for_merchant(
                price_range,
                service_category,
                provider.get("business_name", "")
            )

            for service in estimated_services:
                service_data = {
                    "merchant_id": merchant_id,
                    "service_name": service["service_name"],
                    "description": service["description"],
                    "base_price": service["base_price"],
                    "duration_minutes": service["duration_minutes"],
                    "is_estimated_price": True,
                    "data_source": "yelp_estimated"
                }

                db.execute(
                    text("""
                        INSERT INTO services (
                            merchant_id, service_name, description,
                            base_price, duration_minutes, is_estimated_price, data_source
                        ) VALUES (
                            :merchant_id, :service_name, :description,
                            :base_price, :duration_minutes, :is_estimated_price, :data_source
                        )
                    """),
                    service_data
                )
                services_created += 1

        return services_created

    async def get_provider_count(self) -> Dict[str, int]:
        """Get count of providers by data source"""
        db = SessionLocal()

        try:
            result = db.execute(
                text("""
                    SELECT
                        data_source,
                        COUNT(*) as count
                    FROM merchants
                    GROUP BY data_source
                """)
            ).fetchall()

            counts = {row[0] or "manual": row[1] for row in result}
            counts["total"] = sum(counts.values())

            return counts
        finally:
            db.close()

    async def get_service_count(self) -> Dict[str, int]:
        """Get count of services by type"""
        db = SessionLocal()

        try:
            result = db.execute(
                text("""
                    SELECT
                        CASE
                            WHEN is_estimated_price THEN 'estimated'
                            ELSE 'actual'
                        END as price_type,
                        COUNT(*) as count
                    FROM services
                    GROUP BY is_estimated_price
                """)
            ).fetchall()

            counts = {row[0]: row[1] for row in result}
            counts["total"] = sum(counts.values())

            return counts
        finally:
            db.close()


# Global service instance
yelp_storage_service = YelpStorageService()
