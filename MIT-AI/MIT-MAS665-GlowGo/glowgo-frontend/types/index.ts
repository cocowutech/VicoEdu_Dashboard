// User Types
export interface User {
  id: string  // UUID from backend
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  google_id?: string
  profile_photo_url?: string
  created_at?: string
  updated_at?: string
}

// Auth Types
export interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string) => Promise<void>
  loginWithGoogle: (googleIdToken: string) => Promise<User>
  logout: () => void
  isAuthenticated: boolean
  loading: boolean
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  detail: string
  message?: string
  errors?: Record<string, string[]>
}

// Service Provider Types
export interface ServiceProvider {
  id: number
  business_name: string
  description: string
  services: string[]
  rating: number
  reviews_count: number
  location: string
  price_range: string
  image_url?: string
}

// Booking Types
export interface Booking {
  id: number
  user_id: number
  provider_id: number
  service: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
}

// Preference Types
export interface UserPreferences {
  service_type: string[]
  budget_range: string
  location: string
  preferred_time: string[]
  special_requirements?: string
}

// Chat Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}


