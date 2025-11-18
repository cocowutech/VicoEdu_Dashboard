'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Button from '@/components/Button'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, loading, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Track when component is mounted on client
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Redirect to login if not authenticated
    if (mounted && !loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, mounted, router])

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  // Always render the full structure to prevent hydration mismatch
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12 md:py-20">
        {/* Show loading state while checking auth */}
        {(!mounted || loading) && (
          <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
              <p className="text-gray-700">Loading...</p>
            </div>
          </div>
        )}

        {/* Show content once mounted and authenticated */}
        {mounted && !loading && isAuthenticated && user && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-card shadow-soft p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {user.profile_photo_url && (
                    <img
                      src={user.profile_photo_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="w-16 h-16 rounded-full border-4 border-blush-100"
                    />
                  )}
                  <div>
                    <h1 className="text-3xl md:text-4xl font-poppins font-bold text-gray-900">
                      Welcome, {user.first_name}! 👋
                    </h1>
                    <p className="text-gray-700">{user.email}</p>
                  </div>
                </div>
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-poppins font-bold text-gray-900 mb-6">
              Discover Your Perfect
              <span className="block text-blush-500">Beauty & Wellness Match</span>
            </h2>
            
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              AI-powered recommendations to connect you with the best beauty and wellness providers tailored to your unique needs.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <a href="/chat" className="bg-white p-8 rounded-card shadow-soft text-center hover:shadow-soft-lg transition-shadow cursor-pointer">
              <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-xl font-poppins font-semibold mb-3">Start Chat</h3>
              <p className="text-gray-700">
                Chat with our AI to find your perfect beauty match
              </p>
            </a>

            <div className="bg-white p-8 rounded-card shadow-soft text-center hover:shadow-soft-lg transition-shadow cursor-pointer">
              <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="text-xl font-poppins font-semibold mb-3">My Bookings</h3>
              <p className="text-gray-700">
                View and manage your upcoming appointments
              </p>
            </div>

            <div className="bg-white p-8 rounded-card shadow-soft text-center hover:shadow-soft-lg transition-shadow cursor-pointer">
              <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-xl font-poppins font-semibold mb-3">Favorites</h3>
              <p className="text-gray-700">
                Your saved providers and services
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-card shadow-soft text-center">
              <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-poppins font-semibold mb-3">AI-Powered Matching</h3>
              <p className="text-gray-700">
                Our smart algorithm finds providers that perfectly match your preferences and needs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-card shadow-soft text-center">
              <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-xl font-poppins font-semibold mb-3">Easy Booking</h3>
              <p className="text-gray-700">
                Book appointments seamlessly with real-time availability and instant confirmation.
              </p>
            </div>

            <div className="bg-white p-8 rounded-card shadow-soft text-center">
              <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-xl font-poppins font-semibold mb-3">Trusted Providers</h3>
              <p className="text-gray-700">
                All providers are verified and rated by our community for your peace of mind.
              </p>
            </div>
          </div>

            {/* Coming Soon Banner */}
            <div className="mt-12 bg-blush-50 border border-blush-200 rounded-card p-6 text-center">
              <h3 className="text-xl font-poppins font-semibold text-blush-700 mb-2">
                🚀 More Features Coming Soon!
              </h3>
              <p className="text-blush-600">
                AI-powered matching, booking system, and personalized recommendations are on the way.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-700">
          <p>&copy; 2025 GlowGo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
