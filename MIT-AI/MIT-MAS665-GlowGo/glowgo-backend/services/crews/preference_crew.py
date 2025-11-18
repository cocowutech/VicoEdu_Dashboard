"""
Preference Crew for GlowGo
Orchestrates ConversationAgent and QualityAssuranceAgent to gather and validate user preferences
"""

from typing import Dict, Any, List, Optional
import logging

from services.agents.conversation_agent import conversation_agent
from services.agents.quality_assurance_agent import quality_assurance_agent


# Configure logging
logger = logging.getLogger(__name__)


class PreferenceCrew:
    """
    Orchestrates conversation and quality assurance agents to gather complete,
    validated user preferences for beauty service matching.

    The crew follows a two-stage process:
    1. Conversation Agent: Gathers preferences through natural dialogue
    2. Quality Assurance Agent: Validates completeness and quality when ready
    """

    def __init__(self):
        """Initialize the Preference Crew with both agents"""
        self.conversation_agent = conversation_agent
        self.qa_agent = quality_assurance_agent
        logger.info("PreferenceCrew initialized with ConversationAgent and QualityAssuranceAgent")

    async def run(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        current_preferences: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Orchestrate agents to gather and validate user preferences

        Args:
            user_message: User's current message
            conversation_history: List of previous messages in conversation
            current_preferences: Already extracted preferences from previous turns

        Returns:
            dict: {
                "ready_to_match": bool,
                "extracted_preferences": {
                    "service_type": str,
                    "budget_min": float,
                    "budget_max": float,
                    "time_urgency": str,
                    "location": str,
                    ...
                },
                "response_to_user": str,
                "next_question": str or None,
                "conversation_context": str
            }
        """
        # Initialize defaults
        if conversation_history is None:
            conversation_history = []
        if current_preferences is None:
            current_preferences = {}

        try:
            # ======================================================================
            # STEP 1: Run Conversation Agent
            # ======================================================================
            logger.info(f"Running ConversationAgent with message: {user_message[:50]}...")

            conversation_result = await self.conversation_agent.execute(
                user_message=user_message,
                conversation_history=conversation_history,
                current_preferences=current_preferences
            )

            # Extract conversation agent outputs
            extracted_preferences = conversation_result.get("extracted_preferences", {})
            response_to_user = conversation_result.get("response_to_user", "")
            ready_to_match = conversation_result.get("ready_to_match", False)
            next_question = conversation_result.get("next_question")
            conversation_context = conversation_result.get("conversation_context", "")

            logger.info(f"ConversationAgent result - ready_to_match: {ready_to_match}")

            # ======================================================================
            # STEP 2: Check if ready for matching
            # ======================================================================
            if not ready_to_match:
                # Not ready yet - return with next question
                logger.info(f"Not ready to match. Next question: {next_question}")
                return {
                    "ready_to_match": False,
                    "extracted_preferences": extracted_preferences,
                    "response_to_user": response_to_user,
                    "next_question": next_question,
                    "conversation_context": conversation_context
                }

            # ======================================================================
            # STEP 3: Run Quality Assurance Agent
            # ======================================================================
            logger.info("Running QualityAssuranceAgent for validation...")

            qa_result = await self.qa_agent.execute(
                preferences=extracted_preferences,
                business_rules={},  # Can be expanded with business rules
                historical_patterns=[]  # Can be expanded with historical data
            )

            validation_passed = qa_result.get("validation_passed", False)
            ready_to_proceed = qa_result.get("ready_to_proceed", False)
            issues = qa_result.get("issues", [])
            quality_score = qa_result.get("quality_score", 0)

            logger.info(f"QA validation - passed: {validation_passed}, score: {quality_score}")

            # ======================================================================
            # STEP 4: Return final result
            # ======================================================================
            if not ready_to_proceed:
                # QA found issues - need clarification
                logger.warning(f"QA validation failed. Issues: {issues}")

                # Generate clarification message
                clarification_message = self._generate_clarification_message(
                    issues=issues,
                    quality_score=quality_score
                )

                return {
                    "ready_to_match": False,
                    "extracted_preferences": extracted_preferences,
                    "response_to_user": clarification_message,
                    "next_question": "clarification_needed",
                    "conversation_context": conversation_context
                }

            # All validations passed - ready to match!
            logger.info("All validations passed. Ready to match!")
            return {
                "ready_to_match": True,
                "extracted_preferences": extracted_preferences,
                "response_to_user": response_to_user,
                "next_question": None,
                "conversation_context": conversation_context
            }

        except Exception as e:
            # ======================================================================
            # ERROR HANDLING
            # ======================================================================
            logger.error(f"PreferenceCrew execution error: {e}", exc_info=True)

            # Return user-friendly error with fallback response
            return {
                "ready_to_match": False,
                "extracted_preferences": current_preferences,
                "response_to_user": "I'm having trouble processing that. Could you tell me what service you're looking for?",
                "next_question": "service_type",
                "conversation_context": ""
            }

    def _generate_clarification_message(
        self,
        issues: List[str],
        quality_score: float
    ) -> str:
        """
        Generate a user-friendly clarification message based on QA issues

        Args:
            issues: List of validation issues
            quality_score: Quality score from QA agent

        Returns:
            str: User-friendly clarification message
        """
        if not issues:
            return "I need a bit more information to find the best match for you."

        # Take the first issue and make it user-friendly
        first_issue = issues[0]

        # Common issue patterns and their user-friendly versions
        if "budget" in first_issue.lower():
            return "Could you clarify your budget range? For example, 'around $50' or '$30-$60'."
        elif "time" in first_issue.lower() or "urgency" in first_issue.lower():
            return "When would you like your appointment? For example, 'today', 'this week', or 'next Monday'."
        elif "service" in first_issue.lower():
            return "What service are you looking for? For example, 'haircut', 'manicure', or 'facial'."
        elif "location" in first_issue.lower():
            return "Where would you like to get this service? Please share your location or preferred area."
        else:
            # Generic fallback
            return "I need a bit more information to help you find the perfect match. Could you provide more details?"


# Global crew instance
preference_crew = PreferenceCrew()
