"""
CrewAI Agent Definitions for GlowGo Preference Gathering
"""

from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from config import settings, crew_config
from services.crew_tools import (
    service_category_matcher,
    budget_parser,
    urgency_classifier,
    preference_parser,
    requirement_validator,
    response_template_selector
)


def create_llm():
    """Create configured Gemini LLM for agents"""
    return ChatGoogleGenerativeAI(
        model=settings.GOOGLE_GEMINI_MODEL or crew_config.LLM_MODEL,
        google_api_key=settings.GOOGLE_GEMINI_API_KEY,
        temperature=crew_config.LLM_TEMPERATURE,
        max_tokens=crew_config.LLM_MAX_TOKENS
    )


def create_intent_recognition_agent(llm) -> Agent:
    """
    Agent 1: Intent Recognition Agent
    
    Specializes in understanding what service the user wants
    """
    return Agent(
        role="Service Intent Analyzer",
        goal="Understand what beauty/wellness service the user wants from their message",
        backstory="""You are an expert at identifying service types from natural language.
        You can understand when someone says 'I need a haircut', 'get my nails done', 
        'want a massage', etc. You're precise and confident in your classifications.""",
        tools=[service_category_matcher],
        llm=llm,
        verbose=True,
        allow_delegation=False
    )


def create_preference_extraction_agent(llm) -> Agent:
    """
    Agent 2: Preference Extraction Agent
    
    Specializes in extracting structured data from text
    """
    return Agent(
        role="Preference Data Extractor",
        goal="Extract structured preferences including budget, time urgency, and provider preferences from user messages",
        backstory="""You are an expert at parsing numbers and preferences from natural language.
        You can extract budget amounts like '$50', 'around $40', '$30-60 range'.
        You understand urgency like 'ASAP', 'today', 'this week', 'flexible'.
        You identify provider preferences like 'female stylist', 'experienced', 'open to anyone'.""",
        tools=[budget_parser, urgency_classifier, preference_parser],
        llm=llm,
        verbose=True,
        allow_delegation=False
    )


def create_requirement_evaluator_agent(llm) -> Agent:
    """
    Agent 3: Requirement Evaluator Agent
    
    Specializes in determining if we have enough information
    """
    return Agent(
        role="Requirements Checker",
        goal="Determine if we have enough information to find service provider matches",
        backstory="""You are a quality assurance expert who ensures completeness.
        You know that to match a user with a provider, we need at minimum:
        1. Service type (what they want)
        2. Budget (how much they can spend)
        3. Time urgency (when they need it)
        
        You're thorough and don't let incomplete information through.""",
        tools=[requirement_validator],
        llm=llm,
        verbose=True,
        allow_delegation=False
    )


def create_response_generator_agent(llm) -> Agent:
    """
    Agent 4: Response Generator Agent
    
    Specializes in creating natural, helpful responses
    """
    return Agent(
        role="Conversational Response Generator",
        goal="Create natural, friendly responses and ask the right follow-up questions",
        backstory="""You are an expert conversationalist who creates warm, helpful responses.
        You ask ONE question at a time to avoid overwhelming users.
        You're concise (1-2 sentences max) but friendly.
        When you have all the info needed, you say 'Perfect! Let me find the best matches for you!'
        You make users feel heard and excited about their booking.""",
        tools=[response_template_selector],
        llm=llm,
        verbose=True,
        allow_delegation=False
    )


def create_all_agents():
    """
    Create all agents for the preference gathering crew
    
    Returns:
        dict: Dictionary of all agents
    """
    llm = create_llm()
    
    return {
        "intent_agent": create_intent_recognition_agent(llm),
        "extraction_agent": create_preference_extraction_agent(llm),
        "evaluator_agent": create_requirement_evaluator_agent(llm),
        "response_agent": create_response_generator_agent(llm)
    }
