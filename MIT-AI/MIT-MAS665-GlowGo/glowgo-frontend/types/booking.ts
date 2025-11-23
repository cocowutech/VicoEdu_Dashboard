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

  // Enhanced fields for real provider data
  photo_url?: string;
  photos?: string[];
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  price_range?: string; // $, $$, $$$, $$$$
  specialties?: string[];
  stylist_names?: string[];
  booking_url?: string;
  bio?: string;
  yelp_url?: string;
};

// Service within a grouped provider
export type ServiceOption = {
  service_name: string;
  price: number;
  booking_url?: string;
};

// Provider with grouped services
export type GroupedProvider = {
  merchant_id: string;
  merchant_name: string;
  photo_url?: string;
  photos?: string[];
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  price_range?: string;
  specialties?: string[];
  stylist_names?: string[];
  rating: number;
  reviews: number;
  distance?: number;
  why_recommended: string;
  relevance_score: number;
  yelp_url?: string;
  booking_url?: string;
  services: ServiceOption[];
  rank: number;
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
