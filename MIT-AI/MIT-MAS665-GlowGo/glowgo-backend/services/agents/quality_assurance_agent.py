"""
Quality Assurance Agent for GlowGo Preference Validation
Uses CrewAI framework with specialized QA tools
"""

from typing import Dict, Any, List
from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI

from config import settings, crew_config
from services.tools.qa_tools import (
    completeness_validator_tool,
    business_rule_checker_tool,
    data_quality_scorer_tool,
    anomaly_detector_tool,
    validation_report_tool
)


class QualityAssuranceAgent:
    """
    Data Quality and Validation Expert Agent
    
    Ensures all user preferences meet quality standards before matching
    """
    
    def __init__(self):
        """Initialize the Quality Assurance Agent"""
        # Configure LLM
        self.llm = ChatGoogleGenerativeAI(
            model=settings.GOOGLE_GEMINI_MODEL or crew_config.LLM_MODEL,
            google_api_key=settings.GOOGLE_GEMINI_API_KEY,
            temperature=crew_config.LLM_TEMPERATURE,
            max_tokens=crew_config.LLM_MAX_TOKENS
        )
        
        # Create CrewAI agent
        self.agent = Agent(
            name="Quality Assurance Agent",
            role="Data Quality and Validation Expert",
            goal="Ensure all user preferences meet quality standards before matching",
            backstory="""You are an expert at finding issues in data.
            You're a meticulous quality inspector who prevents bad data from affecting matches.
            You catch anomalies early and provide clear, actionable feedback.
            You ensure only high-quality, complete data proceeds to matching.""",
            tools=[],  # Tools called manually for better control
            llm=self.llm,
            max_iterations=crew_config.MAX_ITERATIONS,
            memory=crew_config.AGENT_MEMORY,
            verbose=crew_config.AGENT_VERBOSE,
            allow_delegation=False
        )
    
    async def execute(
        self,
        preferences: Dict[str, Any],
        business_rules: Dict[str, Any] = None,
        historical_patterns: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute quality assurance validation
        
        Args:
            preferences: User preferences to validate
            business_rules: Business rules to check against
            historical_patterns: Historical data for anomaly detection
            
        Returns:
            dict: {
                "validation_passed": bool,
                "quality_score": float,
                "issues": list,
                "warnings": list,
                "recommendations": list,
                "ready_to_proceed": bool
            }
        """
        try:
            # Step 1: Check Completeness
            completeness_result = completeness_validator_tool.execute({
                "preferences": preferences
            })
            
            # Step 2: Check Business Rules
            compliance_result = business_rule_checker_tool.execute({
                "preferences": preferences,
                "business_rules": business_rules or {}
            })
            
            # Step 3: Calculate Quality Score
            quality_result = data_quality_scorer_tool.execute({
                "preferences": preferences
            })
            
            # Step 4: Detect Anomalies
            anomaly_result = anomaly_detector_tool.execute({
                "current_data": preferences,
                "historical_patterns": historical_patterns or []
            })
            
            # Step 5: Generate Comprehensive Report
            report_result = validation_report_tool.execute({
                "all_validations": {
                    "completeness": completeness_result,
                    "compliance": compliance_result,
                    "quality": quality_result,
                    "anomaly": anomaly_result
                }
            })
            
            # Determine if ready to proceed
            ready_to_proceed = (
                report_result.get("passed", False) and
                quality_result.get("quality_score", 0) >= 70  # Minimum quality threshold
            )
            
            return {
                "validation_passed": report_result.get("passed", False),
                "quality_score": quality_result.get("quality_score", 0),
                "issues": report_result.get("issues", []),
                "warnings": compliance_result.get("warnings", []),
                "recommendations": report_result.get("recommendations", []),
                "ready_to_proceed": ready_to_proceed
            }
            
        except Exception as e:
            print(f"QualityAssuranceAgent execution error: {e}")
            import traceback
            traceback.print_exc()
            
            # Fallback - allow to proceed but flag issues
            return {
                "validation_passed": False,
                "quality_score": 0,
                "issues": [f"Validation error: {str(e)}"],
                "warnings": [],
                "recommendations": ["Please review the data"],
                "ready_to_proceed": False
            }


# Global agent instance
quality_assurance_agent = QualityAssuranceAgent()


