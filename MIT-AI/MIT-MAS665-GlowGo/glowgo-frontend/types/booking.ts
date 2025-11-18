/**
 * TypeScript types for GlowGo booking flow
 */

export type ChatMessage = {
  role: "user" | "bot";
  content: string;
  timestamp?: string;
};

export type ExtractedPreferences = {
  service_type?: string;
  budget_min?: number;
  budget_max?: number;
  time_urgency?: string;
  location?: string;
  artisan_preference?: string;
  special_notes?: string;
};

export type MerchantOption = {
  rank: number;
  merchant_id?: string;
  merchant_name: string;
  service_name?: string;
  service_type?: string;
  distance?: number;
  price: number;
  rating: number;
  reviews: number;
  available_times: string[];
  why_recommended: string;
  relevance_score: number;
};

export type ChatResponse = {
  success: boolean;
  session_id: string;
  preferences: ExtractedPreferences;
  response: string;
  ready_to_match: boolean;
  next_question?: string;
};

export type FindMatchesResponse = {
  success: boolean;
  ranked_options: MerchantOption[];
  total_options_found: number;
  search_summary: string;
};

export type BookingStep = "chat" | "searching" | "results";
