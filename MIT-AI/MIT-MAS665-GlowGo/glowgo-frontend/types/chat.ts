import { ExtractedPreferences } from "./booking";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// Align chat preference type with booking preferences to avoid drift
export type Preference = ExtractedPreferences;

export interface ChatResponse {
  success: boolean;
  session_id: string;
  preferences: Preference;
  response: string;
  ready_to_match: boolean;
  next_question?: string | null;
  ranked_matches?: any[] | null;
  total_matches_found?: number | null;
  search_summary?: string | null;
}

export interface ChatRequest {
  message: string;
  session_id?: string | null;
}


