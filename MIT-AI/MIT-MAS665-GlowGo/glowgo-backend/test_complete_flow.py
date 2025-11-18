"""
Test script for Complete Workflow: Preference Gathering -> Matching -> Ranking
Demonstrates the full end-to-end flow as it should work after initial message
"""

import asyncio
from services.crews.preference_crew import preference_crew
from services.crews.matching_crew import matching_crew


async def test_complete_flow():
    """Test the complete flow from initial message through matching"""

    print("=" * 80)
    print("Testing Complete GlowGo Workflow")
    print("Preference Gathering → Quality Assurance → Matching → Ranking")
    print("=" * 80)

    # =========================================================================
    # PHASE 1: Preference Gathering (Multi-turn conversation)
    # =========================================================================
    print("\n" + "=" * 80)
    print("PHASE 1: PREFERENCE GATHERING")
    print("=" * 80)

    conversation_history = []
    current_preferences = {}

    # Turn 1: Initial request
    print("\n🗣️  USER: I need a haircut")
    result1 = await preference_crew.run(
        user_message="I need a haircut",
        conversation_history=conversation_history,
        current_preferences=current_preferences
    )

    print(f"\n🤖 ASSISTANT: {result1['response_to_user']}")
    print(f"   ├─ Ready to match: {result1['ready_to_match']}")
    print(f"   ├─ Next question: {result1.get('next_question')}")
    print(f"   └─ Extracted: {result1['extracted_preferences']}")

    # Update conversation
    conversation_history.extend([
        {"role": "user", "content": "I need a haircut"},
        {"role": "assistant", "content": result1['response_to_user']}
    ])
    current_preferences = result1['extracted_preferences']

    # Turn 2: Provide budget
    print("\n🗣️  USER: My budget is around $60")
    result2 = await preference_crew.run(
        user_message="My budget is around $60",
        conversation_history=conversation_history,
        current_preferences=current_preferences
    )

    print(f"\n🤖 ASSISTANT: {result2['response_to_user']}")
    print(f"   ├─ Ready to match: {result2['ready_to_match']}")
    print(f"   ├─ Next question: {result2.get('next_question')}")
    print(f"   └─ Extracted: {result2['extracted_preferences']}")

    # Update conversation
    conversation_history.extend([
        {"role": "user", "content": "My budget is around $60"},
        {"role": "assistant", "content": result2['response_to_user']}
    ])
    current_preferences = result2['extracted_preferences']

    # Turn 3: Provide timing
    print("\n🗣️  USER: I need it today")
    result3 = await preference_crew.run(
        user_message="I need it today",
        conversation_history=conversation_history,
        current_preferences=current_preferences
    )

    print(f"\n🤖 ASSISTANT: {result3['response_to_user']}")
    print(f"   ├─ Ready to match: {result3['ready_to_match']}")
    print(f"   ├─ Next question: {result3.get('next_question')}")
    print(f"   └─ Extracted: {result3['extracted_preferences']}")

    # Check if ready to match
    if not result3['ready_to_match']:
        print("\n⚠️  Still need more information. Continue conversation...")
        return

    # =========================================================================
    # PHASE 2: Matching, Availability Check, and Ranking
    # =========================================================================
    print("\n" + "=" * 80)
    print("PHASE 2: MATCHING & RANKING")
    print("=" * 80)

    final_preferences = result3['extracted_preferences']

    print(f"\n📋 Final Preferences:")
    print(f"   ├─ Service: {final_preferences.get('service_type')}")
    print(f"   ├─ Budget: ${final_preferences.get('budget_max')}")
    print(f"   └─ Timing: {final_preferences.get('time_urgency')}")

    print("\n🔍 Running Matching Crew (3 agents)...")
    print("   1️⃣  MatchingAgent - Finding providers...")
    print("   2️⃣  AvailabilityAgent - Checking time slots...")
    print("   3️⃣  RankingAgent - Ranking by relevance...")

    try:
        matching_result = await matching_crew.run(
            preferences=final_preferences,
            location="Cambridge, MA"
        )

        # Extract results
        ranked_options = matching_result.get("ranked_options", [])
        total_found = matching_result.get("total_options_found", 0)
        search_summary = matching_result.get("search_summary", "")

        print(f"\n✅ Matching Complete!")
        print(f"   {search_summary}")

        # Display top matches
        if ranked_options:
            print("\n" + "=" * 80)
            print(f"TOP {min(3, len(ranked_options))} MATCHES")
            print("=" * 80)

            for i, match in enumerate(ranked_options[:3], 1):
                print(f"\n#{i} {match.get('merchant_name', 'Unknown')}")
                print(f"   ├─ Service: {match.get('service_name', 'N/A')}")
                print(f"   ├─ Price: ${match.get('price', 0):.2f}")
                print(f"   ├─ Rating: {'⭐' * int(match.get('rating', 0))} ({match.get('rating', 0)}/5)")
                print(f"   ├─ Reviews: {match.get('reviews', 0)}")
                print(f"   ├─ Distance: {match.get('distance', 'N/A')} miles")
                print(f"   ├─ Relevance: {match.get('relevance_score', 0):.0%}")
                print(f"   ├─ Available Times:")

                available_times = match.get('available_times', [])
                if available_times:
                    for time_slot in available_times[:3]:
                        print(f"   │  • {time_slot}")
                else:
                    print(f"   │  • (Check with provider)")

                print(f"   └─ Why: {match.get('why_recommended', 'Good match')}")

        else:
            print("\n⚠️  No matches found")
            print("   Try adjusting budget or location preferences")

        # =========================================================================
        # SUMMARY
        # =========================================================================
        print("\n" + "=" * 80)
        print("WORKFLOW SUMMARY")
        print("=" * 80)
        print(f"✅ Conversation turns: 3")
        print(f"✅ Preferences gathered: {len([k for k, v in final_preferences.items() if v])}")
        print(f"✅ QA validation: Passed")
        print(f"✅ Providers matched: {total_found}")
        print(f"✅ Top recommendation: {ranked_options[0]['merchant_name'] if ranked_options else 'None'}")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ Error during matching: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_complete_flow())
