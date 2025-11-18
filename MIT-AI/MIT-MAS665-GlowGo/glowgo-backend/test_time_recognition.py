#!/usr/bin/env python3
"""
Test script to verify time recognition for all three cases:
1. "before next thursday" (constraint + date, no specific time)
2. "before next thursday 3 pm" (constraint + date + specific time)
3. "next thursday" (just date, no constraint or time)
"""

from services.tools.conversation_tools import (
    preference_extractor_tool,
    readiness_detector_tool
)

def test_case_1():
    """Test: before next thursday (no specific time)"""
    print("\n" + "=" * 70)
    print("TEST CASE 1: 'before next thursday' (constraint + date, no time)")
    print("=" * 70)

    current_prefs = {
        "service_type": "haircut",
        "budget_max": 50.0
    }

    message = "before next thursday"

    result = preference_extractor_tool.execute({
        "message": message,
        "current_preferences": current_prefs
    })

    print(f"\n✅ Extraction Result:")
    for key, value in result.items():
        if value is not None:
            print(f"  {key}: {value}")

    # Merge with current preferences
    merged_prefs = {**current_prefs, **{k: v for k, v in result.items() if v is not None}}

    readiness = readiness_detector_tool.execute({
        "current_preferences": merged_prefs
    })

    print(f"\n✅ Readiness Check:")
    print(f"  Ready to match: {readiness['ready_to_match']}")
    print(f"  Missing fields: {readiness['missing_fields']}")

    if readiness['ready_to_match']:
        print("\n✅ SUCCESS: Should be ready to match!")
    else:
        print(f"\n❌ FAILURE: Should be ready but still missing {readiness['missing_fields']}")


def test_case_2():
    """Test: before next thursday 3 pm (constraint + date + time)"""
    print("\n" + "=" * 70)
    print("TEST CASE 2: 'before next thursday 3 pm' (constraint + date + time)")
    print("=" * 70)

    current_prefs = {
        "service_type": "haircut",
        "budget_max": 50.0
    }

    message = "before next thursday 3 pm"

    result = preference_extractor_tool.execute({
        "message": message,
        "current_preferences": current_prefs
    })

    print(f"\n✅ Extraction Result:")
    for key, value in result.items():
        if value is not None:
            print(f"  {key}: {value}")

    # Merge with current preferences
    merged_prefs = {**current_prefs, **{k: v for k, v in result.items() if v is not None}}

    readiness = readiness_detector_tool.execute({
        "current_preferences": merged_prefs
    })

    print(f"\n✅ Readiness Check:")
    print(f"  Ready to match: {readiness['ready_to_match']}")
    print(f"  Missing fields: {readiness['missing_fields']}")

    if readiness['ready_to_match']:
        print("\n✅ SUCCESS: Should be ready to match!")
    else:
        print(f"\n❌ FAILURE: Should be ready but still missing {readiness['missing_fields']}")


def test_case_3():
    """Test: next thursday (just date)"""
    print("\n" + "=" * 70)
    print("TEST CASE 3: 'next thursday' (just date, no constraint or time)")
    print("=" * 70)

    current_prefs = {
        "service_type": "haircut",
        "budget_max": 50.0
    }

    message = "next thursday"

    result = preference_extractor_tool.execute({
        "message": message,
        "current_preferences": current_prefs
    })

    print(f"\n✅ Extraction Result:")
    for key, value in result.items():
        if value is not None:
            print(f"  {key}: {value}")

    # Merge with current preferences
    merged_prefs = {**current_prefs, **{k: v for k, v in result.items() if v is not None}}

    readiness = readiness_detector_tool.execute({
        "current_preferences": merged_prefs
    })

    print(f"\n✅ Readiness Check:")
    print(f"  Ready to match: {readiness['ready_to_match']}")
    print(f"  Missing fields: {readiness['missing_fields']}")

    if readiness['ready_to_match']:
        print("\n✅ SUCCESS: Should be ready to match!")
    else:
        print(f"\n❌ FAILURE: Should be ready but still missing {readiness['missing_fields']}")


if __name__ == "__main__":
    test_case_1()
    test_case_2()
    test_case_3()

    print("\n" + "=" * 70)
    print("ALL TESTS COMPLETED")
    print("=" * 70 + "\n")
