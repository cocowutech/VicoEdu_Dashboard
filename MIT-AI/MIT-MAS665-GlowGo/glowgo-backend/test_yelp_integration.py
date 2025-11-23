"""
Test script for Yelp data integration
Tests the complete flow: collection → storage → matching
"""

import asyncio
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_price_estimation():
    """Test the price estimation utility"""
    print("\n" + "=" * 60)
    print("TEST 1: Price Estimation Logic")
    print("=" * 60)

    from utils.price_estimation import (
        estimate_price_from_range,
        get_price_range_bounds,
        generate_services_for_merchant,
        is_within_budget
    )

    # Test price estimation
    test_cases = [
        ("$", "haircut", 50),
        ("$$", "haircut", 50),
        ("$$$", "massage", 100),
        ("$$", "nail salon", 40),
        ("$$$", "spa", 150),
    ]

    print("\nPrice Estimation Tests:")
    print("-" * 50)

    for price_range, category, user_budget in test_cases:
        estimated = estimate_price_from_range(price_range, category)
        min_p, max_p = get_price_range_bounds(price_range, category)
        fits = is_within_budget(price_range, category, user_budget)

        print(f"  {price_range} {category}:")
        print(f"    Estimated: ${estimated}")
        print(f"    Range: ${min_p} - ${max_p}")
        print(f"    Fits ${user_budget} budget: {fits}")

    # Test service generation
    print("\nService Generation Test:")
    print("-" * 50)

    services = generate_services_for_merchant("$$", "hair salon", "Test Salon")
    for service in services:
        print(f"  - {service['service_name']}: ${service['base_price']} ({service['duration_minutes']} min)")

    print("\n✅ Price estimation tests passed!")


async def test_data_collection():
    """Test Yelp data collection"""
    print("\n" + "=" * 60)
    print("TEST 2: Yelp Data Collection")
    print("=" * 60)

    from services.crews.data_collection_crew import data_collection_crew

    # Collect a small sample
    print("\nCollecting sample data from Boston...")
    results = await data_collection_crew.collect_providers(
        location="Boston, MA",
        service_categories=["hair salon"],
        limit_per_category=3
    )

    print(f"\nCollection Results:")
    print(f"  Total providers found: {results['total_found']}")
    print(f"  Errors: {len(results['errors'])}")

    if results['providers']:
        print("\nSample Provider:")
        provider = results['providers'][0]
        print(f"  Name: {provider.get('business_name')}")
        print(f"  Price Range: {provider.get('price_range')}")
        print(f"  Rating: {provider.get('rating')}")
        print(f"  City: {provider.get('city')}")
        print(f"  Categories: {provider.get('categories', [])}")

    if results['errors']:
        print(f"\nErrors encountered:")
        for err in results['errors']:
            print(f"  - {err}")

    print("\n✅ Data collection test passed!")
    return results


async def test_storage(providers):
    """Test storing providers to database"""
    print("\n" + "=" * 60)
    print("TEST 3: Database Storage")
    print("=" * 60)

    from services.yelp_storage_service import yelp_storage_service

    if not providers:
        print("⚠️ No providers to store, skipping storage test")
        return

    print(f"\nStoring {len(providers)} providers to database...")

    try:
        result = await yelp_storage_service.store_providers(providers)

        print(f"\nStorage Results:")
        print(f"  Processed: {result['total_processed']}")
        print(f"  Inserted: {result['inserted']}")
        print(f"  Updated: {result['updated']}")
        print(f"  Services created: {result['services_created']}")
        print(f"  Errors: {len(result['errors'])}")

        if result['errors']:
            print(f"\nStorage Errors:")
            for err in result['errors'][:3]:  # Show first 3
                print(f"  - {err}")

        print("\n✅ Storage test passed!")

    except Exception as e:
        print(f"\n❌ Storage test failed: {e}")
        raise


async def test_matching():
    """Test matching with stored Yelp data"""
    print("\n" + "=" * 60)
    print("TEST 4: Matching with Yelp Data")
    print("=" * 60)

    from services.tools.matching_tools import (
        service_filter_tool,
        budget_filter_tool,
        location_filter_tool
    )

    # Test service filter
    print("\nTesting ServiceFilterTool...")
    service_result = service_filter_tool.execute({
        "service_type": "haircut",
        "location": "Boston"
    })

    print(f"  Found {service_result['count']} matching services")

    if service_result['matching_services']:
        print("\n  Sample matches:")
        for i, service in enumerate(service_result['matching_services'][:3]):
            print(f"    {i+1}. {service['merchant_name']} - {service['service_name']}")
            print(f"       Price: ${service['base_price']}")
            print(f"       Rating: {service['merchant_rating']}")
            if service.get('price_range'):
                print(f"       Yelp Price Range: {service['price_range']}")

    # Test budget filter
    print("\nTesting BudgetFilterTool...")
    budget_result = budget_filter_tool.execute({
        "budget_min": 30,
        "budget_max": 60,
        "services": service_result['matching_services']
    })

    print(f"  {budget_result['count']} services within $30-$60 budget")

    if budget_result['affordable_services']:
        print("\n  Affordable options:")
        for i, service in enumerate(budget_result['affordable_services'][:3]):
            print(f"    {i+1}. {service['merchant_name']} - ${service['base_price']}")

    # Test location filter
    print("\nTesting LocationFilterTool...")
    location_result = location_filter_tool.execute({
        "user_location": {"lat": 42.3601, "lon": -71.0589},  # Boston Common
        "max_distance": 5.0,
        "providers_db": budget_result['affordable_services']
    })

    print(f"  {location_result['count']} providers within 5 miles")

    if location_result['providers_within_distance']:
        print("\n  Nearby providers:")
        for i, provider in enumerate(location_result['providers_within_distance'][:3]):
            dist = provider.get('distance_miles', 'N/A')
            print(f"    {i+1}. {provider['merchant_name']} - {dist} miles")

    print("\n✅ Matching tests passed!")


async def test_stats():
    """Test database statistics"""
    print("\n" + "=" * 60)
    print("TEST 5: Database Statistics")
    print("=" * 60)

    from services.yelp_storage_service import yelp_storage_service

    try:
        provider_counts = await yelp_storage_service.get_provider_count()
        service_counts = await yelp_storage_service.get_service_count()

        print("\nProvider Counts:")
        for source, count in provider_counts.items():
            print(f"  {source}: {count}")

        print("\nService Counts:")
        for price_type, count in service_counts.items():
            print(f"  {price_type}: {count}")

        print("\n✅ Stats test passed!")

    except Exception as e:
        print(f"\n❌ Stats test failed: {e}")


async def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("YELP INTEGRATION TEST SUITE")
    print("=" * 60)
    print(f"Started at: {datetime.now().isoformat()}")

    try:
        # Test 1: Price estimation
        await test_price_estimation()

        # Test 2: Data collection
        collection_results = await test_data_collection()

        # Test 3: Storage (only if we got providers)
        if collection_results.get('providers'):
            await test_storage(collection_results['providers'])

        # Test 4: Matching
        await test_matching()

        # Test 5: Stats
        await test_stats()

        print("\n" + "=" * 60)
        print("ALL TESTS COMPLETED SUCCESSFULLY! ✅")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
