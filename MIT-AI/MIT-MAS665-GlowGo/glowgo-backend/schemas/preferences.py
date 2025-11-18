from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatRequest(BaseModel):
    """Request schema for chat endpoint"""
    message: str = Field(..., description="User's message in the conversation")
    session_id: Optional[str] = Field(None, description="Optional session ID to continue existing conversation")


class PreferenceSchema(BaseModel):
    """Extracted preferences from conversation"""
    service_type: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    time_urgency: Optional[str] = None  # ASAP, today, week, flexible
    preferred_date: Optional[str] = None  # ISO format: YYYY-MM-DD
    preferred_time: Optional[str] = None  # 24h format: HH:MM
    time_constraint: Optional[str] = None  # before, after, by
    artisan_preference: Optional[str] = None
    special_notes: Optional[str] = None


class ChatResponse(BaseModel):
    """Response schema for chat endpoint"""
    success: bool = True
    session_id: str
    preferences: PreferenceSchema
    response: str = Field(..., description="AI assistant's response message")
    ready_to_match: bool = Field(False, description="Whether user is ready for matching")
    next_question: Optional[str] = Field(None, description="Next question to ask")
    ranked_matches: Optional[List[Dict[str, Any]]] = Field(None, description="Ranked matches when ready_to_match is True")
    total_matches_found: Optional[int] = Field(None, description="Total number of matches found")
    search_summary: Optional[str] = Field(None, description="Summary of search results")


class ConversationMessage(BaseModel):
    """Single message in conversation history"""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime


class PreferenceSessionResponse(BaseModel):
    """Complete preference session data"""
    id: str
    user_id: str
    session_id: str
    service_type: Optional[str]
    budget_min: Optional[float]
    budget_max: Optional[float]
    time_urgency: Optional[str]
    preferred_date: Optional[str]
    preferred_time: Optional[str]
    time_constraint: Optional[str]
    artisan_preference: Optional[str]
    special_notes: Optional[str]
    conversation_history: List[Dict[str, Any]]
    ready_to_match: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

