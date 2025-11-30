'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthContextType } from '@/types'
import apiClient from '@/lib/api'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    const storedUser = localStorage.getItem('auth_user')
    if (!storedUser) return null
    try {
      return JSON.parse(storedUser)
    } catch (error) {
      console.error('Failed to parse stored user:', error)
      localStorage.removeItem('auth_user')
      return null
    }
  })

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  })

  // Start with loading true to prevent flicker/redirect race conditions
  const [loading, setLoading] = useState(true)

  // Set loading to false after initial hydration
  useEffect(() => {
    setLoading(false)
  }, [])

  // In case localStorage changes in another tab, sync token/user
  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('auth_token')
      const newUserRaw = localStorage.getItem('auth_user')

      setToken(newToken)
      if (newUserRaw) {
        try {
          setUser(JSON.parse(newUserRaw))
        } catch (error) {
          console.error('Failed to parse stored user:', error)
          localStorage.removeItem('auth_user')
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const loginWithGoogle = async (googleIdToken: string | null, accessToken: string | null = null) => {
    try {
      // Send Google ID token and/or access token to backend
      const response = await apiClient.post('/api/auth/google-login', {
        id_token: googleIdToken,
        access_token: accessToken
      })

      const { access_token, user: userData } = response.data

      // Store JWT token
      localStorage.setItem('auth_token', access_token)
      setToken(access_token)

      // Store user data
      localStorage.setItem('auth_user', JSON.stringify(userData))
      setUser(userData)

      return userData
    } catch (error: any) {
      console.error('Google login failed:', error)
      logout()
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  }

  const login = async (accessToken: string) => {
    try {
      // Store token
      localStorage.setItem('auth_token', accessToken)
      setToken(accessToken)

      // Fetch user profile
      const response = await apiClient.get<User>('/api/auth/me')
      const userData = response.data

      // Store user data
      localStorage.setItem('auth_user', JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error('Login failed:', error)
      logout()
      throw error
    }
  }

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')

    // Clear state
    setToken(null)
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user && !!token,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

