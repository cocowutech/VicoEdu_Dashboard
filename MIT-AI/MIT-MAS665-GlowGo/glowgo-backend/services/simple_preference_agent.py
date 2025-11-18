"""
Simplified AI Preference Agent using Google Gemini directly
This is a working fallback while CrewAI issues are resolved
"""

import json
import re
from typing import List, Dict, Any
import google.generativeai as genai
import logging
from langchain_openai import ChatOpenAI

from config import settings


class SimplePreferenceAgent:
    """
    Simplified AI agent for extracting preferences using Gemini directly
    """
    
    def __init__(self):
        """Initialize Gemini"""
        genai.configure(api_key=settings.GOOGLE_GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GOOGLE_GEMINI_MODEL)
        self.fallback_llm = None
        if settings.OPENAI_API_KEY:
            self.fallback_llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                api_key=settings.OPENAI_API_KEY,
                temperature=0.7,
                max_tokens=500
            )
        self.logger = logging.getLogger(__name__)
    
    def extract_service_type(self, text: str) -> str:
        """Extract service type from text"""
        text_lower = text.lower()
        categories = {
            "haircut": ["haircut", "hair cut", "trim", "barber", "stylist"],
            "nails": ["nails", "manicure", "pedicure", "nail art"],
            "massage": ["massage", "deep tissue", "swedish", "hot stone"],
            "spa": ["spa", "spa day", "spa treatment"],
            "facial": ["facial", "face treatment", "skincare"],
            "waxing": ["waxing", "wax", "hair removal"],
            "makeup": ["makeup", "make up", "cosmetics"],
            "cleaning": ["cleaning", "house cleaning"],
        }
        
        for category, keywords in categories.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return category
        return None
    
    def extract_budget(self, text: str) -> Dict[str, float]:
        """Extract budget from text"""
        amounts = re.findall(r'\$?\s*(\d+(?:\.\d{2})?)', text)
        if not amounts:
            return {"budget_min": None, "budget_max": None}
        
        numbers = [float(amt) for amt in amounts]
        
        if len(numbers) >= 2:
            return {"budget_min": min(numbers), "budget_max": max(numbers)}
        
        amount = numbers[0]
        if any(word in text.lower() for word in ["around", "about"]):
            return {"budget_min": amount * 0.8, "budget_max": amount * 1.2}
        
        return {"budget_min": None, "budget_max": amount}
    
    def extract_urgency(self, text: str) -> str:
        """Extract time urgency"""
        text_lower = text.lower()
        if any(word in text_lower for word in ["asap", "urgent", "now", "immediately"]):
            return "ASAP"
        if any(word in text_lower for word in ["today", "this afternoon"]):
            return "today"
        if any(word in text_lower for word in ["this week", "soon"]):
            return "week"
        if any(word in text_lower for word in ["flexible", "whenever", "anytime"]):
            return "flexible"
        return None
    
    async def chat(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        current_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process message and extract preferences
        
        Args:
            user_message: User's message
            conversation_history: Previous messages
            current_preferences: Already extracted preferences
            
        Returns:
            dict with preferences, response, ready_to_match
        """
        # Extract from current message
        service = self.extract_service_type(user_message)
        budget = self.extract_budget(user_message)
        urgency = self.extract_urgency(user_message)
        
        # Merge with current preferences
        preferences = {
            "service_type": service or current_preferences.get("service_type"),
            "budget_min": budget["budget_min"] or current_preferences.get("budget_min"),
            "budget_max": budget["budget_max"] or current_preferences.get("budget_max"),
            "time_urgency": urgency or current_preferences.get("time_urgency"),
            "artisan_preference": current_preferences.get("artisan_preference"),
            "special_notes": current_preferences.get("special_notes")
        }
        
        # Check if ready to match
        has_service = preferences["service_type"] is not None
        has_budget = preferences["budget_min"] is not None or preferences["budget_max"] is not None
        has_urgency = preferences["time_urgency"] is not None
        ready_to_match = has_service and has_budget and has_urgency
        
        # Generate response using Gemini
        prompt = f"""You are GlowGo, a helpful AI assistant for booking beauty/wellness services.

Current preferences:
- Service: {preferences['service_type'] or 'not specified'}
- Budget: ${preferences['budget_max'] or 'not specified'}
- Urgency: {preferences['time_urgency'] or 'not specified'}

User just said: "{user_message}"

Generate a SHORT (1-2 sentences), FRIENDLY response.

If ready to match (have service, budget, urgency): Say "Perfect! Let me find the best matches for you!"

If missing info, ask for ONE thing:
- Missing service: "What service are you looking for?"
- Missing budget: "What's your budget?"
- Missing urgency: "When do you need this?"

Be warm and conversational."""

        try:
            response = self.model.generate_content(prompt)
            ai_response = response.text.strip()
        except Exception as e:
            self.logger.warning("Gemini error: %s", e)
            ai_response = None

            if self.fallback_llm:
                try:
                    fallback_response = self.fallback_llm.invoke(prompt)
                    ai_response = fallback_response.content.strip()
                except Exception as fallback_error:
                    self.logger.error("OpenAI fallback failed: %s", fallback_error)

            if not ai_response:
                if not has_service:
                    ai_response = "I'd love to help! What service are you looking for?"
                elif not has_budget:
                    ai_response = "Great! What's your budget?"
                elif not has_urgency:
                    ai_response = "Perfect! When do you need this?"
                else:
                    ai_response = "Perfect! Let me find the best matches for you!"
        
        # Determine next question
        next_question = None
        if not ready_to_match:
            if not has_service:
                next_question = "What service are you looking for?"
            elif not has_budget:
                next_question = "What's your budget?"
            elif not has_urgency:
                next_question = "When do you need this?"
        
        return {
            "preferences": preferences,
            "response": ai_response,
            "ready_to_match": ready_to_match,
            "next_question": next_question
        }
