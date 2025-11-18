-- Migration: Add time constraint fields to preference_sessions table
-- Date: 2025-11-15
-- Description: Adds preferred_date, preferred_time, and time_constraint columns

-- Add new columns
ALTER TABLE preference_sessions
ADD COLUMN IF NOT EXISTS preferred_date VARCHAR(10),
ADD COLUMN IF NOT EXISTS preferred_time VARCHAR(5),
ADD COLUMN IF NOT EXISTS time_constraint VARCHAR(10);

-- Add comments for documentation
COMMENT ON COLUMN preference_sessions.preferred_date IS 'Preferred date in ISO format (YYYY-MM-DD)';
COMMENT ON COLUMN preference_sessions.preferred_time IS 'Preferred time in 24h format (HH:MM)';
COMMENT ON COLUMN preference_sessions.time_constraint IS 'Time constraint: before, after, or by';
