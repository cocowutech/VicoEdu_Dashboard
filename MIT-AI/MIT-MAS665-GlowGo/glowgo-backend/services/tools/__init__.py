# Tools package for CrewAI agents
from services.tools.conversation_tools import (
    IntentParserTool,
    PreferenceExtractorTool,
    ClarifyingQuestionGeneratorTool,
    ConversationContextManagerTool,
    ReadinessDetectorTool,
    intent_parser_tool,
    preference_extractor_tool,
    clarifying_question_generator_tool,
    conversation_context_manager_tool,
    readiness_detector_tool
)

from services.tools.matching_tools import (
    ServiceFilterTool,
    LocationFilterTool,
    BudgetFilterTool,
    AvailabilityFilterTool,
    ProviderStatusCheckerTool,
    CandidateAggregatorTool,
    service_filter_tool,
    location_filter_tool,
    budget_filter_tool,
    availability_filter_tool,
    provider_status_checker_tool,
    candidate_aggregator_tool
)

from services.tools.availability_tools import (
    CalendarQueryTool,
    WorkingHoursCheckerTool,
    TimezoneConverterTool,
    SlotFinderTool,
    AlternativeSuggesterTool,
    DoubleBookingPreventorTool,
    calendar_query_tool,
    working_hours_checker_tool,
    timezone_converter_tool,
    slot_finder_tool,
    alternative_suggester_tool,
    double_booking_preventor_tool
)

__all__ = [
    # Conversation tools
    "IntentParserTool",
    "PreferenceExtractorTool",
    "ClarifyingQuestionGeneratorTool",
    "ConversationContextManagerTool",
    "ReadinessDetectorTool",
    "intent_parser_tool",
    "preference_extractor_tool",
    "clarifying_question_generator_tool",
    "conversation_context_manager_tool",
    "readiness_detector_tool",
    # Matching tools
    "ServiceFilterTool",
    "LocationFilterTool",
    "BudgetFilterTool",
    "AvailabilityFilterTool",
    "ProviderStatusCheckerTool",
    "CandidateAggregatorTool",
    "service_filter_tool",
    "location_filter_tool",
    "budget_filter_tool",
    "availability_filter_tool",
    "provider_status_checker_tool",
    "candidate_aggregator_tool",
    # Availability tools
    "CalendarQueryTool",
    "WorkingHoursCheckerTool",
    "TimezoneConverterTool",
    "SlotFinderTool",
    "AlternativeSuggesterTool",
    "DoubleBookingPreventorTool",
    "calendar_query_tool",
    "working_hours_checker_tool",
    "timezone_converter_tool",
    "slot_finder_tool",
    "alternative_suggester_tool",
    "double_booking_preventor_tool"
]



