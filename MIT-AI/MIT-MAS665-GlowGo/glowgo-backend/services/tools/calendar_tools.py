"""
Google Calendar Tool for GlowGo
Allows checking user's calendar for availability
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import pytz
from crewai.tools import BaseTool
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from models.database import SessionLocal
from models.user import User

logger = logging.getLogger(__name__)


class GoogleCalendarTool(BaseTool):
    """
    Tool for checking user's Google Calendar availability
    """

    name: str = "google_calendar_check"
    description: str = """
    Check user's Google Calendar for availability on a specific date/time.
    Input should be a JSON with:
    - user_id: The ID of the user
    - date: ISO format date string (YYYY-MM-DD)
    - time: Optional time string (HH:MM)
    
    Returns free/busy slots around the requested time.
    """

    def _run(self, input_data: Dict[str, Any]) -> str:
        """Check calendar availability"""
        db = SessionLocal()
        try:
            # Parse input
            user_id = input_data.get("user_id")
            date_str = input_data.get("date")
            time_str = input_data.get("time")
            
            if not user_id:
                return "Error: User ID is required"
                
            # Get user and token
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.google_access_token:
                return "Error: User has not connected their Google Calendar"
                
            # Create credentials
            creds = Credentials(token=user.google_access_token)
            service = build('calendar', 'v3', credentials=creds)
            
            # Calculate time range
            target_date = datetime.fromisoformat(date_str)
            
            # If specific time provided, check +/- 2 hours
            # If no time, check whole day (9am-9pm)
            if time_str:
                target_time = datetime.strptime(time_str, "%H:%M").time()
                start_dt = datetime.combine(target_date.date(), target_time) - timedelta(hours=2)
                end_dt = datetime.combine(target_date.date(), target_time) + timedelta(hours=2)
            else:
                start_dt = datetime.combine(target_date.date(), datetime.strptime("09:00", "%H:%M").time())
                end_dt = datetime.combine(target_date.date(), datetime.strptime("21:00", "%H:%M").time())
            
            # Convert to UTC isoformat for API
            # Assuming EST for now, in production should store user's timezone
            tz = pytz.timezone('America/New_York')
            start_iso = tz.localize(start_dt).isoformat()
            end_iso = tz.localize(end_dt).isoformat()
            
            # Query free/busy
            body = {
                "timeMin": start_iso,
                "timeMax": end_iso,
                "timeZone": "America/New_York",
                "items": [{"id": "primary"}]
            }
            
            events_result = service.freebusy().query(body=body).execute()
            calendars = events_result.get('calendars', {})
            primary = calendars.get('primary', {})
            busy_slots = primary.get('busy', [])
            
            if not busy_slots:
                return f"Great news! Your calendar is completely free on {date_str} between {start_dt.strftime('%I:%M %p')} and {end_dt.strftime('%I:%M %p')}."
                
            # Format busy slots for the agent
            busy_text = []
            for slot in busy_slots:
                start = datetime.fromisoformat(slot['start']).strftime('%I:%M %p')
                end = datetime.fromisoformat(slot['end']).strftime('%I:%M %p')
                busy_text.append(f"{start} - {end}")
                
            return f"You have the following events on your calendar:\n" + "\n".join(busy_text)

        except Exception as e:
            logger.error(f"Calendar check error: {e}")
            return f"Error checking calendar: {str(e)}"
        finally:
            db.close()

google_calendar_tool = GoogleCalendarTool()


