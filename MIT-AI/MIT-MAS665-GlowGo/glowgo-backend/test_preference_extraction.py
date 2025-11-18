#!/usr/bin/env python3
"""
Test script for preference extraction
Run this to verify the extraction logic works correctly
"""

from services.tools.conversation_tools import (
    preference_extractor_tool,
    readiness_detector_tool
)

def test_conversation_flow():
    """Simulate a full conversation flow"""

    print("=" * 60)
    print("TESTING PREFERENCE EXTRACTION")
    print("=" * 60)

    # Start with empty preferences
    current_prefs = {}

    # Message 1: Service type
    print("\n📝 User says: 'I need a haircut'")
    result1 = preference_extractor_tool.execute({
        "message": "I need a haircut",
        "current_preferences": current_prefs
    })
    current_prefs.update({k: v for k, v in result1.items() if v is not None})
    print(f"Extracted: {current_prefs}")

    readiness1 = readiness_detector_tool.execute({
        "current_preferences": current_prefs
    })
    print(f"Ready to match: {readiness1['ready_to_match']}, Missing: {readiness1['missing_fields']}")

    # Message 2: Budget
    print("\n📝 User says: 'fifty dollars'")
    result2 = preference_extractor_tool.execute({
        "message": "fifty dollars",
        "current_preferences": current_prefs
    })
    current_prefs.update({k: v for k, v in result2.items() if v is not None})
    print(f"Extracted: {current_prefs}")

    readiness2 = readiness_detector_tool.execute({
        "current_preferences": current_prefs
    })
    print(f"Ready to match: {readiness2['ready_to_match']}, Missing: {readiness2['missing_fields']}")

    # Message 3: Time with constraint
    print("\n📝 User says: 'before next thursday'")
    result3 = preference_extractor_tool.execute({
        "message": "before next thursday",
        "current_preferences": current_prefs
    })
    current_prefs.update({k: v for k, v in result3.items() if v is not None})
    print(f"Extracted: {current_prefs}")

    readiness3 = readiness_detector_tool.execute({
        "current_preferences": current_prefs
    })
    print(f"Ready to match: {readiness3['ready_to_match']}, Missing: {readiness3['missing_fields']}")

    print("\n" + "=" * 60)
    print("FINAL PREFERENCES:")
    print("=" * 60)
    for key, value in current_prefs.items():
        if value is not None:
            print(f"  {key}: {value}")

    print("\n" + "=" * 60)
    if readiness3['ready_to_match']:
        print("✅ SUCCESS: Ready to match!")
    else:
        print(f"❌ FAILURE: Still missing {readiness3['missing_fields']}")
    print("=" * 60)

if __name__ == "__main__":
    test_conversation_flow()
