
"""
Calendar API Router
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import pytz
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from pydantic import BaseModel

from models.user import User
from utils.db import get_db
from utils.auth import get_current_user

router = APIRouter(tags=["calendar"])

class CalendarEvent(BaseModel):
    id: str
    summary: str
    start: str
    end: str
    description: Optional[str] = None
    location: Optional[str] = None

class CalendarEventsResponse(BaseModel):
    events: List[CalendarEvent]
    connected: bool

@router.get("/events", response_model=CalendarEventsResponse)
async def get_calendar_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get upcoming calendar events for the logged-in user
    """
    if not current_user.google_access_token:
        return CalendarEventsResponse(events=[], connected=False)

    try:
        # Create credentials
        creds = Credentials(token=current_user.google_access_token)
        service = build('calendar', 'v3', credentials=creds)

        # Time range: now to +7 days
        now = datetime.utcnow()
        time_min = now.isoformat() + 'Z'  # 'Z' indicates UTC time
        time_max = (now + timedelta(days=7)).isoformat() + 'Z'

        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            maxResults=10,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        items = events_result.get('items', [])
        events = []
        
        for item in items:
            start = item['start'].get('dateTime', item['start'].get('date'))
            end = item['end'].get('dateTime', item['end'].get('date'))
            
            events.append(CalendarEvent(
                id=item['id'],
                summary=item.get('summary', 'Busy'),
                start=start,
                end=end,
                description=item.get('description'),
                location=item.get('location')
            ))
            
        return CalendarEventsResponse(events=events, connected=True)

    except Exception as e:
        print(f"Error fetching calendar events: {e}")
        # If token is invalid, we might want to return connected=False or handle refresh
        # For now, return empty list but still marked as 'connected' conceptually unless token revoked
        return CalendarEventsResponse(events=[], connected=False) 


