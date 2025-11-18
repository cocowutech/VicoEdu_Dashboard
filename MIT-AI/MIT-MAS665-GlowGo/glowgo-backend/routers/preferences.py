"""
Preferences router for AI-powered preference gathering using CrewAI
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import logging

from schemas.preferences import ChatRequest, ChatResponse, PreferenceSchema
from models.preferences import PreferenceSession
from models.user import User
from utils.db import get_db
from utils.auth import get_current_user
from services.crews.preference_crew import preference_crew
from services.crews.matching_crew import matching_crew

router = APIRouter(tags=["preferences"])

# Configure logging
logger = logging.getLogger(__name__)

# Use the PreferenceCrew (orchestrates ConversationAgent + QualityAssuranceAgent)
crew = preference_crew


@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={
        401: {"description": "Unauthorized - invalid or missing token"},
        500: {"description": "Server error"}
    }
)
async def chat_preferences(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI-powered chat endpoint for gathering user preferences using PreferenceCrew

    This endpoint uses PreferenceCrew which orchestrates:
    1. ConversationAgent - Gathers preferences through natural dialogue
    2. QualityAssuranceAgent - Validates completeness and quality when ready
    
    Flow:
    1. Get or create preference session
    2. Load conversation history and current preferences
    3. Execute CrewAI multi-agent workflow
    4. Agents collaborate to extract preferences
    5. Update session in database
    6. Return AI response and extracted preferences
    
    Args:
        request: ChatRequest with user message and optional session_id
        current_user: Authenticated user (from JWT token)
        db: Database session
        
    Returns:
        ChatResponse with AI response, preferences, and ready_to_match status
        
    Raises:
        HTTPException: If AI service fails or database error occurs
    """
    try:
        # Step 1: Get or create preference session
        if request.session_id:
            # Continue existing session
            session = db.query(PreferenceSession).filter(
                PreferenceSession.session_id == request.session_id,
                PreferenceSession.user_id == current_user.id
            ).first()
            
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found"
                )
        else:
            # Create new session
            session_id = str(uuid.uuid4())
            session = PreferenceSession(
                user_id=current_user.id,
                session_id=session_id,
                conversation_history=[]
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        
        # Step 2: Get conversation history and current preferences
        conversation_history = session.conversation_history or []
        
        current_preferences = {
            "service_type": session.service_type,
            "budget_min": float(session.budget_min) if session.budget_min else None,
            "budget_max": float(session.budget_max) if session.budget_max else None,
            "time_urgency": session.time_urgency,
            "preferred_date": session.preferred_date,
            "preferred_time": session.preferred_time,
            "time_constraint": session.time_constraint,
            "artisan_preference": session.artisan_preference,
            "special_notes": session.special_notes
        }
        
        # Step 3: Add user message to history
        user_message_entry = {
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow().isoformat()
        }
        conversation_history.append(user_message_entry)
        
        # Step 4: Execute PreferenceCrew
        crew_result = await crew.run(
            user_message=request.message,
            conversation_history=conversation_history[:-1],  # Exclude current message
            current_preferences=current_preferences
        )
        
        # Step 5: Extract results from crew
        updated_preferences = crew_result["extracted_preferences"]
        ai_response = crew_result["response_to_user"]
        ready_to_match = crew_result["ready_to_match"]
        next_question = crew_result.get("next_question")

        # Initialize matching results as None
        ranked_matches = None
        total_matches_found = None
        search_summary = None

        # Step 5.5: If ready to match, automatically trigger matching crew with timeout
        if ready_to_match:
            try:
                logger.info("User is ready to match. Triggering MatchingCrew automatically...")

                # Build preferences dict for matching crew
                preferences_for_matching = {
                    "service_type": updated_preferences.get("service_type"),
                    "budget_min": updated_preferences.get("budget_min"),
                    "budget_max": updated_preferences.get("budget_max"),
                    "time_urgency": updated_preferences.get("time_urgency", "flexible"),
                    "preferred_date": updated_preferences.get("preferred_date"),
                    "preferred_time": updated_preferences.get("preferred_time"),
                    "time_constraint": updated_preferences.get("time_constraint"),
                    "artisan_preference": updated_preferences.get("artisan_preference"),
                    "special_notes": updated_preferences.get("special_notes")
                }

                # Execute matching crew with timeout (60 seconds max)
                import asyncio
                try:
                    matching_result = await asyncio.wait_for(
                        matching_crew.run(
                            preferences=preferences_for_matching,
                            location="Cambridge, MA"  # Default location, can be enhanced later
                        ),
                        timeout=60.0  # 60 second timeout
                    )

                    # Extract matching results
                    ranked_matches = matching_result.get("ranked_options", [])
                    total_matches_found = matching_result.get("total_options_found", 0)
                    search_summary = matching_result.get("search_summary", "")

                    # Update AI response to include match results
                    if ranked_matches:
                        ai_response = (
                            f"{ai_response}\n\n{search_summary}\n\n"
                            f"I found {total_matches_found} great options for you!"
                        )
                    else:
                        ai_response = (
                            f"{ai_response}\n\n"
                            f"I searched for matches but couldn't find any providers at the moment. "
                            f"You might want to try adjusting your preferences."
                        )

                    logger.info(f"MatchingCrew found {total_matches_found} matches")

                except asyncio.TimeoutError:
                    logger.warning("MatchingCrew timed out after 60 seconds")
                    ai_response = (
                        f"{ai_response}\n\n"
                        f"Finding matches is taking longer than expected. "
                        f"Please click 'See Matches' to view your results."
                    )

            except Exception as matching_error:
                logger.error(f"Error during automatic matching: {matching_error}", exc_info=True)
                # Don't fail the whole request - just continue without matches
                ai_response = (
                    f"{ai_response}\n\n"
                    f"I'm ready to find matches for you! Click 'See Matches' to view your results."
                )

        # Step 6: Update session with new preferences
        if updated_preferences.get("service_type"):
            session.service_type = updated_preferences["service_type"]
        if updated_preferences.get("budget_min"):
            session.budget_min = updated_preferences["budget_min"]
        if updated_preferences.get("budget_max"):
            session.budget_max = updated_preferences["budget_max"]
        if updated_preferences.get("time_urgency"):
            session.time_urgency = updated_preferences["time_urgency"]
        if updated_preferences.get("preferred_date"):
            session.preferred_date = updated_preferences["preferred_date"]
        if updated_preferences.get("preferred_time"):
            session.preferred_time = updated_preferences["preferred_time"]
        if updated_preferences.get("time_constraint"):
            session.time_constraint = updated_preferences["time_constraint"]
        if updated_preferences.get("artisan_preference"):
            session.artisan_preference = updated_preferences["artisan_preference"]
        if updated_preferences.get("special_notes"):
            session.special_notes = updated_preferences["special_notes"]
        
        # Update ready_to_match status
        session.ready_to_match = ready_to_match
        
        # Step 7: Add AI response to conversation history
        assistant_message_entry = {
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.utcnow().isoformat()
        }
        conversation_history.append(assistant_message_entry)
        
        # Step 8: Save updated conversation history
        session.conversation_history = conversation_history
        session.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(session)
        
        # Step 9: Build response
        return ChatResponse(
            success=True,
            session_id=session.session_id,
            preferences=PreferenceSchema(
                service_type=session.service_type,
                budget_min=float(session.budget_min) if session.budget_min else None,
                budget_max=float(session.budget_max) if session.budget_max else None,
                time_urgency=session.time_urgency,
                preferred_date=session.preferred_date,
                preferred_time=session.preferred_time,
                time_constraint=session.time_constraint,
                artisan_preference=session.artisan_preference,
                special_notes=session.special_notes
            ),
            response=ai_response,
            ready_to_match=ready_to_match,
            next_question=next_question,
            ranked_matches=ranked_matches,
            total_matches_found=total_matches_found,
            search_summary=search_summary
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
        
    except Exception as e:
        # Log error
        logger.error(f"Error in chat preferences: {str(e)}", exc_info=True)

        # Rollback transaction
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}"
        )


@router.get(
    "/session/{session_id}",
    response_model=dict,
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Session not found"}
    }
)
async def get_preference_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get preference session details
    
    Args:
        session_id: Session UUID
        current_user: Authenticated user
        db: Database session
        
    Returns:
        dict: Session data with preferences and conversation history
    """
    session = db.query(PreferenceSession).filter(
        PreferenceSession.session_id == session_id,
        PreferenceSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return session.to_dict()

