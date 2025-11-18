export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export interface Preference {
  service_type?: string | null
  budget_min?: number | null
  budget_max?: number | null
  time_urgency?: string | null
  preferred_date?: string | null
  preferred_time?: string | null
  time_constraint?: string | null
  artisan_preference?: string | null
  special_notes?: string | null
}

export interface ChatResponse {
  success: boolean
  session_id: string
  preferences: Preference
  response: string
  ready_to_match: boolean
  next_question?: string | null
  ranked_matches?: any[] | null
  total_matches_found?: number | null
  search_summary?: string | null
}

export interface ChatRequest {
  message: string
  session_id?: string | null
}



