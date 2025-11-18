"""
Test script for PreferenceCrew
Demonstrates the multi-turn conversation flow
"""

import asyncio
from services.crews.preference_crew import preference_crew


async def test_preference_crew():
    """Test the preference crew with a multi-turn conversation"""

    print("=" * 80)
    print("Testing PreferenceCrew - Multi-turn Conversation Flow")
    print("=" * 80)

    # Turn 1: User wants a haircut
    print("\n🗣️  USER: I want a haircut")
    result1 = await preference_crew.run(
        user_message="I want a haircut",
        conversation_history=[],
        current_preferences={}
    )

    print(f"\n✅ RESULT 1:")
    print(f"   Ready to match: {result1['ready_to_match']}")
    print(f"   Response: {result1['response_to_user']}")
    print(f"   Next question: {result1['next_question']}")
    print(f"   Preferences: {result1['extracted_preferences']}")

    # Turn 2: User provides budget
    print("\n\n🗣️  USER: Around $50")
    result2 = await preference_crew.run(
        user_message="Around $50",
        conversation_history=[
            {"role": "user", "content": "I want a haircut"},
            {"role": "assistant", "content": result1['response_to_user']}
        ],
        current_preferences=result1['extracted_preferences']
    )

    print(f"\n✅ RESULT 2:")
    print(f"   Ready to match: {result2['ready_to_match']}")
    print(f"   Response: {result2['response_to_user']}")
    print(f"   Next question: {result2['next_question']}")
    print(f"   Preferences: {result2['extracted_preferences']}")

    # Turn 3: User provides time and location
    print("\n\n🗣️  USER: ASAP in Cambridge")
    result3 = await preference_crew.run(
        user_message="ASAP in Cambridge",
        conversation_history=[
            {"role": "user", "content": "I want a haircut"},
            {"role": "assistant", "content": result1['response_to_user']},
            {"role": "user", "content": "Around $50"},
            {"role": "assistant", "content": result2['response_to_user']}
        ],
        current_preferences=result2['extracted_preferences']
    )

    print(f"\n✅ RESULT 3:")
    print(f"   Ready to match: {result3['ready_to_match']}")
    print(f"   Response: {result3['response_to_user']}")
    print(f"   Next question: {result3['next_question']}")
    print(f"   Preferences: {result3['extracted_preferences']}")
    print(f"   Conversation context: {result3['conversation_context'][:100]}...")

    print("\n" + "=" * 80)
    if result3['ready_to_match']:
        print("✅ SUCCESS! All preferences gathered and validated!")
    else:
        print("⚠️  Still gathering preferences...")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(test_preference_crew())
