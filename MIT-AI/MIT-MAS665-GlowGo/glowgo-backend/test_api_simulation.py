"""
Simulate the actual API flow to debug preference gathering
"""

import asyncio
from services.crews.preference_crew import preference_crew


async def simulate_api_flow():
    """Simulate what happens in the /chat endpoint"""

    print("=" * 80)
    print("SIMULATING API FLOW")
    print("=" * 80)

    # Simulate database session (initially empty)
    db_session = {
        "service_type": None,
        "budget_min": None,
        "budget_max": None,
        "time_urgency": None,
        "artisan_preference": None,
        "special_notes": None
    }

    conversation_history = []

    # TURN 1
    print("\n" + "=" * 80)
    print("TURN 1: User says 'I need a haircut'")
    print("=" * 80)

    user_message_1 = "I need a haircut"

    # Load current preferences from DB
    current_preferences_1 = db_session.copy()
    print(f"\nLoaded from DB: {current_preferences_1}")

    # Call crew
    result_1 = await preference_crew.run(
        user_message=user_message_1,
        conversation_history=[],
        current_preferences=current_preferences_1
    )

    print(f"\n✅ Crew Result:")
    print(f"   Ready: {result_1['ready_to_match']}")
    print(f"   Response: {result_1['response_to_user']}")
    print(f"   Extracted: {result_1['extracted_preferences']}")

    # Update DB session (simulating lines 187-205)
    updated_prefs_1 = result_1['extracted_preferences']
    if updated_prefs_1.get("service_type"):
        db_session["service_type"] = updated_prefs_1["service_type"]
    if updated_prefs_1.get("budget_min"):
        db_session["budget_min"] = updated_prefs_1["budget_min"]
    if updated_prefs_1.get("budget_max"):
        db_session["budget_max"] = updated_prefs_1["budget_max"]
    if updated_prefs_1.get("time_urgency"):
        db_session["time_urgency"] = updated_prefs_1["time_urgency"]

    print(f"\n💾 Saved to DB: {db_session}")

    # Update conversation history
    conversation_history.extend([
        {"role": "user", "content": user_message_1},
        {"role": "assistant", "content": result_1['response_to_user']}
    ])

    # TURN 2
    print("\n\n" + "=" * 80)
    print("TURN 2: User says 'Around $60'")
    print("=" * 80)

    user_message_2 = "Around $60"

    # Load current preferences from DB
    current_preferences_2 = db_session.copy()
    print(f"\nLoaded from DB: {current_preferences_2}")

    # Call crew
    result_2 = await preference_crew.run(
        user_message=user_message_2,
        conversation_history=conversation_history,
        current_preferences=current_preferences_2
    )

    print(f"\n✅ Crew Result:")
    print(f"   Ready: {result_2['ready_to_match']}")
    print(f"   Response: {result_2['response_to_user']}")
    print(f"   Extracted: {result_2['extracted_preferences']}")

    # Update DB session
    updated_prefs_2 = result_2['extracted_preferences']
    if updated_prefs_2.get("service_type"):
        db_session["service_type"] = updated_prefs_2["service_type"]
    if updated_prefs_2.get("budget_min"):
        db_session["budget_min"] = updated_prefs_2["budget_min"]
    if updated_prefs_2.get("budget_max"):
        db_session["budget_max"] = updated_prefs_2["budget_max"]
    if updated_prefs_2.get("time_urgency"):
        db_session["time_urgency"] = updated_prefs_2["time_urgency"]

    print(f"\n💾 Saved to DB: {db_session}")

    # Update conversation history
    conversation_history.extend([
        {"role": "user", "content": user_message_2},
        {"role": "assistant", "content": result_2['response_to_user']}
    ])

    # TURN 3
    print("\n\n" + "=" * 80)
    print("TURN 3: User says 'Today'")
    print("=" * 80)

    user_message_3 = "Today"

    # Load current preferences from DB
    current_preferences_3 = db_session.copy()
    print(f"\nLoaded from DB: {current_preferences_3}")

    # Call crew
    result_3 = await preference_crew.run(
        user_message=user_message_3,
        conversation_history=conversation_history,
        current_preferences=current_preferences_3
    )

    print(f"\n✅ Crew Result:")
    print(f"   Ready: {result_3['ready_to_match']}")
    print(f"   Response: {result_3['response_to_user']}")
    print(f"   Extracted: {result_3['extracted_preferences']}")

    # Update DB session
    updated_prefs_3 = result_3['extracted_preferences']
    if updated_prefs_3.get("service_type"):
        db_session["service_type"] = updated_prefs_3["service_type"]
    if updated_prefs_3.get("budget_min"):
        db_session["budget_min"] = updated_prefs_3["budget_min"]
    if updated_prefs_3.get("budget_max"):
        db_session["budget_max"] = updated_prefs_3["budget_max"]
    if updated_prefs_3.get("time_urgency"):
        db_session["time_urgency"] = updated_prefs_3["time_urgency"]

    print(f"\n💾 Final DB State: {db_session}")

    print("\n" + "=" * 80)
    if result_3['ready_to_match']:
        print("✅ SUCCESS - Ready to match!")
    else:
        print("⚠️  NOT READY - More info needed")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(simulate_api_flow())
