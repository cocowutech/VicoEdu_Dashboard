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
    readiness_detector_tool,
    extract_location_with_llm,
    detect_time_suggestion_acceptance
)
from services.crews.data_collection_crew import data_collection_crew
from services.tools.data_collection_tools import merchant_storage_tool
import asyncio
import json

from services.tools.calendar_tools import google_calendar_tool, analyze_calendar_for_smart_suggestions

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
        current_preferences: Dict[str, Any],
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Execute conversation agent workflow
        
        Args:
            user_message: User's current message
            conversation_history: Previous messages
            current_preferences: Already extracted preferences
            user_id: Optional User ID to check calendar availability
            
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

            # Step 0.5: Check if user is accepting a time suggestion from previous message
            last_assistant_message = ""
            if conversation_history and len(conversation_history) > 0:
                # Get the last assistant message
                for msg in reversed(conversation_history):
                    if msg.get("role") == "assistant":
                        last_assistant_message = msg.get("content", "")
                        break

            time_acceptance = detect_time_suggestion_acceptance(
                user_message=user_message,
                last_assistant_message=last_assistant_message
            )

            # Track if time was just accepted (for special acknowledgment)
            time_just_accepted = False
            accepted_time_display = ""

            if time_acceptance.get("accepted"):
                print(f"\n[ConversationAgent] User accepted time suggestion!")
                print(f"[ConversationAgent] Accepted time: {time_acceptance}")
                time_just_accepted = True

                # Update current preferences with the accepted time
                if time_acceptance.get("suggested_date"):
                    current_preferences["preferred_date"] = time_acceptance["suggested_date"]
                    print(f"[ConversationAgent] Set preferred_date to: {time_acceptance['suggested_date']}")
                    # Format for display
                    try:
                        from datetime import datetime as dt
                        d = dt.fromisoformat(time_acceptance["suggested_date"])
                        accepted_time_display = d.strftime("%A, %B %d")
                    except:
                        accepted_time_display = time_acceptance["suggested_date"]

                if time_acceptance.get("suggested_time"):
                    current_preferences["preferred_time"] = time_acceptance["suggested_time"]
                    print(f"[ConversationAgent] Set preferred_time to: {time_acceptance['suggested_time']}")
                    # Add time to display
                    try:
                        from datetime import datetime as dt
                        t = dt.strptime(time_acceptance["suggested_time"], "%H:%M")
                        accepted_time_display += f" at {t.strftime('%I:%M %p')}"
                    except:
                        accepted_time_display += f" at {time_acceptance['suggested_time']}"

                if time_acceptance.get("day_before_event"):
                    # Store this as a special note
                    current_preferences["special_notes"] = f"Day before {time_acceptance['day_before_event']}"
                    print(f"[ConversationAgent] Set special_notes to: {current_preferences['special_notes']}")

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
            
            # Preserve location if already found
            if current_preferences.get("location"):
                print(f"[ConversationAgent] Preserving existing location: {current_preferences.get('location')}")
            
            preference_result = preference_extractor_tool.execute({
                "message": user_message,
                "current_preferences": current_preferences
            })
            print(f"[ConversationAgent] Preference result: {preference_result}")

            # Merge extracted preferences
            # Use explicit None checks so that valid falsy values (e.g., 0 for budget_min) are preserved
            extracted_preferences = {
                "service_type": preference_result.get("service_type")
                if preference_result.get("service_type") is not None
                else current_preferences.get("service_type"),
                "budget_min": preference_result.get("budget_min")
                if preference_result.get("budget_min") is not None
                else current_preferences.get("budget_min"),
                "budget_max": preference_result.get("budget_max")
                if preference_result.get("budget_max") is not None
                else current_preferences.get("budget_max"),
                "time_urgency": preference_result.get("time_urgency")
                if preference_result.get("time_urgency") is not None
                else current_preferences.get("time_urgency"),
                "artisan_preference": preference_result.get("artisan_preference")
                if preference_result.get("artisan_preference") is not None
                else current_preferences.get("artisan_preference"),
                "special_notes": preference_result.get("special_notes")
                if preference_result.get("special_notes") is not None
                else current_preferences.get("special_notes"),
                "preferred_date": preference_result.get("preferred_date")
                if preference_result.get("preferred_date") is not None
                else current_preferences.get("preferred_date"),
                "preferred_time": preference_result.get("preferred_time")
                if preference_result.get("preferred_time") is not None
                else current_preferences.get("preferred_time"),
                "time_constraint": preference_result.get("time_constraint")
                if preference_result.get("time_constraint") is not None
                else current_preferences.get("time_constraint"),
                "location": preference_result.get("location")
                if preference_result.get("location") is not None
                else current_preferences.get("location"),
            }

            # Step 2.5: Use LLM for dynamic location extraction (supports any place in Boston/NYC)
            print(f"\n[ConversationAgent] Step 2.5: LLM-based location extraction")
            try:
                llm_location = await extract_location_with_llm(
                    text=user_message,
                    llm=self.llm,
                    current_location=extracted_preferences.get("location")
                )
                if llm_location:
                    print(f"[ConversationAgent] LLM extracted location: {llm_location}")
                    extracted_preferences["location"] = llm_location
            except Exception as e:
                print(f"[ConversationAgent] LLM location extraction failed: {e}")
                # Continue with rule-based extraction result

            # Handle ambiguous location - needs clarification
            location_ambiguous = False
            location_value = extracted_preferences.get("location") or ""
            if location_value.startswith("AMBIGUOUS:"):
                location_ambiguous = True
                ambiguous_type = extracted_preferences["location"].split(":")[1]
                extracted_preferences["location"] = None  # Clear so it shows as missing
                print(f"[ConversationAgent] Ambiguous location detected: {ambiguous_type}")
            
            # Double-check location persistence (but not if we just detected ambiguity)
            if current_preferences.get("location") and not extracted_preferences.get("location") and not location_ambiguous:
                print(f"[ConversationAgent] Restoring lost location: {current_preferences.get('location')}")
                extracted_preferences["location"] = current_preferences.get("location")
                
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
            
            # Step 3.5: Check Calendar Availability if time is mentioned
            calendar_context = ""
            if user_id and extracted_preferences.get("preferred_date"):
                print(f"\n[ConversationAgent] Checking calendar for user {user_id}")
                try:
                    calendar_check = await asyncio.to_thread(
                        google_calendar_tool._run,
                        {
                            "user_id": user_id,
                            "date": extracted_preferences.get("preferred_date"),
                            "time": extracted_preferences.get("preferred_time")
                        }
                    )
                    if "Error" not in calendar_check:
                        calendar_context = f"\n\nCALENDAR CHECK: {calendar_check}"
                        print(f"[ConversationAgent] Calendar info: {calendar_context}")
                except Exception as e:
                    print(f"[ConversationAgent] Calendar check failed: {e}")

            # Step 4: Generate Response
            # Initialize providers list for potential return
            found_providers = []

            if ready_to_match:
                # We have all required info! Trigger live search
                print(f"\n[ConversationAgent] Ready to match! Triggering live search...")

                service_type = extracted_preferences.get("service_type", "beauty salon")
                base_location = extracted_preferences.get("location", "Boston, MA")

                # Refine location using LLM to catch specific addresses (e.g. "53 Wheeler St")
                search_location = base_location
                try:
                    # Determine state context based on location
                    if "NY" in base_location or "New York" in base_location:
                        state_context = "NY, USA"
                    else:
                        state_context = "MA, USA"

                    # Add state context if not already present
                    if "MA" not in base_location and "NY" not in base_location and "USA" not in base_location:
                        context_location = f"{base_location}, {state_context}"
                    else:
                        context_location = base_location

                    refine_prompt = f"""Extract the exact search location from this message for a map search.
                    Message: "{user_message}"
                    Context: User is looking for {service_type} in {context_location}.
                    If they mentioned a specific street, address, or landmark, return that combined with the city and state.
                    If not, just return "{context_location}".
                    IMPORTANT: For Massachusetts locations, append ", MA, USA". For New York locations, append ", NY, USA". Do NOT return UK locations.
                    Return ONLY the location string."""
                    
                    refined = await self.llm.ainvoke(refine_prompt)
                    clean_loc = refined.content.strip().strip('"').strip("'")
                    if clean_loc:
                        search_location = clean_loc
                        print(f"[ConversationAgent] Refined location: {search_location}")
                    else:
                         search_location = context_location
                         
                except Exception as e:
                    print(f"[ConversationAgent] Location refinement failed: {e}")
                    # Add state context if missing
                    if "MA" not in search_location and "NY" not in search_location:
                        if "new york" in search_location.lower() or "nyc" in search_location.lower():
                            search_location = f"{search_location}, NY, USA"
                        else:
                            search_location = f"{search_location}, MA, USA"

                # 1. Collect providers from Yelp & Google
                search_results = await data_collection_crew.collect_providers(
                    location=search_location,
                    service_categories=[service_type],
                    limit_per_category=5  # Keep it focused for chat
                )
                
                providers = search_results.get("providers", [])
                found_providers = providers  # Store for returning to frontend
                print(f"[ConversationAgent] Found {len(providers)} providers")
                
                # 2. Update database
                saved_count = 0
                for provider in providers:
                    try:
                        # Run synchronous storage tool in thread
                        await asyncio.to_thread(merchant_storage_tool._run, provider)
                        saved_count += 1
                    except Exception as e:
                        print(f"Error saving provider {provider.get('business_name')}: {e}")
                        
                print(f"[ConversationAgent] Saved/Updated {saved_count} providers to database")

                # 3. Generate response with options
                # Create a context string with the found providers (top 3 only)
                options_text = ""
                for i, p in enumerate(providers[:3], 1):
                    source = p.get('data_source', 'unknown').replace('_', ' ').title()
                    options_text += f"{i}. {p.get('business_name')} ({p.get('rating')}★) - {p.get('address')} [Source: {source}]\n"

                response_prompt = f"""You are GlowGo. The user asked for {service_type} in {search_location}.
We found these options online (verified live):

{options_text}

Please present these options to the user.
CRITICAL INSTRUCTIONS:
1. Keep the response concise and to the point. Avoid unnecessary filler words.
2. Do NOT use markdown bolding (**) or italics (*) for the business names or any other text. Just write the names normally.
3. Mention briefly that we checked online sources (Google/Yelp) and updated our database.
4. Do NOT ask if they want to refine the search. Assume they want to book one of these.
5. Ask simply "Would you like to book an appointment?"
"""
                
                try:
                    gemini_response = self.llm.invoke(response_prompt)
                    response_to_user = gemini_response.content.strip()
                except Exception as e:
                    self.logger.warning("Gemini response generation error: %s", e)
                    response_to_user = f"I found {len(providers)} options for you:\n\n{options_text}\n\nWould you like to book one of these?"

                next_question = None
            else:
                # Need more info - generate clarifying question
                # If location was ambiguous, prioritize asking for clarification
                if location_ambiguous:
                    missing_fields_adjusted = ["location_ambiguous_cambridge"] + [f for f in missing_fields if f != "location"]
                else:
                    missing_fields_adjusted = missing_fields

                question_result = clarifying_question_generator_tool.execute({
                    "current_preferences": extracted_preferences,
                    "missing_fields": missing_fields_adjusted
                })

                # Smart calendar analysis when asking about time
                smart_calendar_suggestion = ""
                print(f"\n[ConversationAgent] Calendar check - time_info in missing: {'time_info' in missing_fields}, user_id: {user_id}, service_type: {extracted_preferences.get('service_type')}")
                if "time_info" in missing_fields and user_id and extracted_preferences.get("service_type"):
                    print(f"[ConversationAgent] ✓ All conditions met! Analyzing calendar for smart time suggestions...")
                    try:
                        calendar_analysis = await analyze_calendar_for_smart_suggestions(
                            user_id=user_id,
                            service_type=extracted_preferences.get("service_type"),
                            target_date=extracted_preferences.get("preferred_date"),
                            llm=self.llm
                        )

                        if calendar_analysis.get("has_calendar"):
                            smart_calendar_suggestion = calendar_analysis.get("smart_suggestion", "")
                            print(f"[ConversationAgent] Smart suggestion: {smart_calendar_suggestion}")

                            # If there are important events coming up, suggest day-before
                            if calendar_analysis.get("day_before_suggestions"):
                                day_before = calendar_analysis["day_before_suggestions"][0]
                                print(f"[ConversationAgent] Important event detected: {day_before['event_name']}")
                    except Exception as e:
                        print(f"[ConversationAgent] Calendar analysis failed: {e}")

                time_info_parts = []
                if extracted_preferences.get('preferred_date'):
                    # Format date nicely if it's ISO format
                    try:
                        d = datetime.fromisoformat(extracted_preferences.get('preferred_date'))
                        formatted_date = d.strftime("%A, %B %d")
                        time_info_parts.append(f"Date: {formatted_date}")
                    except:
                        time_info_parts.append(f"Date: {extracted_preferences.get('preferred_date')}")

                if extracted_preferences.get('preferred_time'):
                    # Format time nicely
                    try:
                        t = datetime.strptime(extracted_preferences.get('preferred_time'), "%H:%M")
                        formatted_time = t.strftime("%I:%M %p")
                        time_info_parts.append(f"Time: {formatted_time}")
                    except:
                        time_info_parts.append(f"Time: {extracted_preferences.get('preferred_time')}")

                if extracted_preferences.get('time_constraint'):
                    time_info_parts.append(f"Constraint: {extracted_preferences.get('time_constraint')}")
                if extracted_preferences.get('time_urgency'):
                    time_info_parts.append(f"Urgency: {extracted_preferences.get('time_urgency')}")

                time_display = ', '.join(time_info_parts) if time_info_parts else 'not specified'

                # Include smart calendar suggestion in prompt if available
                calendar_prompt_section = ""
                if smart_calendar_suggestion:
                    calendar_prompt_section = f"""
SMART CALENDAR INSIGHT:
{smart_calendar_suggestion}

Use this calendar information to make a personalized time suggestion. If there's an important event mentioned,
suggest booking the service the day before so the user looks their best for the event.
"""

                # Special handling when time was just accepted
                time_acceptance_section = ""
                if time_just_accepted and accepted_time_display:
                    time_acceptance_section = f"""
TIME JUST CONFIRMED:
The user just confirmed the appointment time: {accepted_time_display}
You MUST acknowledge this confirmation first with something like "Perfect! I've got you down for {accepted_time_display}!"
Then ask the next question.
"""

                prompt = f"""You are GlowGo, a friendly AI assistant helping users find beauty services in Boston, Cambridge (MA), and New York City.

CURRENT DATE/TIME: {current_date} at {current_time}
{calendar_context}
{calendar_prompt_section}
{time_acceptance_section}

User said: "{user_message}"

We extracted:
- Service: {extracted_preferences.get('service_type') or 'not specified'}
- Budget: ${extracted_preferences.get('budget_max') or 'not specified'}
- When: {time_display}
- Location: {extracted_preferences.get('location') or 'not specified'}

We need to ask: {question_result.get('question')}

Generate a FRIENDLY response that:
1. If TIME JUST CONFIRMED section exists, FIRST acknowledge the time confirmation enthusiastically, then ask the next question
2. If calendar insight is available and time is NOT yet set, use it to suggest a specific time slot between their events OR suggest the day before an important event
3. Example for calendar suggestion: "I see from your calendar you have a class at MIT at 10am and your next meeting is at 1pm. How about 11:00 AM - that gives you time for your haircut with 30 minutes buffer on each side!"
4. If there's an important event (wedding, interview, date, etc.), suggest: "I noticed you have [event] on [date]! Would you like to book your [service] for [day before] so you look amazing for it?"
5. If no calendar insight and time is not set, just ask the time question naturally
6. Be warm and conversational.

Keep it concise but personalized."""

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
                "conversation_context": context_result.get("summary", ""),
                "found_providers": found_providers  # Providers found from Yelp/Google
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


