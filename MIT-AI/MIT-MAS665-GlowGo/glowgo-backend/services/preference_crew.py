"""
GlowGo Preference Gathering Crew - Multi-Agent Orchestrator
"""

import json
import re
from typing import Dict, Any, List
from crewai import Crew, Process

from services.crew_agents import (
    create_intent_recognition_agent,
    create_preference_extraction_agent,
    create_requirement_evaluator_agent,
    create_response_generator_agent,
    create_llm
)
from services.crew_tasks import (
    create_intent_recognition_task,
    create_preference_extraction_task,
    create_requirement_evaluation_task,
    create_response_generation_task
)


class GlowGoCrew:
    """
    Multi-agent crew for intelligent preference gathering
    
    This crew uses 4 specialized agents working together to:
    1. Understand user intent
    2. Extract structured preferences
    3. Evaluate completeness
    4. Generate natural responses
    """
    
    def __init__(self):
        """Initialize the crew with LLM configuration"""
        self.llm = create_llm()
        
        # Create agents
        self.intent_agent = create_intent_recognition_agent(self.llm)
        self.extraction_agent = create_preference_extraction_agent(self.llm)
        self.evaluator_agent = create_requirement_evaluator_agent(self.llm)
        self.response_agent = create_response_generator_agent(self.llm)
    
    def prepare_crew_context(
        self, 
        conversation_history: List[Dict], 
        current_preferences: Dict[str, Any]
    ) -> str:
        """
        Prepare context for crew execution
        
        Args:
            conversation_history: Previous messages
            current_preferences: Already extracted preferences
            
        Returns:
            str: Formatted context
        """
        context = "Current Preferences:\n"
        context += json.dumps(current_preferences, indent=2)
        context += "\n\nConversation History:\n"
        
        for msg in conversation_history[-5:]:  # Last 5 messages
            role = msg.get("role", "user").upper()
            content = msg.get("content", "")
            context += f"{role}: {content}\n"
        
        return context
    
    def parse_crew_output(self, crew_output: str) -> Dict[str, Any]:
        """
        Parse crew output to extract structured data
        
        Args:
            crew_output: Raw output from crew execution
            
        Returns:
            dict: Structured response data
        """
        result = {
            "service_type": None,
            "budget_min": None,
            "budget_max": None,
            "time_urgency": None,
            "artisan_preference": None,
            "special_notes": None,
            "ready_to_match": False,
            "response": "I'd love to help! What service are you looking for?",
            "next_question": "What service are you looking for?"
        }
        
        # Try to find JSON blocks in output
        json_blocks = re.findall(r'\{[^{}]*\}', crew_output, re.DOTALL)
        
        for block in json_blocks:
            try:
                data = json.loads(block)
                
                # Update result with extracted data
                if "service_type" in data and data["service_type"]:
                    result["service_type"] = data["service_type"]
                if "budget_min" in data and data["budget_min"]:
                    result["budget_min"] = float(data["budget_min"])
                if "budget_max" in data and data["budget_max"]:
                    result["budget_max"] = float(data["budget_max"])
                if "time_urgency" in data and data["time_urgency"]:
                    result["time_urgency"] = data["time_urgency"]
                if "artisan_preference" in data and data["artisan_preference"]:
                    result["artisan_preference"] = data["artisan_preference"]
                if "ready_to_match" in data:
                    result["ready_to_match"] = bool(data["ready_to_match"])
                if "next_question" in data and data["next_question"]:
                    result["next_question"] = data["next_question"]
                    
            except json.JSONDecodeError:
                continue
        
        # Extract natural language response (text not in JSON blocks)
        response_text = re.sub(r'\{[^{}]*\}', '', crew_output, flags=re.DOTALL)
        response_text = response_text.strip()
        
        # Clean up the response
        if response_text and len(response_text) > 10:
            result["response"] = response_text
        
        return result
    
    async def execute_preference_gathering(
        self,
        user_message: str,
        conversation_history: List[Dict[str, Any]],
        current_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute the multi-agent preference gathering workflow
        
        Args:
            user_message: User's current message
            conversation_history: Previous conversation messages
            current_preferences: Already extracted preferences
            
        Returns:
            dict: {
                "preferences": extracted preferences dict,
                "response": AI response text,
                "ready_to_match": bool,
                "next_question": str or None
            }
        """
        try:
            # Step 1: Create tasks for this conversation turn
            intent_task = create_intent_recognition_task(
                self.intent_agent,
                user_message
            )
            
            extraction_task = create_preference_extraction_task(
                self.extraction_agent,
                user_message,
                conversation_history
            )
            
            evaluation_task = create_requirement_evaluation_task(
                self.evaluator_agent,
                current_preferences
            )
            
            # We'll create response task after getting results
            
            # Step 2: Create crew with sequential process
            crew = Crew(
                agents=[
                    self.intent_agent,
                    self.extraction_agent,
                    self.evaluator_agent
                ],
                tasks=[
                    intent_task,
                    extraction_task,
                    evaluation_task
                ],
                process=Process.sequential,
                verbose=True
            )
            
            # Step 3: Execute crew
            crew_output = crew.kickoff()
            
            # Step 4: Parse crew output
            parsed_result = self.parse_crew_output(str(crew_output))
            
            # Step 5: Merge with current preferences
            merged_preferences = {**current_preferences}
            if parsed_result["service_type"]:
                merged_preferences["service_type"] = parsed_result["service_type"]
            if parsed_result["budget_min"]:
                merged_preferences["budget_min"] = parsed_result["budget_min"]
            if parsed_result["budget_max"]:
                merged_preferences["budget_max"] = parsed_result["budget_max"]
            if parsed_result["time_urgency"]:
                merged_preferences["time_urgency"] = parsed_result["time_urgency"]
            if parsed_result["artisan_preference"]:
                merged_preferences["artisan_preference"] = parsed_result["artisan_preference"]
            
            # Step 6: Determine ready_to_match
            has_service = merged_preferences.get("service_type") is not None
            has_budget = (
                merged_preferences.get("budget_min") is not None or
                merged_preferences.get("budget_max") is not None
            )
            has_urgency = merged_preferences.get("time_urgency") is not None
            
            ready_to_match = has_service and has_budget and has_urgency
            
            # Step 7: Generate response with response agent
            missing_fields = []
            if not has_service:
                missing_fields.append("service_type")
            if not has_budget:
                missing_fields.append("budget")
            if not has_urgency:
                missing_fields.append("time_urgency")
            
            response_task = create_response_generation_task(
                self.response_agent,
                user_message,
                merged_preferences,
                ready_to_match,
                missing_fields
            )
            
            response_crew = Crew(
                agents=[self.response_agent],
                tasks=[response_task],
                process=Process.sequential,
                verbose=False
            )
            
            response_output = response_crew.kickoff()
            final_response = str(response_output).strip()
            
            # Step 8: Determine next question
            next_question = None
            if not ready_to_match and missing_fields:
                question_map = {
                    "service_type": "What service are you looking for?",
                    "budget": "What's your budget?",
                    "time_urgency": "When do you need this?"
                }
                next_question = question_map.get(missing_fields[0])
            
            return {
                "preferences": merged_preferences,
                "response": final_response,
                "ready_to_match": ready_to_match,
                "next_question": next_question
            }
            
        except Exception as e:
            # Fallback on error
            print(f"CrewAI execution error: {str(e)}")
            
            return {
                "preferences": current_preferences,
                "response": "I'd love to help! What service are you looking for?",
                "ready_to_match": False,
                "next_question": "What service are you looking for?"
            }

