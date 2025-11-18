import { ExtractedPreferences, MerchantOption, ChatMessage } from "@/types/booking";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatApiResponse {
  ready_to_match: boolean;
  extracted_preferences: ExtractedPreferences;
  response_to_user: string;
  next_question?: string;
}

export interface MatchesApiResponse {
  ranked_options: MerchantOption[];
  total_options_found: number;
  search_summary: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: string;
}

/**
 * Post a chat message to gather preferences
 *
 * @param message - User's message
 * @param history - Conversation history
 * @param preferences - Current extracted preferences
 * @returns Chat response with preferences and bot message
 */
export async function postChatMessage(
  message: string,
  history: ChatMessage[] = [],
  preferences: ExtractedPreferences = {}
): Promise<ChatApiResponse> {
  try {
    // Get auth token from localStorage (stored as 'auth_token')
    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add Authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/preferences/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: message,
        session_id: null, // Let backend create new session or use existing
      }),
    });

    const data = await response.json().catch(() => {
      throw new Error("Invalid response from server");
    });

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Failed to process message");
    }

    const chatResponse: ChatApiResponse = {
      ready_to_match: Boolean(data.ready_to_match),
      extracted_preferences: data.extracted_preferences || {},
      response_to_user: data.response_to_user || data.response,
      next_question: data.next_question,
    };

    if (!chatResponse.response_to_user) {
      throw new Error("Invalid response format from server");
    }

    return chatResponse;
  } catch (error) {
    const parsedError = handleApiError(error);
    console.error("Error in postChatMessage:", parsedError);
    throw parsedError;
  }
}

/**
 * Fetch matching merchants based on user preferences
 *
 * @param preferences - User preferences for matching
 * @returns Ranked merchant options
 */
export async function fetchMatchingResults(
  preferences: ExtractedPreferences
): Promise<MatchesApiResponse> {
  try {
    // Get auth token from localStorage (stored as 'auth_token')
    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add Authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/api/matches/find`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        preferences,
      }),
    });

    const data = await response.json().catch(() => {
      throw new Error("Invalid response from server");
    });

    if (!response.ok) {
      throw new Error(data?.error || data?.message || "Failed to find matches");
    }

    if (!data.ranked_options || !Array.isArray(data.ranked_options)) {
      throw new Error("Invalid response format from server");
    }

    return {
      ranked_options: data.ranked_options,
      total_options_found: data.total_options_found ?? data.ranked_options.length,
      search_summary: data.search_summary ?? "",
    };
  } catch (error) {
    const parsedError = handleApiError(error);
    console.error("Error in fetchMatchingResults:", parsedError);
    throw parsedError;
  }
}

/**
 * Handle API errors and convert to user-friendly messages
 *
 * @param error - Error object from API call
 * @returns ApiError with user-friendly message
 */
export function handleApiError(error: unknown): ApiError {
  if ((error as ApiError)?.message) {
    return error as ApiError;
  }

  if (error instanceof Response) {
    const status = error.status;
    return {
      message: status >= 500
        ? "Server error. Please try again later."
        : "Request failed. Please try again.",
      status,
    };
  }

  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return {
      message: "Unable to connect to server. Please check your internet connection.",
      status: 0,
    };
  }

  if (error instanceof Error) {
    const errorMessage = error.message || "An unexpected error occurred. Please try again.";
    return {
      message: errorMessage,
      details: errorMessage,
    };
  }

  return {
    message: "An unexpected error occurred. Please try again.",
  };
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param delay - Initial delay in ms
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes("4")) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError!;
}

/**
 * Check if the API is reachable
 *
 * @returns True if API is reachable, false otherwise
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: "GET",
    });

    return response.ok;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
}

/**
 * Get the current API base URL
 *
 * @returns API base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE;
}
