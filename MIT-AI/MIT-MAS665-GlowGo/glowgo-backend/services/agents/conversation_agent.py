"""
Conversation Agent for GlowGo Preference Gathering
Uses CrewAI framework with specialized tools
"""

from typing import Dict, Any, List
from datetime import datetime
import logging
from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from config import settings, crew_config
from services.tools.conversation_tools import (
    intent_parser_tool,
    preference_extractor_tool,
    clarifying_question_generator_tool,
    conversation_context_manager_tool,
    readiness_detector_tool
)


class ConversationAgent:
    """
    Multi-turn Conversation Manager Agent
    
    Orchestrates preference gathering through natural dialogue
    using specialized tools for each aspect of the conversation.
    """
    
    def __init__(self):
        """Initialize the Conversation Agent with LLM and tools"""
        # Configure primary Gemini LLM
        self.llm = ChatGoogleGenerativeAI(
            model=settings.GOOGLE_GEMINI_MODEL or crew_config.LLM_MODEL,
            google_api_key=settings.GOOGLE_GEMINI_API_KEY,
            temperature=crew_config.LLM_TEMPERATURE,
            max_tokens=crew_config.LLM_MAX_TOKENS,
            max_retries=getattr(crew_config, "LLM_MAX_RETRIES", 0)
        )

        # Optional OpenAI fallback
        self.fallback_llm = None
        if settings.OPENAI_API_KEY:
            self.fallback_llm = ChatOpenAI(
                model=settings.OPENAI_MODEL or crew_config.OPENAI_FALLBACK_MODEL,
                api_key=settings.OPENAI_API_KEY,
                temperature=crew_config.LLM_TEMPERATURE,
                max_tokens=crew_config.LLM_MAX_TOKENS
            )

        self.logger = logging.getLogger(__name__)
        
        # Create CrewAI agent
        self.agent = Agent(
            name="Conversation Agent",
            role="Multi-turn Conversation Manager",
            goal="Naturally gather complete user preferences through dialogue",
            backstory="""You are an expert at understanding user intent and preferences.
            You're skilled at asking clarifying questions naturally.
            You make users feel heard and understood.
            You know when you have enough information to help them find what they need.""",
            tools=[],  # Tools will be called manually for better control
            llm=self.llm,
            max_iterations=crew_config.MAX_ITERATIONS,
            memory=crew_config.AGENT_MEMORY,
            verbose=crew_config.AGENT_VERBOSE,
            allow_delegation=False
        )
    
    async def execute(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        current_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute conversation agent workflow
        
        Args:
            user_message: User's current message
            conversation_history: Previous messages
            current_preferences: Already extracted preferences
            
        Returns:
            dict: {
                "extracted_preferences": dict,
                "response_to_user": str,
                "ready_to_match": bool,
                "next_question": str or None,
                "conversation_context": str
            }
        """
        try:
            # Get current date/time for context
            now = datetime.now()
            current_date = now.strftime("%A, %B %d, %Y")  # e.g., "Thursday, November 15, 2025"
            current_time = now.strftime("%I:%M %p")  # e.g., "5:30 PM"

            # Step 1: Parse Intent (identify service type)
            print(f"\n[ConversationAgent] Step 1: Parsing intent from message: '{user_message}'")
            print(f"[ConversationAgent] Current preferences before intent parsing: {current_preferences}")

            intent_result = intent_parser_tool.execute({
                "message": user_message
            })
            print(f"[ConversationAgent] Intent result: {intent_result}")

            service_type = intent_result.get("service_type")
            if service_type:
                current_preferences["service_type"] = service_type
                print(f"[ConversationAgent] Updated service_type to: {service_type}")

            print(f"[ConversationAgent] Current preferences after intent parsing: {current_preferences}")

            # Step 2: Extract Preferences (budget, urgency, provider pref)
            print(f"\n[ConversationAgent] Step 2: Extracting preferences")
            preference_result = preference_extractor_tool.execute({
                "message": user_message,
                "current_preferences": current_preferences
            })
            print(f"[ConversationAgent] Preference result: {preference_result}")

            # Merge extracted preferences
            extracted_preferences = {
                "service_type": preference_result.get("service_type") or current_preferences.get("service_type"),
                "budget_min": preference_result.get("budget_min") or current_preferences.get("budget_min"),
                "budget_max": preference_result.get("budget_max") or current_preferences.get("budget_max"),
                "time_urgency": preference_result.get("time_urgency") or current_preferences.get("time_urgency"),
                "artisan_preference": preference_result.get("artisan_preference") or current_preferences.get("artisan_preference"),
                "special_notes": preference_result.get("special_notes") or current_preferences.get("special_notes"),
                "preferred_date": preference_result.get("preferred_date") or current_preferences.get("preferred_date"),
                "preferred_time": preference_result.get("preferred_time") or current_preferences.get("preferred_time"),
                "time_constraint": preference_result.get("time_constraint") or current_preferences.get("time_constraint")
            }
            print(f"[ConversationAgent] Merged extracted_preferences: {extracted_preferences}")
            
            # Step 3: Check Readiness (do we have enough info?)
            print(f"\n[ConversationAgent] Step 3: Checking readiness")
            readiness_result = readiness_detector_tool.execute({
                "current_preferences": extracted_preferences
            })
            print(f"[ConversationAgent] Readiness result: {readiness_result}")

            ready_to_match = readiness_result.get("ready_to_match", False)
            missing_fields = readiness_result.get("missing_fields", [])
            print(f"[ConversationAgent] Ready to match: {ready_to_match}, Missing: {missing_fields}")
            
            # Step 4: Generate Response
            if ready_to_match:
                # We have all required info!
                response_to_user = "Perfect! Let me find the best matches for you!"
                next_question = None
            else:
                # Need more info - generate clarifying question
                question_result = clarifying_question_generator_tool.execute({
                    "current_preferences": extracted_preferences,
                    "missing_fields": missing_fields
                })
                
                # Use Gemini to make the question more natural
                # Show ALL time-related info
                time_info_parts = []
                if extracted_preferences.get('preferred_date'):
                    time_info_parts.append(f"Date: {extracted_preferences.get('preferred_date')}")
                if extracted_preferences.get('preferred_time'):
                    time_info_parts.append(f"Time: {extracted_preferences.get('preferred_time')}")
                if extracted_preferences.get('time_constraint'):
                    time_info_parts.append(f"Constraint: {extracted_preferences.get('time_constraint')}")
                if extracted_preferences.get('time_urgency'):
                    time_info_parts.append(f"Urgency: {extracted_preferences.get('time_urgency')}")

                time_display = ', '.join(time_info_parts) if time_info_parts else 'not specified'

                prompt = f"""You are GlowGo, a friendly AI assistant.

CURRENT DATE/TIME: {current_date} at {current_time}

User said: "{user_message}"

We extracted:
- Service: {extracted_preferences.get('service_type') or 'not specified'}
- Budget: ${extracted_preferences.get('budget_max') or 'not specified'}
- When: {time_display}

We need to ask: {question_result.get('question')}

Generate a SHORT (1-2 sentences), FRIENDLY response that:
1. Acknowledges what they said
2. Asks the next question naturally
3. Uses the current date/time context if relevant (e.g., if they say "today" and it's Thursday, you know that's Thursday)

Be warm and conversational."""

                response_to_user = None

                # Try Gemini first, then OpenAI fallback
                try:
                    gemini_response = self.llm.invoke(prompt)
                    response_to_user = gemini_response.content.strip()
                except Exception as e:
                    self.logger.warning("Gemini response generation error: %s", e)
                    if self.fallback_llm:
                        try:
                            fallback_response = self.fallback_llm.invoke(prompt)
                            response_to_user = fallback_response.content.strip()
                        except Exception as fallback_error:
                            self.logger.error("OpenAI fallback failed: %s", fallback_error)
                
                if not response_to_user:
                    response_to_user = f"Great! {question_result.get('question')}"
                
                next_question = question_result.get("field")
            
            # Step 5: Build Conversation Context
            context_result = conversation_context_manager_tool.execute({
                "conversation_history": conversation_history,
                "extracted_data": extracted_preferences
            })

            final_result = {
                "extracted_preferences": extracted_preferences,
                "response_to_user": response_to_user,
                "ready_to_match": ready_to_match,
                "next_question": next_question,
                "conversation_context": context_result.get("summary", "")
            }
            print(f"\n[ConversationAgent] Final result: {final_result}\n")

            return final_result
            
        except Exception as e:
            print(f"ConversationAgent execution error: {e}")
            import traceback
            traceback.print_exc()
            
            # Fallback response
            return {
                "extracted_preferences": current_preferences,
                "response_to_user": "I'd love to help! What service are you looking for?",
                "ready_to_match": False,
                "next_question": "service_type",
                "conversation_context": ""
            }


# Global agent instance
conversation_agent = ConversationAgent()


