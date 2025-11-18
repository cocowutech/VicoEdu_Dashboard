"""
Test script for time extraction functionality
Tests the complete flow: extraction -> preference schema -> availability filtering
"""

from datetime import datetime
from services.tools.conversation_tools import preference_extractor_tool


def test_time_extraction():
    """Test various time extraction scenarios"""

    print("=" * 80)
    print("TIME EXTRACTION TESTS")
    print("=" * 80)
    print()

    test_cases = [
        {
            "message": "yes, before next thursday 3 pm",
            "description": "Before next Thursday 3pm"
        },
        {
            "message": "I need it after 5pm tomorrow",
            "description": "After 5pm tomorrow"
        },
        {
            "message": "by friday at 2:30pm",
            "description": "By Friday at 2:30pm"
        },
        {
            "message": "today at 10am",
            "description": "Today at 10am"
        },
        {
            "message": "next monday morning before 9 am",
            "description": "Next Monday before 9am"
        },
        {
            "message": "I need a haircut anytime this week",
            "description": "Anytime this week (no specific time)"
        }
    ]

    current_date = datetime.now()
    print(f"Current date/time: {current_date.strftime('%A, %B %d, %Y at %I:%M %p')}")
    print()

    for i, test_case in enumerate(test_cases, 1):
        message = test_case["message"]
        description = test_case["description"]

        print(f"\n{'='*80}")
        print(f"Test {i}: {description}")
        print(f"{'='*80}")
        print(f"User message: \"{message}\"")
        print()

        # Extract preferences
        result = preference_extractor_tool.execute({
            "message": message,
            "current_preferences": {}
        })

        print("Extracted preferences:")
        print(f"  - time_urgency: {result.get('time_urgency')}")
        print(f"  - preferred_date: {result.get('preferred_date')}")
        print(f"  - preferred_time: {result.get('preferred_time')}")
        print(f"  - time_constraint: {result.get('time_constraint')}")

        # Verify extraction
        if result.get('preferred_date'):
            date_obj = datetime.fromisoformat(result['preferred_date'])
            print(f"\n  ✓ Specific date extracted: {date_obj.strftime('%A, %B %d, %Y')}")

        if result.get('preferred_time'):
            print(f"  ✓ Specific time extracted: {result['preferred_time']}")

        if result.get('time_constraint'):
            print(f"  ✓ Time constraint extracted: {result['time_constraint']}")

        print()


def test_slot_filtering():
    """Test that slot filtering works with time constraints"""
    from services.tools.availability_tools import slot_finder_tool

    print("\n" + "=" * 80)
    print("SLOT FILTERING TEST")
    print("=" * 80)
    print()

    # Mock available slots
    mock_slots = [
        {"datetime": "2025-11-21T09:00:00", "date": "2025-11-21", "time": "09:00"},
        {"datetime": "2025-11-21T10:00:00", "date": "2025-11-21", "time": "10:00"},
        {"datetime": "2025-11-21T11:00:00", "date": "2025-11-21", "time": "11:00"},
        {"datetime": "2025-11-21T13:00:00", "date": "2025-11-21", "time": "13:00"},
        {"datetime": "2025-11-21T14:00:00", "date": "2025-11-21", "time": "14:00"},
        {"datetime": "2025-11-21T15:00:00", "date": "2025-11-21", "time": "15:00"},  # 3 PM
        {"datetime": "2025-11-21T16:00:00", "date": "2025-11-21", "time": "16:00"},
        {"datetime": "2025-11-21T17:00:00", "date": "2025-11-21", "time": "17:00"},
    ]

    print("Available slots (Thursday, Nov 21, 2025):")
    for slot in mock_slots:
        print(f"  - {slot['time']}")
    print()

    # Test 1: "before 3pm" constraint
    print("\nTest: 'before next thursday 3 pm'")
    print("Constraint: before 15:00")

    result = slot_finder_tool.execute({
        "preferred_date": "2025-11-21",
        "preferred_time": "15:00",
        "time_constraint": "before",
        "service_duration": 30,
        "available_slots": mock_slots
    })

    matching_slots = result.get("matching_slots", [])
    print(f"\nFiltered slots (should only show times before 3pm): {len(matching_slots)} found")
    for slot in matching_slots:
        print(f"  ✓ {slot['time']} - {slot['end_time']}")

    # Verify all slots are before 15:00
    all_before_3pm = all(slot['time'] < '15:00' for slot in matching_slots)
    if all_before_3pm and len(matching_slots) > 0:
        print("\n✅ SUCCESS: All slots are before 3pm!")
    else:
        print("\n❌ FAILED: Some slots are after 3pm or no slots found")

    # Test 2: "after 2pm" constraint
    print("\n" + "-" * 80)
    print("\nTest: 'after 2pm'")
    print("Constraint: after 14:00")

    result = slot_finder_tool.execute({
        "preferred_date": "2025-11-21",
        "preferred_time": "14:00",
        "time_constraint": "after",
        "service_duration": 30,
        "available_slots": mock_slots
    })

    matching_slots = result.get("matching_slots", [])
    print(f"\nFiltered slots (should only show times after 2pm): {len(matching_slots)} found")
    for slot in matching_slots:
        print(f"  ✓ {slot['time']} - {slot['end_time']}")

    # Verify all slots are after 14:00
    all_after_2pm = all(slot['time'] > '14:00' for slot in matching_slots)
    if all_after_2pm and len(matching_slots) > 0:
        print("\n✅ SUCCESS: All slots are after 2pm!")
    else:
        print("\n❌ FAILED: Some slots are before 2pm or no slots found")


if __name__ == "__main__":
    try:
        test_time_extraction()
        test_slot_filtering()

        print("\n" + "=" * 80)
        print("ALL TESTS COMPLETED")
        print("=" * 80)

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
