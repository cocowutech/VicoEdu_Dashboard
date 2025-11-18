"""
Debug test for the exact user scenario
"""

from services.tools.conversation_tools import (
    preference_extractor_tool,
    readiness_detector_tool
)

# Simulate the conversation flow
print("=" * 80)
print("DEBUG: User Conversation Flow")
print("=" * 80)

# Message 1: "$50 for a haircut"
print("\n📝 Message 1: '$50 for a haircut'")
current_prefs = {}

result1 = preference_extractor_tool.execute({
    "message": "$50 for a haircut",
    "current_preferences": current_prefs
})

print(f"Extracted: {result1}")

# Check readiness
readiness1 = readiness_detector_tool.execute({
    "current_preferences": result1
})
print(f"Readiness: ready={readiness1.get('ready_to_match')}, missing={readiness1.get('missing_fields')}")

# Message 2: "before next thursday 3 pm"
print("\n📝 Message 2: 'before next thursday 3 pm'")

result2 = preference_extractor_tool.execute({
    "message": "before next thursday 3 pm",
    "current_preferences": result1  # Carry over from previous
})

print(f"Extracted: {result2}")

# Check readiness
readiness2 = readiness_detector_tool.execute({
    "current_preferences": result2
})
print(f"Readiness: ready={readiness2.get('ready_to_match')}, missing={readiness2.get('missing_fields')}")

if readiness2.get('ready_to_match'):
    print("\n✅ SUCCESS: Ready to match!")
else:
    print(f"\n❌ ISSUE: Still missing fields: {readiness2.get('missing_fields')}")
    print(f"   Completeness: {readiness2.get('completeness') * 100}%")

# Message 3: "before next friday"
print("\n" + "=" * 80)
print("\n📝 Message 3: 'before next friday'")

result3 = preference_extractor_tool.execute({
    "message": "before next friday",
    "current_preferences": result2  # Carry over
})

print(f"Extracted: {result3}")

# Check readiness
readiness3 = readiness_detector_tool.execute({
    "current_preferences": result3
})
print(f"Readiness: ready={readiness3.get('ready_to_match')}, missing={readiness3.get('missing_fields')}")

if readiness3.get('ready_to_match'):
    print("\n✅ SUCCESS: Ready to match!")
else:
    print(f"\n❌ ISSUE: Still missing fields: {readiness3.get('missing_fields')}")
    print(f"   Completeness: {readiness3.get('completeness') * 100}%")
