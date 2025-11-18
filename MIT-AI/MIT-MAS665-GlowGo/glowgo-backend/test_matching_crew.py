"""
Test script for MatchingCrew
Demonstrates the matching, availability, and ranking workflow
"""

import asyncio
from services.crews.matching_crew import matching_crew


async def test_matching_crew():
    """Test the matching crew with example preferences"""

    print("=" * 80)
    print("Testing MatchingCrew - Matching, Availability, and Ranking Flow")
    print("=" * 80)

    # Example preferences
    preferences = {
        "service_type": "haircut",
        "budget_min": 40,
        "budget_max": 60,
        "time_urgency": "ASAP"
    }

    print("\n📋 USER PREFERENCES:")
    print(f"   Service: {preferences['service_type']}")
    print(f"   Budget: ${preferences['budget_min']} - ${preferences['budget_max']}")
    print(f"   Urgency: {preferences['time_urgency']}")
    print(f"   Location: Cambridge, MA")

    print("\n🚀 Running MatchingCrew...")
    print("-" * 80)

    result = await matching_crew.run(
        preferences=preferences,
        location="Cambridge, MA"
    )

    print("\n" + "=" * 80)
    print("📊 RESULTS")
    print("=" * 80)

    print(f"\nTotal options found: {result.get('total_options_found', 0)}")
    print(f"Search summary: {result.get('search_summary', 'No summary')}")

    ranked_options = result.get('ranked_options', [])

    if ranked_options:
        print(f"\n🎯 TOP MATCHES:\n")

        for option in ranked_options[:3]:
            print(f"#{option.get('rank')} - {option.get('merchant_name')}")
            print(f"   Service: {option.get('service_name')}")
            print(f"   Price: ${option.get('price')}")
            print(f"   Rating: {option.get('rating')}⭐ ({option.get('reviews', 0)} reviews)")
            if option.get('distance'):
                print(f"   Distance: {option.get('distance')} miles")
            print(f"   Available times: {', '.join(option.get('available_times', [])[:3])}")
            print(f"   Why recommended: {option.get('why_recommended')}")
            print(f"   Relevance score: {option.get('relevance_score')}")
            print()
    else:
        print("\n⚠️  No matches found")

    print("=" * 80)


async def test_different_preferences():
    """Test with different service types and budgets"""

    print("\n\n" + "=" * 80)
    print("Testing Different Scenarios")
    print("=" * 80)

    scenarios = [
        {
            "name": "Manicure - Budget Friendly",
            "preferences": {
                "service_type": "manicure",
                "budget_max": 30,
                "time_urgency": "flexible"
            }
        },
        {
            "name": "Facial - ASAP",
            "preferences": {
                "service_type": "facial",
                "budget_min": 50,
                "budget_max": 100,
                "time_urgency": "ASAP"
            }
        },
        {
            "name": "Haircut - This Week",
            "preferences": {
                "service_type": "haircut",
                "budget_max": 50,
                "time_urgency": "week"
            }
        }
    ]

    for scenario in scenarios:
        print(f"\n📌 SCENARIO: {scenario['name']}")
        print("-" * 80)

        result = await matching_crew.run(
            preferences=scenario['preferences'],
            location="Cambridge, MA"
        )

        total = result.get('total_options_found', 0)
        summary = result.get('search_summary', 'No summary')

        print(f"   Found: {total} options")
        print(f"   Summary: {summary}")

        if result.get('ranked_options'):
            top_match = result['ranked_options'][0]
            print(f"   Top match: {top_match.get('merchant_name')} - ${top_match.get('price')} ({top_match.get('rating')}⭐)")


if __name__ == "__main__":
    print("\n🧪 MATCHING CREW TEST SUITE\n")

    # Run main test
    asyncio.run(test_matching_crew())

    # Run scenario tests
    asyncio.run(test_different_preferences())

    print("\n✅ All tests complete!\n")
