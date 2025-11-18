"""
Test to verify that assistant responses are properly structured for frontend display
"""

import asyncio
from services.crews.preference_crew import preference_crew


async def test_response_display():
    """Test that responses are properly formatted for frontend"""

    print("=" * 80)
    print("TESTING RESPONSE DISPLAY")
    print("Testing that AI responses are properly included in crew results")
    print("=" * 80)

    # Test Turn 1
    print("\n" + "=" * 80)
    print("TURN 1: 'I need a haircut'")
    print("=" * 80)

    result1 = await preference_crew.run(
        user_message="I need a haircut",
        conversation_history=[],
        current_preferences={}
    )

    print("\n📤 Backend Response Structure:")
    print(f"  ✓ response_to_user: '{result1['response_to_user']}'")
    print(f"  ✓ ready_to_match: {result1['ready_to_match']}")
    print(f"  ✓ extracted_preferences: {result1['extracted_preferences']}")
    print(f"  ✓ next_question: {result1.get('next_question')}")

    # Verify response is not empty
    if result1['response_to_user']:
        print(f"\n✅ PASS: AI response is present")
        print(f"   Frontend should display: \"{result1['response_to_user']}\"")
    else:
        print(f"\n❌ FAIL: AI response is EMPTY!")

    # Test Turn 2
    print("\n\n" + "=" * 80)
    print("TURN 2: 'Around $60'")
    print("=" * 80)

    conversation_history = [
        {"role": "user", "content": "I need a haircut"},
        {"role": "assistant", "content": result1['response_to_user']}
    ]

    result2 = await preference_crew.run(
        user_message="Around $60",
        conversation_history=conversation_history,
        current_preferences=result1['extracted_preferences']
    )

    print("\n📤 Backend Response Structure:")
    print(f"  ✓ response_to_user: '{result2['response_to_user']}'")
    print(f"  ✓ ready_to_match: {result2['ready_to_match']}")
    print(f"  ✓ extracted_preferences: {result2['extracted_preferences']}")
    print(f"  ✓ next_question: {result2.get('next_question')}")

    # Verify response is not empty
    if result2['response_to_user']:
        print(f"\n✅ PASS: AI response is present")
        print(f"   Frontend should display: \"{result2['response_to_user']}\"")
    else:
        print(f"\n❌ FAIL: AI response is EMPTY!")

    # Test Turn 3
    print("\n\n" + "=" * 80)
    print("TURN 3: 'Today'")
    print("=" * 80)

    conversation_history.extend([
        {"role": "user", "content": "Around $60"},
        {"role": "assistant", "content": result2['response_to_user']}
    ])

    result3 = await preference_crew.run(
        user_message="Today",
        conversation_history=conversation_history,
        current_preferences=result2['extracted_preferences']
    )

    print("\n📤 Backend Response Structure:")
    print(f"  ✓ response_to_user: '{result3['response_to_user']}'")
    print(f"  ✓ ready_to_match: {result3['ready_to_match']}")
    print(f"  ✓ extracted_preferences: {result3['extracted_preferences']}")
    print(f"  ✓ next_question: {result3.get('next_question')}")

    # Verify response is not empty
    if result3['response_to_user']:
        print(f"\n✅ PASS: AI response is present")
        print(f"   Frontend should display: \"{result3['response_to_user']}\"")
    else:
        print(f"\n❌ FAIL: AI response is EMPTY!")

    # Summary
    print("\n" + "=" * 80)
    print("CONVERSATION FLOW SUMMARY")
    print("=" * 80)
    print("\nWhat the user should see on screen:")
    print(f"\n1. USER: 'I need a haircut'")
    print(f"   AI: '{result1['response_to_user']}'")
    print(f"\n2. USER: 'Around $60'")
    print(f"   AI: '{result2['response_to_user']}'")
    print(f"\n3. USER: 'Today'")
    print(f"   AI: '{result3['response_to_user']}'")

    print("\n" + "=" * 80)
    print("FRONTEND INTEGRATION CHECK")
    print("=" * 80)
    print("\nBackend provides:")
    print("  ✓ response_to_user field with AI message")
    print("  ✓ preferences field with extracted data")
    print("  ✓ ready_to_match boolean")
    print("\nFrontend (useChat.ts:64-70) should:")
    print("  1. Create ChatMessage with role='assistant'")
    print("  2. Set content = response.response (the response_to_user field)")
    print("  3. Add to messages array")
    print("  4. ChatContainer renders messages array")
    print("  5. User sees AI response on screen")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(test_response_display())
