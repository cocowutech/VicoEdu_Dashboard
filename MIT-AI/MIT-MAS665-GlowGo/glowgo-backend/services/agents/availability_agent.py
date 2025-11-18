"""
Availability Agent for GlowGo Calendar Management
Uses CrewAI framework with specialized availability tools
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI

from config import settings, crew_config
from models.database import SessionLocal
from services.tools.availability_tools import (
    calendar_query_tool,
    working_hours_checker_tool,
    timezone_converter_tool,
    slot_finder_tool,
    alternative_suggester_tool,
    double_booking_preventor_tool
)


class AvailabilityAgent:
    """
    Real-time Availability Expert

    Orchestrates calendar queries, working hours checks, and slot finding
    to provide accurate availability information while preventing double-bookings.
    """

    def __init__(self):
        """Initialize the Availability Agent with LLM and tools"""
        # Configure LLM
        self.llm = ChatGoogleGenerativeAI(
            model=settings.GOOGLE_GEMINI_MODEL or crew_config.LLM_MODEL,
            google_api_key=settings.GOOGLE_GEMINI_API_KEY,
            temperature=crew_config.LLM_TEMPERATURE,
            max_tokens=crew_config.LLM_MAX_TOKENS
        )

        # Create CrewAI agent
        self.agent = Agent(
            name="Availability Agent",
            role="Real-time Availability Expert",
            goal="Check provider availability and suggest available time slots",
            backstory="""You are an expert at reading calendars and finding available slots.
            You never allow double-bookings. You're creative at suggesting alternatives.
            You understand timezones and working hours. You ensure every booking is conflict-free.""",
            tools=[],  # Tools will be called manually for better control
            llm=self.llm,
            max_iterations=crew_config.MAX_ITERATIONS,
            memory=crew_config.AGENT_MEMORY,
            verbose=crew_config.AGENT_VERBOSE,
            allow_delegation=False
        )

    async def execute(
        self,
        candidates: List[Dict[str, Any]],
        preferred_date: Optional[str] = None,
        preferred_time: Optional[str] = None,
        time_constraint: Optional[str] = None,
        time_urgency: str = "flexible",
        service_duration: int = 30,
        user_timezone: str = "America/New_York"
    ) -> Dict[str, Any]:
        """
        Execute availability agent workflow

        Args:
            candidates: List of provider candidates from matching agent
            preferred_date: ISO date string (optional)
            preferred_time: Time string "HH:MM" (optional)
            time_constraint: "before", "after", or "by" (optional)
            time_urgency: "ASAP", "today", "week", "flexible"
            service_duration: Service duration in minutes
            user_timezone: User's timezone

        Returns:
            dict: {
                "candidates_with_slots": list,
                "available_slots_per_provider": dict,
                "providers_available": int,
                "slots_available": int,
                "status": str,
                "message": str
            }
        """
        try:
            # Create database session
            db_session = SessionLocal()

            try:
                print(f"📅 Availability Agent: Checking {len(candidates)} candidates")
                print(f"   Service duration: {service_duration} minutes")
                print(f"   Time urgency: {time_urgency}")

                # Determine date range based on urgency
                date_range = self._get_date_range(time_urgency, preferred_date)

                candidates_with_slots = []
                total_slots = 0

                # Process each candidate
                for candidate in candidates:
                    provider_id = candidate.get("provider_id") or candidate.get("id")
                    provider_name = candidate.get("provider_name") or candidate.get("business_name")

                    if not provider_id:
                        continue

                    print(f"\n🔍 Checking availability for: {provider_name}")

                    # Step 1: Query calendar
                    print(f"   Step 1: Querying calendar...")
                    calendar_result = calendar_query_tool.execute({
                        "provider_id": provider_id,
                        "date_range": date_range,
                        "db_session": db_session
                    })

                    available_slots = calendar_result.get("available_slots", [])
                    booked_times = calendar_result.get("booked_times", [])

                    print(f"   Found {len(available_slots)} potential slots")
                    print(f"   Booked times: {len(booked_times)}")

                    # Step 2: Check working hours
                    print(f"   Step 2: Checking working hours...")
                    hours_result = working_hours_checker_tool.execute({
                        "provider_id": provider_id,
                        "db_session": db_session
                    })

                    working_hours = hours_result.get("hours", {})
                    provider_tz = hours_result.get("timezone", "America/New_York")

                    print(f"   Timezone: {provider_tz}")

                    # Step 3: Filter slots by working hours
                    filtered_slots = self._filter_by_working_hours(
                        available_slots,
                        working_hours
                    )

                    print(f"   After working hours filter: {len(filtered_slots)} slots")

                    # Step 4: Find slots with sufficient duration
                    print(f"   Step 3: Finding slots with {service_duration} min duration...")
                    slot_result = slot_finder_tool.execute({
                        "preferred_date": preferred_date or "any",
                        "preferred_time": preferred_time,
                        "time_constraint": time_constraint,
                        "service_duration": service_duration,
                        "available_slots": filtered_slots
                    })

                    matching_slots = slot_result.get("matching_slots", [])

                    print(f"   Slots with sufficient duration: {len(matching_slots)}")

                    # Step 5: Prevent double-bookings
                    print(f"   Step 4: Validating against double-bookings...")
                    validated_slots = []

                    for slot in matching_slots:
                        prevention_result = double_booking_preventor_tool.execute({
                            "slot": slot.get("datetime"),
                            "service_duration": service_duration,
                            "all_bookings": booked_times
                        })

                        if prevention_result.get("is_available"):
                            validated_slots.append(slot)

                    print(f"   ✅ {len(validated_slots)} conflict-free slots")

                    # Step 6: Convert to user's timezone if different
                    user_tz_slots = []
                    for slot in validated_slots:
                        if provider_tz != user_timezone:
                            tz_result = timezone_converter_tool.execute({
                                "provider_tz": provider_tz,
                                "user_tz": user_timezone,
                                "time": slot.get("datetime")
                            })
                            slot["user_timezone_time"] = tz_result.get("user_time")
                            slot["timezone_offset"] = tz_result.get("offset_hours")
                        else:
                            slot["user_timezone_time"] = slot.get("datetime")
                            slot["timezone_offset"] = 0

                        user_tz_slots.append(slot)

                    # Step 7: Suggest alternatives if preferred time not available
                    alternatives = []
                    if preferred_time and user_tz_slots:
                        # Combine preferred date and time
                        if preferred_date:
                            preferred_datetime = f"{preferred_date}T{preferred_time}"
                        else:
                            # Use today
                            preferred_datetime = f"{datetime.now().date().isoformat()}T{preferred_time}"

                        alt_result = alternative_suggester_tool.execute({
                            "preferred_time": preferred_datetime,
                            "available_slots": user_tz_slots,
                            "max_alternatives": 5
                        })

                        alternatives = alt_result.get("alternatives", [])

                    # Build candidate result
                    if user_tz_slots:
                        candidate_info = {
                            "provider_id": provider_id,
                            "provider_name": provider_name,
                            "available_slots": [
                                {
                                    "datetime": s.get("datetime"),
                                    "date": s.get("date"),
                                    "time": s.get("time"),
                                    "end_time": s.get("end_time"),
                                    "user_time": s.get("user_timezone_time")
                                }
                                for s in user_tz_slots[:10]  # Limit to 10 slots
                            ],
                            "slots_count": len(user_tz_slots),
                            "working_hours": self._format_working_hours(working_hours),
                            "timezone": provider_tz,
                            "user_timezone": user_timezone,
                            "alternatives": alternatives[:3] if alternatives else [],
                            # Include original candidate data
                            "service_id": candidate.get("service_id"),
                            "service_name": candidate.get("service_name"),
                            "price": candidate.get("price"),
                            "rating": candidate.get("rating"),
                            "distance": candidate.get("distance"),
                            "match_score": candidate.get("match_score")
                        }

                        candidates_with_slots.append(candidate_info)
                        total_slots += len(user_tz_slots)

                # Sort candidates by number of available slots (most slots first)
                candidates_with_slots.sort(
                    key=lambda x: x.get("slots_count", 0),
                    reverse=True
                )

                print(f"\n📊 Availability Summary:")
                print(f"   Providers with availability: {len(candidates_with_slots)}")
                print(f"   Total available slots: {total_slots}")

                # Build slots per provider map
                slots_per_provider = {
                    c["provider_id"]: c["slots_count"]
                    for c in candidates_with_slots
                }

                return {
                    "candidates_with_slots": candidates_with_slots,
                    "available_slots_per_provider": slots_per_provider,
                    "providers_available": len(candidates_with_slots),
                    "slots_available": total_slots,
                    "status": "success" if candidates_with_slots else "no_availability",
                    "message": (
                        f"Found {total_slots} available slots across {len(candidates_with_slots)} providers"
                        if candidates_with_slots
                        else "No availability found for the selected criteria"
                    )
                }

            finally:
                # Always close the session
                db_session.close()

        except Exception as e:
            print(f"AvailabilityAgent execution error: {e}")
            import traceback
            traceback.print_exc()

            # Fallback response
            return {
                "candidates_with_slots": [],
                "available_slots_per_provider": {},
                "providers_available": 0,
                "slots_available": 0,
                "status": "error",
                "message": f"Error checking availability: {str(e)}"
            }

    def _get_date_range(
        self,
        time_urgency: str,
        preferred_date: Optional[str] = None
    ) -> Dict[str, str]:
        """Get date range based on time urgency"""
        today = datetime.now().date()

        if preferred_date:
            # Use preferred date
            try:
                pref_date = datetime.fromisoformat(preferred_date).date()
                return {
                    "start": pref_date.isoformat(),
                    "end": (pref_date + timedelta(days=1)).isoformat()
                }
            except:
                pass

        if time_urgency in ["asap", "today"]:
            return {
                "start": today.isoformat(),
                "end": today.isoformat()
            }
        elif time_urgency == "week":
            return {
                "start": today.isoformat(),
                "end": (today + timedelta(days=7)).isoformat()
            }
        else:  # flexible
            return {
                "start": today.isoformat(),
                "end": (today + timedelta(days=30)).isoformat()
            }

    def _filter_by_working_hours(
        self,
        slots: List[Dict],
        working_hours: Dict[str, List[str]]
    ) -> List[Dict]:
        """Filter slots to only include those within working hours"""
        filtered = []

        for slot in slots:
            slot_datetime = datetime.fromisoformat(slot.get("datetime"))
            day_name = slot_datetime.strftime("%A").lower()

            # Get working hours for this day
            day_hours = working_hours.get(day_name, ["closed", "closed"])

            if day_hours[0] == "closed":
                continue

            # Parse working hours
            try:
                open_time = datetime.strptime(day_hours[0], "%H:%M").time()
                close_time = datetime.strptime(day_hours[1], "%H:%M").time()

                slot_time = slot_datetime.time()

                # Check if slot is within working hours
                if open_time <= slot_time < close_time:
                    filtered.append(slot)
            except:
                # If parsing fails, include the slot
                filtered.append(slot)

        return filtered

    def _format_working_hours(self, hours: Dict[str, List[str]]) -> str:
        """Format working hours for display"""
        # Example: "Mon-Fri: 9:00-18:00, Sat: 10:00-16:00, Sun: Closed"
        weekday_hours = hours.get("monday", ["closed", "closed"])
        saturday_hours = hours.get("saturday", ["closed", "closed"])
        sunday_hours = hours.get("sunday", ["closed", "closed"])

        parts = []

        if weekday_hours[0] != "closed":
            parts.append(f"Mon-Fri: {weekday_hours[0]}-{weekday_hours[1]}")

        if saturday_hours[0] != "closed":
            parts.append(f"Sat: {saturday_hours[0]}-{saturday_hours[1]}")

        if sunday_hours[0] != "closed":
            parts.append(f"Sun: {sunday_hours[0]}-{sunday_hours[1]}")
        else:
            parts.append("Sun: Closed")

        return ", ".join(parts)

    def sync_execute(
        self,
        candidates: List[Dict[str, Any]],
        preferred_date: Optional[str] = None,
        preferred_time: Optional[str] = None,
        time_urgency: str = "flexible",
        service_duration: int = 30,
        user_timezone: str = "America/New_York"
    ) -> Dict[str, Any]:
        """
        Synchronous version of execute for non-async contexts

        Args:
            Same as execute()

        Returns:
            Same as execute()
        """
        import asyncio

        # Check if there's a running event loop
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            # No running loop, create new one
            return asyncio.run(
                self.execute(
                    candidates,
                    preferred_date,
                    preferred_time,
                    time_urgency,
                    service_duration,
                    user_timezone
                )
            )
        else:
            # Already in async context, create task
            return loop.run_until_complete(
                self.execute(
                    candidates,
                    preferred_date,
                    preferred_time,
                    time_urgency,
                    service_duration,
                    user_timezone
                )
            )


# Global agent instance
availability_agent = AvailabilityAgent()
