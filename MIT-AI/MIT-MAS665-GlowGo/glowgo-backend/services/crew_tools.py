"""
Custom tools for CrewAI agents to use in preference gathering
"""

import re
from typing import Dict, Any
from crewai.tools import tool


@tool("service_category_matcher")
def service_category_matcher(user_message: str) -> Dict[str, Any]:
    """
    Matches user input to beauty/wellness service categories
    
    Args:
        user_message: User's message
        
    Returns:
        dict: {service_type: str, confidence: float}
    """
    message_lower = user_message.lower()
    
    # Service category keywords
    categories = {
        "haircut": ["haircut", "hair cut", "trim", "barber", "stylist", "hair style"],
        "nails": ["nails", "manicure", "pedicure", "nail art", "gel nails"],
        "massage": ["massage", "deep tissue", "swedish", "hot stone", "body work"],
        "spa": ["spa", "spa day", "spa treatment", "relaxation"],
        "facial": ["facial", "face treatment", "skincare", "skin care"],
        "waxing": ["waxing", "wax", "hair removal"],
        "makeup": ["makeup", "make up", "cosmetics", "beauty makeup"],
        "cleaning": ["cleaning", "house cleaning", "home cleaning"],
    }
    
    # Find matches
    for category, keywords in categories.items():
        for keyword in keywords:
            if keyword in message_lower:
                return {
                    "service_type": category,
                    "confidence": 0.9
                }
    
    return {
        "service_type": None,
        "confidence": 0.0
    }


@tool("budget_parser")
def budget_parser(text_snippet: str) -> Dict[str, Any]:
    """
    Extracts budget amounts from text like '$50', '$30-50', 'around $40'
    
    Args:
        text_snippet: Text containing budget information
        
    Returns:
        dict: {budget_min: float, budget_max: float}
    """
    # Look for dollar amounts
    amounts = re.findall(r'\$?\s*(\d+(?:\.\d{2})?)', text_snippet)
    
    if not amounts:
        return {"budget_min": None, "budget_max": None}
    
    # Convert to floats
    numbers = [float(amt) for amt in amounts]
    
    # Check for range pattern
    if len(numbers) >= 2 and ("-" in text_snippet or "to" in text_snippet.lower()):
        return {
            "budget_min": min(numbers),
            "budget_max": max(numbers)
        }
    
    # Single amount
    amount = numbers[0]
    
    # Check for "around", "about"
    if any(word in text_snippet.lower() for word in ["around", "about", "approximately", "roughly"]):
        return {
            "budget_min": amount * 0.8,
            "budget_max": amount * 1.2
        }
    
    # Check for "up to", "max"
    if any(word in text_snippet.lower() for word in ["up to", "max", "maximum", "under"]):
        return {
            "budget_min": None,
            "budget_max": amount
        }
    
    # Check for "at least", "min"
    if any(word in text_snippet.lower() for word in ["at least", "min", "minimum", "over", "above"]):
        return {
            "budget_min": amount,
            "budget_max": None
        }
    
    # Default: treat as max budget
    return {
        "budget_min": None,
        "budget_max": amount
    }


@tool("urgency_classifier")
def urgency_classifier(text_snippet: str) -> Dict[str, Any]:
    """
    Classifies time urgency into ASAP, today, week, or flexible
    
    Args:
        text_snippet: Text containing urgency information
        
    Returns:
        dict: {time_urgency: str, confidence: float}
    """
    text_lower = text_snippet.lower()
    
    # ASAP patterns
    if any(word in text_lower for word in ["asap", "as soon as possible", "urgent", "emergency", "now", "immediately"]):
        return {"time_urgency": "ASAP", "confidence": 0.95}
    
    # Today patterns
    if any(word in text_lower for word in ["today", "this afternoon", "this evening", "tonight"]):
        return {"time_urgency": "today", "confidence": 0.9}
    
    # This week patterns
    if any(word in text_lower for word in ["this week", "next few days", "within a week", "soon"]):
        return {"time_urgency": "week", "confidence": 0.85}
    
    # Flexible patterns
    if any(word in text_lower for word in ["flexible", "whenever", "anytime", "no rush", "not urgent"]):
        return {"time_urgency": "flexible", "confidence": 0.9}
    
    return {"time_urgency": None, "confidence": 0.0}


@tool("preference_parser")
def preference_parser(text_snippet: str) -> Dict[str, Any]:
    """
    Extracts provider preferences like gender, experience level, etc.
    
    Args:
        text_snippet: Text containing preferences
        
    Returns:
        dict: {artisan_preference: str, confidence: float}
    """
    text_lower = text_snippet.lower()
    preferences = []
    
    # Gender preferences
    if "female" in text_lower or "woman" in text_lower:
        preferences.append("female")
    if "male" in text_lower or "man" in text_lower:
        preferences.append("male")
    
    # Experience preferences
    if any(word in text_lower for word in ["experienced", "senior", "veteran", "expert", "professional"]):
        preferences.append("experienced")
    if any(word in text_lower for word in ["new", "junior", "trainee"]):
        preferences.append("junior")
    
    # Openness
    if any(word in text_lower for word in ["open", "anyone", "no preference", "doesn't matter", "any"]):
        return {"artisan_preference": "open to anyone", "confidence": 0.9}
    
    if preferences:
        return {
            "artisan_preference": " ".join(preferences),
            "confidence": 0.85
        }
    
    return {"artisan_preference": None, "confidence": 0.0}


@tool("requirement_validator")
def requirement_validator(preferences: Dict[str, Any]) -> Dict[str, Any]:
    """
    Checks if we have minimum required preferences for matching
    
    Args:
        preferences: Current extracted preferences
        
    Returns:
        dict: {is_complete: bool, missing_fields: list, ready_to_match: bool}
    """
    required_fields = ["service_type", "budget", "time_urgency"]
    missing = []
    
    # Check service_type
    if not preferences.get("service_type"):
        missing.append("service_type")
    
    # Check budget (min OR max is sufficient)
    if not preferences.get("budget_min") and not preferences.get("budget_max"):
        missing.append("budget")
    
    # Check time_urgency
    if not preferences.get("time_urgency"):
        missing.append("time_urgency")
    
    is_complete = len(missing) == 0
    
    return {
        "is_complete": is_complete,
        "missing_fields": missing,
        "ready_to_match": is_complete
    }


@tool("response_template_selector")
def response_template_selector(preferences: Dict[str, Any], missing_fields: list) -> Dict[str, Any]:
    """
    Selects the best response template based on current state
    
    Args:
        preferences: Current preferences
        missing_fields: List of missing required fields
        
    Returns:
        dict: {response_type: str, next_question: str}
    """
    if not missing_fields:
        return {
            "response_type": "ready_to_match",
            "next_question": None
        }
    
    # Ask for first missing field
    next_field = missing_fields[0]
    
    templates = {
        "service_type": {
            "response_type": "ask_service",
            "next_question": "What service are you looking for?"
        },
        "budget": {
            "response_type": "ask_budget",
            "next_question": "What's your budget for this service?"
        },
        "time_urgency": {
            "response_type": "ask_urgency",
            "next_question": "When do you need this?"
        },
        "artisan_preference": {
            "response_type": "ask_preference",
            "next_question": "Any preferences for the provider?"
        }
    }
    
    return templates.get(next_field, {
        "response_type": "ask_general",
        "next_question": "Can you tell me more about what you're looking for?"
    })
