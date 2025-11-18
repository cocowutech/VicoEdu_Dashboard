"""
Simple test runner for all agent tests
Run with: python run_tests.py
"""

import subprocess
import sys


def run_test(test_name, test_file):
    """Run a single test and report results"""
    print(f"\n{'='*80}")
    print(f"Running: {test_name}")
    print(f"{'='*80}\n")

    try:
        result = subprocess.run(
            [sys.executable, test_file],
            cwd="/Users/cocowu/MIT-AI/glowgonew/MIT-MAS665-GlowGo/glowgo-backend",
            capture_output=False,
            text=True
        )

        if result.returncode == 0:
            print(f"\n✅ {test_name} PASSED\n")
            return True
        else:
            print(f"\n❌ {test_name} FAILED\n")
            return False

    except Exception as e:
        print(f"\n❌ {test_name} ERROR: {e}\n")
        return False


def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("🧪 GLOWGO AGENT TESTING SUITE")
    print("="*80 + "\n")

    tests = [
        ("Conversation Agent Test", "test_conversation_agent.py"),
        ("Matching Agent Test", "test_matching_agent.py"),
        ("Availability Agent Test", "test_availability_agent.py"),
        ("Complete Flow Test", "test_complete_flow.py")
    ]

    results = {}

    for test_name, test_file in tests:
        results[test_name] = run_test(test_name, test_file)

    # Final summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80 + "\n")

    passed = sum(1 for result in results.values() if result)
    total = len(results)

    for test_name, passed_test in results.items():
        status = "✅ PASSED" if passed_test else "❌ FAILED"
        print(f"{status:12} | {test_name}")

    print(f"\n{'='*80}")
    print(f"Results: {passed}/{total} tests passed")
    print("="*80 + "\n")

    if passed == total:
        print("🎉 All tests passed! Your agents are working correctly.\n")
        sys.exit(0)
    else:
        print(f"⚠️  {total - passed} test(s) failed. Check output above for details.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
