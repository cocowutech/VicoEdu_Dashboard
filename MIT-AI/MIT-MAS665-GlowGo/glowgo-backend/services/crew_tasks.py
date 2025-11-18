"""
CrewAI Task Definitions for GlowGo Preference Gathering
"""

from crewai import Task


def create_intent_recognition_task(agent, user_message: str) -> Task:
    """
    Task 1: Intent Recognition
    
    Analyze user message to identify what service they want
    """
    return Task(
        description=f"""Analyze this user message and identify the service type they're looking for:
        
        User message: "{user_message}"
        
        Use the service_category_matcher tool to identify the service category.
        Service categories include: haircut, nails, massage, spa, facial, waxing, makeup, cleaning.
        
        If the service type is clear, extract it with high confidence.
        If unclear, return null with low confidence.""",
        expected_output="""JSON object with:
        {
          "service_type": "haircut" or null,
          "confidence": 0.95
        }""",
        agent=agent
    )


def create_preference_extraction_task(agent, user_message: str, conversation_history: list) -> Task:
    """
    Task 2: Preference Extraction
    
    Extract budget, urgency, and provider preferences from message
    """
    history_context = "\n".join([
        f"{msg.get('role', 'user').upper()}: {msg.get('content', '')}"
        for msg in conversation_history[-3:]  # Last 3 messages for context
    ]) if conversation_history else "No previous conversation"
    
    return Task(
        description=f"""Extract structured preferences from this conversation:
        
        Previous context:
        {history_context}
        
        Current user message: "{user_message}"
        
        Use your tools to extract:
        1. Budget (use budget_parser tool) - Look for dollar amounts like $50, $30-60, around $40
        2. Time urgency (use urgency_classifier tool) - Look for ASAP, today, this week, flexible
        3. Provider preference (use preference_parser tool) - Look for gender, experience level, etc.
        
        Extract what's present in the message. Return null for missing information.""",
        expected_output="""JSON object with:
        {
          "budget_min": 30.0 or null,
          "budget_max": 60.0 or null,
          "time_urgency": "ASAP" or null,
          "artisan_preference": "experienced female" or null,
          "special_notes": "any special requirements" or null
        }""",
        agent=agent
    )


def create_requirement_evaluation_task(agent, current_preferences: dict) -> Task:
    """
    Task 3: Requirement Evaluation
    
    Check if we have enough information for matching
    """
    return Task(
        description=f"""Evaluate if we have enough information to match the user with service providers.
        
        Current extracted preferences:
        {current_preferences}
        
        Use the requirement_validator tool to check completeness.
        
        Minimum required for matching:
        1. service_type (what service)
        2. budget (budget_min OR budget_max)
        3. time_urgency (when they need it)
        
        Determine if we're ready to match or need more information.""",
        expected_output="""JSON object with:
        {
          "is_complete": true or false,
          "missing_fields": ["service_type", "budget"] or [],
          "ready_to_match": true or false
        }""",
        agent=agent
    )


def create_response_generation_task(
    agent, 
    user_message: str,
    extracted_data: dict,
    ready_to_match: bool,
    missing_fields: list
) -> Task:
    """
    Task 4: Response Generation
    
    Create natural conversational response
    """
    return Task(
        description=f"""Generate a natural, friendly response to the user.
        
        User said: "{user_message}"
        
        What we extracted: {extracted_data}
        Ready to match: {ready_to_match}
        Missing fields: {missing_fields}
        
        Use the response_template_selector tool to determine what to say next.
        
        If ready_to_match is True:
        - Say something like: "Perfect! Let me find the best matches for you!"
        - Be excited and positive
        
        If ready_to_match is False:
        - Ask for the FIRST missing field only
        - Be friendly and conversational
        - Keep it SHORT (1-2 sentences max)
        - Don't overwhelm with multiple questions
        
        Examples of good responses:
        - "Great! What's your budget for this service?"
        - "Perfect! When do you need this?"
        - "Got it! Any preferences for the provider?"
        - "Excellent! Let me find the best matches for you!"
        
        Be warm, helpful, and concise.""",
        expected_output="""Natural language response (1-2 sentences) that either:
        1. Asks for the next missing piece of information, OR
        2. Confirms we're ready to find matches""",
        agent=agent
    )

