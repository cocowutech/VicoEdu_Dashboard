from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.types import Numeric
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from models.database import Base


class PreferenceSession(Base):
    """Preference session model for storing user conversation and extracted preferences"""
    __tablename__ = "preference_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    
    # Extracted preferences
    service_type = Column(String(50), nullable=True)
    budget_min = Column(Numeric(10, 2), nullable=True)
    budget_max = Column(Numeric(10, 2), nullable=True)
    time_urgency = Column(String(20), nullable=True)  # ASAP, today, week, flexible
    preferred_date = Column(String(10), nullable=True)  # ISO format: YYYY-MM-DD
    preferred_time = Column(String(5), nullable=True)  # 24h format: HH:MM
    time_constraint = Column(String(10), nullable=True)  # before, after, by
    artisan_preference = Column(Text, nullable=True)
    special_notes = Column(Text, nullable=True)
    
    # Conversation tracking
    conversation_history = Column(JSON, nullable=False, default=list)
    ready_to_match = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<PreferenceSession(id={self.id}, user_id={self.user_id}, service_type={self.service_type})>"

    def to_dict(self):
        """Convert preference session to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "session_id": self.session_id,
            "service_type": self.service_type,
            "budget_min": float(self.budget_min) if self.budget_min else None,
            "budget_max": float(self.budget_max) if self.budget_max else None,
            "time_urgency": self.time_urgency,
            "preferred_date": self.preferred_date,
            "preferred_time": self.preferred_time,
            "time_constraint": self.time_constraint,
            "artisan_preference": self.artisan_preference,
            "special_notes": self.special_notes,
            "conversation_history": self.conversation_history,
            "ready_to_match": self.ready_to_match,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

