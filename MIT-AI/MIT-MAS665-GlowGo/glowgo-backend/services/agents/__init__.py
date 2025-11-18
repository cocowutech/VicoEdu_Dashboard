# Agents package for CrewAI multi-agent system
from services.agents.conversation_agent import ConversationAgent, conversation_agent
from services.agents.quality_assurance_agent import QualityAssuranceAgent, quality_assurance_agent
from services.agents.matching_agent import MatchingAgent, matching_agent
from services.agents.availability_agent import AvailabilityAgent, availability_agent

__all__ = [
    "ConversationAgent",
    "conversation_agent",
    "QualityAssuranceAgent",
    "quality_assurance_agent",
    "MatchingAgent",
    "matching_agent",
    "AvailabilityAgent",
    "availability_agent"
]

