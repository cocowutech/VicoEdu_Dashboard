"""
Interactive Terminal Chat with GlowGo Matching Crew
Talk to the agents directly in your terminal using the orchestrated crew!
"""

import asyncio
import sys
from typing import Dict, Any, List

sys.path.insert(0, '/Users/cocowu/MIT-AI/glowgonew/MIT-MAS665-GlowGo/glowgo-backend')

from services.crews.matching_crew import matching_crew


class InteractiveCrewChat:
    """Interactive chat session with GlowGo matching crew"""

    def __init__(self):
        self.conversation_history: List[Dict[str, str]] = []
        self.current_preferences: Dict[str, Any] = {}
        self.ready_to_match = False

    def print_header(self):
        """Print welcome header"""
        print("\n" + "="*80)
        print("💬 GLOWGO INTERACTIVE CHAT (Powered by Matching Crew)")
        print("="*80)
        print("\nWelcome! I'm GlowGo, your AI beauty & wellness assistant.")
        print("Tell me what service you're looking for!\n")
        print("Examples:")
        print("  - 'I need a haircut ASAP'")
        print("  - 'Looking for a manicure today, budget around $50'")
        print("  - 'Want a massage this week, prefer female therapist'\n")
        print("Commands:")
        print("  - Type 'quit' or 'exit' to end chat")
        print("  - Type 'reset' to start over")
        print("  - Type 'status' to see current preferences")
        print("="*80 + "\n")

    def print_status(self):
        """Print current preferences"""
        print("\n📋 Current Preferences:")
        print("-" * 40)
        if not self.current_preferences or not any(self.current_preferences.values()):
            print("  (none yet)")
        else:
            for key, value in self.current_preferences.items():
                if value:
                    display_key = key.replace('_', ' ').title()
                    print(f"  {display_key}: {value}")
        print("-" * 40 + "\n")

    async def process_message(self, user_message: str) -> str:
        """Process user message through matching crew"""

        # Call matching crew for preference gathering
        try:
            result = await matching_crew.run_preference_gathering(
                user_message=user_message,
                conversation_history=self.conversation_history,
                current_preferences=self.current_preferences
            )

            # Update state
            self.current_preferences = result['extracted_preferences']
            self.ready_to_match = result['ready_to_match']

            # Add to history
            self.conversation_history.append({
                "role": "user",
                "content": user_message
            })

            agent_response = result['response_to_user']

            self.conversation_history.append({
                "role": "assistant",
                "content": agent_response
            })

            return agent_response

        except Exception as e:
            print(f"\n❌ Error processing message: {e}")
            import traceback
            traceback.print_exc()
            return "Sorry, I encountered an error. Please try again."

    async def find_matches(self):
        """Find and rank matches using matching crew"""

        print("\n" + "="*80)
        print("🔍 FINDING YOUR PERFECT MATCH...")
        print("="*80 + "\n")

        try:
            # Use matching crew to orchestrate matching, availability, and ranking
            result = await matching_crew.run_matching_and_ranking(
                preferences=self.current_preferences,
                user_location=None,  # Could add: {"lat": 42.3601, "lon": -71.0942}
                max_distance=10.0
            )

            print(f"✅ {result['search_summary']}\n")

            if result['total_options_found'] == 0:
                print("😔 No providers found matching your criteria.")
                print("   Try adjusting your budget or time requirements.\n")
                return

            # Display Results
            print("="*80)
            print("🌟 YOUR TOP MATCHES")
            print("="*80 + "\n")

            for option in result['ranked_options'][:5]:
                medal = "🥇" if option['rank'] == 1 else "🥈" if option['rank'] == 2 else "🥉" if option['rank'] == 3 else "  "

                print(f"{medal} #{option['rank']}: {option['merchant_name']}")
                print(f"    Service: {option['service_name']}")
                print(f"    Price: ${option['price']}")
                print(f"    Rating: {option['rating']} ⭐")
                print(f"    Match Score: {option['relevance_score']:.0%}")

                # Show distance if available
                if option.get('distance'):
                    print(f"    Distance: {option['distance']:.1f} miles")

                # Show availability
                if option.get('available_times'):
                    times = option['available_times'][:3]
                    # Handle both string and dict formats
                    time_strings = []
                    for t in times:
                        if isinstance(t, dict):
                            time_strings.append(t.get('start_time', str(t)))
                        else:
                            time_strings.append(str(t))
                    if time_strings:
                        print(f"    Available: {', '.join(time_strings)}")

                print(f"    Why: {option['why_recommended']}")
                print()

            print("="*80 + "\n")

        except Exception as e:
            print(f"❌ Error finding matches: {e}\n")
            import traceback
            traceback.print_exc()

    async def run(self):
        """Run interactive chat loop"""

        self.print_header()

        while True:
            # Get user input
            try:
                user_input = input("You: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n\n👋 Goodbye!")
                break

            if not user_input:
                continue

            # Handle commands
            if user_input.lower() in ['quit', 'exit', 'bye']:
                print("\n👋 Thanks for using GlowGo! Goodbye!\n")
                break

            elif user_input.lower() == 'reset':
                self.conversation_history = []
                self.current_preferences = {}
                self.ready_to_match = False
                print("\n🔄 Chat reset! Let's start over.\n")
                continue

            elif user_input.lower() == 'status':
                self.print_status()
                continue

            # Process message through crew
            print("\n🤖 GlowGo: ", end="", flush=True)

            agent_response = await self.process_message(user_input)
            print(agent_response + "\n")

            # If ready to match, ask if user wants to see results
            if self.ready_to_match:
                print("✨ I have enough information to find matches!\n")

                find_matches = input("Would you like me to find providers now? (yes/no): ").strip().lower()

                if find_matches in ['yes', 'y', 'yeah', 'sure', 'ok']:
                    await self.find_matches()

                    # Ask if they want to start over
                    print("-"*80)
                    continue_chat = input("\nWould you like to search for something else? (yes/no): ").strip().lower()

                    if continue_chat in ['yes', 'y', 'yeah', 'sure']:
                        self.conversation_history = []
                        self.current_preferences = {}
                        self.ready_to_match = False
                        print("\n🔄 Starting new search...\n")
                    else:
                        print("\n👋 Thanks for using GlowGo! Goodbye!\n")
                        break
                else:
                    print("\nOkay! Keep chatting to refine your preferences, or type 'status' to see what I have.\n")


async def main():
    """Main entry point"""
    chat = InteractiveCrewChat()
    await chat.run()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
