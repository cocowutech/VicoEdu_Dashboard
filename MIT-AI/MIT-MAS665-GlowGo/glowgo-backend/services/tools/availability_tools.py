"""
Availability Tools for CrewAI Multi-Agent System
Production-ready tools with Pydantic validation for calendar and availability management
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, time
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
import pytz

from models.database import SessionLocal


class CalendarQueryTool(BaseModel):
    """Tool to query provider's calendar for available and booked slots"""

    name: str = "calendar_query"
    description: str = "Queries provider calendar to get available and booked time slots"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Query provider's calendar

        Args:
            inputs: {
                "provider_id": str,
                "date_range": {"start": str, "end": str},  # ISO format dates
                "db_session": Session (optional)
            }

        Returns:
            {
                "available_slots": list,  # List of available time slots
                "booked_times": list,     # List of booked time ranges
                "date_range": dict
            }
        """
        try:
            provider_id = inputs.get("provider_id")
            date_range = inputs.get("date_range", {})
            db_session = inputs.get("db_session")
            close_session = False

            if not provider_id:
                return {
                    "available_slots": [],
                    "booked_times": [],
                    "date_range": date_range
                }

            # Create session if not provided
            if db_session is None:
                db_session = SessionLocal()
                close_session = True

            try:
                start_date = date_range.get("start")
                end_date = date_range.get("end")

                if not start_date or not end_date:
                    # Default to today and next 7 days
                    start_date = datetime.now().date().isoformat()
                    end_date = (datetime.now().date() + timedelta(days=7)).isoformat()

                # Query bookings for this provider in date range
                query = text("""
                    SELECT
                        booking_date,
                        booking_time_start,
                        booking_time_end,
                        status
                    FROM bookings
                    WHERE merchant_id = :provider_id
                    AND booking_date BETWEEN :start_date AND :end_date
                    AND status IN ('confirmed', 'pending')
                    ORDER BY booking_date, booking_time_start
                """)

                result = db_session.execute(
                    query,
                    {
                        "provider_id": provider_id,
                        "start_date": start_date,
                        "end_date": end_date
                    }
                )
                rows = result.fetchall()

                # Build booked times list
                booked_times = []
                for row in rows:
                    booking_date = row[0].isoformat() if hasattr(row[0], 'isoformat') else str(row[0])
                    start_time = str(row[1])
                    end_time = str(row[2]) if row[2] else None

                    booked_times.append({
                        "date": booking_date,
                        "start_time": start_time,
                        "end_time": end_time,
                        "status": row[3]
                    })

                # Generate available slots (inverse of booked times)
                # This is a simplified version - in production, would use working hours
                available_slots = self._calculate_available_slots(
                    start_date,
                    end_date,
                    booked_times
                )

                return {
                    "available_slots": available_slots,
                    "booked_times": booked_times,
                    "date_range": {"start": start_date, "end": end_date}
                }

            finally:
                if close_session:
                    db_session.close()

        except Exception as e:
            print(f"CalendarQueryTool error: {e}")
            return {
                "available_slots": [],
                "booked_times": [],
                "date_range": date_range
            }

    def _calculate_available_slots(
        self,
        start_date: str,
        end_date: str,
        booked_times: List[Dict]
    ) -> List[Dict[str, str]]:
        """Calculate available slots based on booked times"""
        available = []

        # Parse dates
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)

        # Default working hours: 9 AM - 6 PM
        work_start = time(9, 0)
        work_end = time(18, 0)

        # Iterate through each day
        current_date = start.date()
        while current_date <= end.date():
            # Get bookings for this day
            day_bookings = [
                b for b in booked_times
                if b["date"] == current_date.isoformat()
            ]

            # Generate hourly slots for the day
            current_time = datetime.combine(current_date, work_start)
            end_time = datetime.combine(current_date, work_end)

            while current_time < end_time:
                slot_start = current_time
                slot_end = current_time + timedelta(minutes=30)  # 30-min slots

                # Check if this slot is free
                is_free = True
                for booking in day_bookings:
                    booking_start = datetime.combine(
                        current_date,
                        datetime.strptime(booking["start_time"], "%H:%M:%S").time()
                    )
                    if booking["end_time"]:
                        booking_end = datetime.combine(
                            current_date,
                            datetime.strptime(booking["end_time"], "%H:%M:%S").time()
                        )
                    else:
                        booking_end = booking_start + timedelta(hours=1)

                    # Check for overlap
                    if not (slot_end <= booking_start or slot_start >= booking_end):
                        is_free = False
                        break

                if is_free and slot_end <= end_time:
                    available.append({
                        "datetime": slot_start.isoformat(),
                        "date": current_date.isoformat(),
                        "time": slot_start.strftime("%H:%M")
                    })

                current_time += timedelta(minutes=30)

            current_date += timedelta(days=1)

        return available


class WorkingHoursCheckerTool(BaseModel):
    """Tool to check provider's working hours"""

    name: str = "working_hours_checker"
    description: str = "Gets provider's working hours and timezone information"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get provider's working hours

        Preference order:
        1. Use precise business hours from Yelp (stored in merchants.business_hours JSONB)
        2. Fallback to default hours based on merchant location/state

        Args:
            inputs: {
                "provider_id": str,
                "db_session": Session (optional)
            }

        Returns:
            {
                "hours": {
                    "monday": ["09:00", "17:00"],
                    "tuesday": ["09:00", "17:00"],
                    ...
                },
                "timezone": str
            }
        """
        try:
            provider_id = inputs.get("provider_id")
            db_session = inputs.get("db_session")
            close_session = False

            if not provider_id:
                return self._get_default_hours()

            # Create session if not provided
            if db_session is None:
                db_session = SessionLocal()
                close_session = True

            try:
                # Try to read precise business hours from merchants table
                query = text("""
                    SELECT state, city, business_hours
                    FROM merchants
                    WHERE id = :provider_id
                """)

                result = db_session.execute(query, {"provider_id": provider_id})
                row = result.fetchone()

                if not row:
                    return self._get_default_hours()

                state = row[0]
                business_hours = None
                if len(row) > 2:
                    business_hours = row[2]

                # Determine timezone based on state
                timezone = self._get_timezone_from_state(state)

                # If we have Yelp-style business hours, convert them
                if business_hours:
                    try:
                        hours = self._convert_yelp_hours_to_working_hours(business_hours)
                        return {
                            "hours": hours,
                            "timezone": timezone
                        }
                    except Exception as parse_error:
                        print(f"WorkingHoursCheckerTool: error parsing business_hours: {parse_error}")

                # Fallback: standard business hours when no Yelp data is available
                return {
                    "hours": self._get_default_hours()["hours"],
                    "timezone": timezone
                }

            finally:
                if close_session:
                    db_session.close()

        except Exception as e:
            print(f"WorkingHoursCheckerTool error: {e}")
            return self._get_default_hours()

    def _get_default_hours(self) -> Dict[str, Any]:
        """Return default working hours"""
        return {
            "hours": {
                "monday": ["09:00", "18:00"],
                "tuesday": ["09:00", "18:00"],
                "wednesday": ["09:00", "18:00"],
                "thursday": ["09:00", "18:00"],
                "friday": ["09:00", "18:00"],
                "saturday": ["10:00", "16:00"],
                "sunday": ["closed", "closed"]
            },
            "timezone": "America/New_York"
        }

    def _convert_yelp_hours_to_working_hours(self, business_hours: Any) -> Dict[str, List[str]]:
        """
        Convert Yelp-style business hours into simple open/close times per weekday.

        Yelp format (stored in merchants.business_hours):
        [
            {"day": 0, "start": "0900", "end": "1700", "is_overnight": false},
            ...
        ]

        We map this to:
        {
            "monday": ["09:00", "17:00"],
            ...
        }

        If multiple intervals exist for a day, we take the earliest opening
        and latest closing as the effective working hours.
        """
        # Ensure we are working with a list (may arrive as JSON string or dict)
        if isinstance(business_hours, str):
            import json

            business_hours_parsed = json.loads(business_hours)
        else:
            business_hours_parsed = business_hours

        if not isinstance(business_hours_parsed, list):
            # Unexpected format, fallback to default
            return self._get_default_hours()["hours"]

        # Map of weekday index (0=Mon) to list of (start, end) tuples
        day_intervals: Dict[int, List[tuple]] = {}

        for entry in business_hours_parsed:
            try:
                day_index = int(entry.get("day"))
                start_raw = entry.get("start")
                end_raw = entry.get("end")

                if start_raw is None or end_raw is None:
                    continue

                # Yelp time strings are "HHMM" (e.g., "0930")
                if len(start_raw) == 4:
                    start_str = f"{start_raw[0:2]}:{start_raw[2:4]}"
                else:
                    # Best-effort parsing
                    start_str = f"{start_raw[0:2]}:{start_raw[2:4]}" if len(start_raw) >= 4 else "09:00"

                if len(end_raw) == 4:
                    end_str = f"{end_raw[0:2]}:{end_raw[2:4]}"
                else:
                    end_str = f"{end_raw[0:2]}:{end_raw[2:4]}" if len(end_raw) >= 4 else "17:00"

                if day_index not in day_intervals:
                    day_intervals[day_index] = []
                day_intervals[day_index].append((start_str, end_str))
            except Exception:
                continue

        # Helper to pick earliest open and latest close
        def combine_intervals(intervals: List[tuple]) -> List[str]:
            if not intervals:
                return ["closed", "closed"]
            opens = [i[0] for i in intervals]
            closes = [i[1] for i in intervals]
            return [min(opens), max(closes)]

        # Build final mapping
        day_names = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ]

        hours: Dict[str, List[str]] = {}
        for idx, name in enumerate(day_names):
            intervals = day_intervals.get(idx, [])
            hours[name] = combine_intervals(intervals)

        return hours

    def _get_timezone_from_state(self, state: str) -> str:
        """Map state to timezone"""
        state_timezones = {
            "NY": "America/New_York",
            "CA": "America/Los_Angeles",
            "IL": "America/Chicago",
            "TX": "America/Chicago",
            "FL": "America/New_York",
            "WA": "America/Los_Angeles",
            "MA": "America/New_York",
        }
        return state_timezones.get(state, "America/New_York")


class TimezoneConverterTool(BaseModel):
    """Tool to convert times between timezones"""

    name: str = "timezone_converter"
    description: str = "Converts time between timezones with DST handling"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert time between timezones

        Args:
            inputs: {
                "provider_tz": str,  # e.g., "America/New_York"
                "user_tz": str,      # e.g., "America/Los_Angeles"
                "time": str          # ISO datetime string
            }

        Returns:
            {
                "converted_time": str,  # ISO datetime in user's timezone
                "offset_hours": float,
                "provider_time": str,
                "user_time": str
            }
        """
        try:
            provider_tz_str = inputs.get("provider_tz", "America/New_York")
            user_tz_str = inputs.get("user_tz", "America/New_York")
            time_str = inputs.get("time")

            if not time_str:
                return {
                    "converted_time": None,
                    "offset_hours": 0,
                    "provider_time": None,
                    "user_time": None
                }

            # Parse timezone objects
            provider_tz = pytz.timezone(provider_tz_str)
            user_tz = pytz.timezone(user_tz_str)

            # Parse time
            if "T" in time_str:
                dt = datetime.fromisoformat(time_str.replace("Z", "+00:00"))
            else:
                dt = datetime.fromisoformat(time_str)

            # Localize to provider timezone if naive
            if dt.tzinfo is None:
                dt_provider = provider_tz.localize(dt)
            else:
                dt_provider = dt.astimezone(provider_tz)

            # Convert to user timezone
            dt_user = dt_provider.astimezone(user_tz)

            # Calculate offset
            offset_hours = (dt_user.utcoffset().total_seconds() -
                          dt_provider.utcoffset().total_seconds()) / 3600

            return {
                "converted_time": dt_user.isoformat(),
                "offset_hours": offset_hours,
                "provider_time": dt_provider.strftime("%Y-%m-%d %H:%M %Z"),
                "user_time": dt_user.strftime("%Y-%m-%d %H:%M %Z")
            }

        except Exception as e:
            print(f"TimezoneConverterTool error: {e}")
            return {
                "converted_time": inputs.get("time"),
                "offset_hours": 0,
                "provider_time": inputs.get("time"),
                "user_time": inputs.get("time")
            }


class SlotFinderTool(BaseModel):
    """Tool to find time slots with sufficient duration for a service"""

    name: str = "slot_finder"
    description: str = "Finds available slots with sufficient duration for the service"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Find slots with sufficient duration

        Args:
            inputs: {
                "preferred_date": str,      # ISO date or "any"
                "preferred_time": str,      # Time in HH:MM format (optional)
                "time_constraint": str,     # "before", "after", or "by" (optional)
                "service_duration": int,    # Duration in minutes
                "available_slots": list     # From CalendarQueryTool
            }

        Returns:
            {
                "matching_slots": list,
                "count": int
            }
        """
        try:
            preferred_date = inputs.get("preferred_date")
            preferred_time = inputs.get("preferred_time")
            time_constraint = inputs.get("time_constraint")
            service_duration = inputs.get("service_duration", 30)
            available_slots = inputs.get("available_slots", [])

            if not available_slots:
                return {"matching_slots": [], "count": 0}

            matching_slots = []

            # Group slots by date
            slots_by_date = {}
            for slot in available_slots:
                date = slot.get("date")
                if date not in slots_by_date:
                    slots_by_date[date] = []
                slots_by_date[date].append(slot)

            # Filter by preferred date if specified
            if preferred_date and preferred_date != "any":
                slots_by_date = {
                    date: slots for date, slots in slots_by_date.items()
                    if date == preferred_date
                }

            # Find slots with sufficient duration
            for date, slots in slots_by_date.items():
                # Sort slots by time
                slots.sort(key=lambda x: x.get("time", ""))

                for i, slot in enumerate(slots):
                    # Check if there's enough consecutive time
                    slot_time = datetime.fromisoformat(slot.get("datetime"))
                    required_end_time = slot_time + timedelta(minutes=service_duration)

                    # Check if we have continuous availability
                    has_duration = True
                    current_time = slot_time

                    while current_time < required_end_time:
                        # Look for slot covering this time
                        found = False
                        for s in slots:
                            s_time = datetime.fromisoformat(s.get("datetime"))
                            s_end = s_time + timedelta(minutes=30)  # Assuming 30-min slots

                            if s_time <= current_time < s_end:
                                found = True
                                current_time = s_end
                                break

                        if not found:
                            has_duration = False
                            break

                    if has_duration:
                        matching_slots.append({
                            "datetime": slot.get("datetime"),
                            "date": slot.get("date"),
                            "time": slot.get("time"),
                            "end_time": required_end_time.strftime("%H:%M"),
                            "duration_minutes": service_duration
                        })

            # Apply time constraint filter if specified
            if preferred_time and time_constraint:
                filtered_slots = []

                for slot in matching_slots:
                    slot_time_str = slot.get("time")

                    # Compare times (both in HH:MM format)
                    if time_constraint == "before":
                        # Only include slots that start before the preferred time
                        if slot_time_str < preferred_time:
                            filtered_slots.append(slot)

                    elif time_constraint == "after":
                        # Only include slots that start after the preferred time
                        if slot_time_str > preferred_time:
                            filtered_slots.append(slot)

                    elif time_constraint == "by":
                        # Include slots that END by (before or at) the preferred time
                        slot_end_time = slot.get("end_time")
                        if slot_end_time and slot_end_time <= preferred_time:
                            filtered_slots.append(slot)

                matching_slots = filtered_slots

            return {
                "matching_slots": matching_slots,
                "count": len(matching_slots)
            }

        except Exception as e:
            print(f"SlotFinderTool error: {e}")
            return {"matching_slots": [], "count": 0}


class AlternativeSuggesterTool(BaseModel):
    """Tool to suggest alternative time slots when preferred time is unavailable"""

    name: str = "alternative_suggester"
    description: str = "Suggests alternative time slots close to preferred time"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Suggest alternative slots

        Args:
            inputs: {
                "preferred_time": str,      # ISO datetime or time
                "available_slots": list,
                "max_alternatives": int (default: 5)
            }

        Returns:
            {
                "alternatives": list,
                "count": int
            }
        """
        try:
            preferred_time_str = inputs.get("preferred_time")
            available_slots = inputs.get("available_slots", [])
            max_alternatives = inputs.get("max_alternatives", 5)

            if not available_slots:
                return {"alternatives": [], "count": 0}

            # Parse preferred time
            try:
                if "T" in preferred_time_str:
                    preferred_time = datetime.fromisoformat(preferred_time_str)
                else:
                    # Just a time, use today's date
                    time_obj = datetime.strptime(preferred_time_str, "%H:%M").time()
                    preferred_time = datetime.combine(datetime.now().date(), time_obj)
            except:
                # If parsing fails, use first available slot's date
                if available_slots:
                    preferred_time = datetime.fromisoformat(available_slots[0].get("datetime"))
                else:
                    return {"alternatives": [], "count": 0}

            # Calculate time difference for each slot
            slots_with_diff = []
            for slot in available_slots:
                slot_time = datetime.fromisoformat(slot.get("datetime"))

                # Calculate absolute time difference in minutes
                diff_minutes = abs((slot_time - preferred_time).total_seconds() / 60)

                # Only include slots within +/- 1 hour (60 minutes)
                if diff_minutes <= 60:
                    slots_with_diff.append({
                        "slot": slot,
                        "diff_minutes": diff_minutes,
                        "is_before": slot_time < preferred_time
                    })

            # Sort by time difference (closest first)
            slots_with_diff.sort(key=lambda x: x["diff_minutes"])

            # Get top alternatives
            alternatives = []
            for item in slots_with_diff[:max_alternatives]:
                slot = item["slot"]
                alternatives.append({
                    "datetime": slot.get("datetime"),
                    "date": slot.get("date"),
                    "time": slot.get("time"),
                    "diff_minutes": int(item["diff_minutes"]),
                    "is_before": item["is_before"],
                    "label": f"{int(item['diff_minutes'])} min {'before' if item['is_before'] else 'after'}"
                })

            return {
                "alternatives": alternatives,
                "count": len(alternatives)
            }

        except Exception as e:
            print(f"AlternativeSuggesterTool error: {e}")
            return {"alternatives": [], "count": 0}


class DoubleBookingPreventorTool(BaseModel):
    """Tool to prevent double-booking by checking slot conflicts"""

    name: str = "double_booking_preventor"
    description: str = "Prevents double-bookings by checking for conflicts"

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if slot is available without conflicts

        Args:
            inputs: {
                "slot": str,              # ISO datetime
                "service_duration": int,  # Minutes
                "all_bookings": list      # List of existing bookings
            }

        Returns:
            {
                "is_available": bool,
                "conflict_info": str or None
            }
        """
        try:
            slot_str = inputs.get("slot")
            service_duration = inputs.get("service_duration", 30)
            all_bookings = inputs.get("all_bookings", [])

            if not slot_str:
                return {
                    "is_available": False,
                    "conflict_info": "No slot time provided"
                }

            # Parse slot time
            slot_start = datetime.fromisoformat(slot_str)
            slot_end = slot_start + timedelta(minutes=service_duration)

            # Check for conflicts
            for booking in all_bookings:
                # Parse booking times
                booking_date = booking.get("date")
                booking_start_time = booking.get("start_time")
                booking_end_time = booking.get("end_time")

                if not booking_date or not booking_start_time:
                    continue

                # Construct booking datetime
                try:
                    booking_date_obj = datetime.fromisoformat(booking_date).date()
                    booking_start = datetime.combine(
                        booking_date_obj,
                        datetime.strptime(booking_start_time, "%H:%M:%S").time()
                    )

                    if booking_end_time:
                        booking_end = datetime.combine(
                            booking_date_obj,
                            datetime.strptime(booking_end_time, "%H:%M:%S").time()
                        )
                    else:
                        # Assume 1-hour booking if no end time
                        booking_end = booking_start + timedelta(hours=1)

                    # Check for overlap
                    # Overlap occurs if: slot_start < booking_end AND slot_end > booking_start
                    if slot_start < booking_end and slot_end > booking_start:
                        conflict_info = (
                            f"Conflicts with existing booking from "
                            f"{booking_start.strftime('%H:%M')} to "
                            f"{booking_end.strftime('%H:%M')} on "
                            f"{booking_date_obj.strftime('%Y-%m-%d')}"
                        )
                        return {
                            "is_available": False,
                            "conflict_info": conflict_info
                        }

                except Exception as parse_error:
                    print(f"Error parsing booking time: {parse_error}")
                    continue

            # No conflicts found
            return {
                "is_available": True,
                "conflict_info": None
            }

        except Exception as e:
            print(f"DoubleBookingPreventorTool error: {e}")
            return {
                "is_available": False,
                "conflict_info": f"Error checking availability: {str(e)}"
            }


# Tool instances for easy import
calendar_query_tool = CalendarQueryTool()
working_hours_checker_tool = WorkingHoursCheckerTool()
timezone_converter_tool = TimezoneConverterTool()
slot_finder_tool = SlotFinderTool()
alternative_suggester_tool = AlternativeSuggesterTool()
double_booking_preventor_tool = DoubleBookingPreventorTool()
