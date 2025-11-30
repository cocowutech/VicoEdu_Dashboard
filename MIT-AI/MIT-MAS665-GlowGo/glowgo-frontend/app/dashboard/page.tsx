'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Button from '@/components/Button'
import { useAuth } from '@/context/AuthContext'
import CalendarWidget from '@/components/Chat/CalendarWidget'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading, logout } = useAuth()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleFindServices = () => {
    router.push('/chat')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-card shadow-soft p-8 mb-8">
            <div className="flex items-center space-x-4 mb-6">
              {user.profile_photo_url && (
                <img
                  src={user.profile_photo_url}
                  alt={`${user.first_name} ${user.last_name}`}
                  className="w-20 h-20 rounded-full border-4 border-blush-100"
                />
              )}
              <div>
                <h1 className="text-3xl font-poppins font-bold text-gray-900">
                  Welcome back, {user.first_name}! 👋
                </h1>
                <p className="text-gray-700">{user.email}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-lg font-poppins font-semibold mb-4">Your Profile</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-gray-900 font-medium">{user.first_name} {user.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium">{user.email}</p>
                </div>
                {user.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900 font-medium">{user.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-gray-900 font-medium">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <Button variant="secondary" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <button
              type="button"
              onClick={handleFindServices}
              className="bg-white rounded-card shadow-soft p-6 text-center hover:shadow-soft-lg transition-shadow cursor-pointer w-full"
            >
              <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-lg font-poppins font-semibold mb-2">Find Services</h3>
              <p className="text-gray-700 text-sm">
                Chat with our AI to find your perfect beauty match
              </p>
            </button>

            <div className="bg-white rounded-card shadow-soft p-6 text-center hover:shadow-soft-lg transition-shadow cursor-pointer">
              <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <h3 className="text-lg font-poppins font-semibold mb-2">My Bookings</h3>
              <p className="text-gray-700 text-sm">
                View and manage your upcoming appointments
              </p>
            </div>

            <div className="bg-white rounded-card shadow-soft p-6 text-center hover:shadow-soft-lg transition-shadow cursor-pointer">
              <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-lg font-poppins font-semibold mb-2">Favorites</h3>
              <p className="text-gray-700 text-sm">
                Your saved providers and services
              </p>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="max-w-4xl mx-auto">
             <CalendarWidget />
          </div>

          {/* Coming Soon Banner */}
          <div className="mt-8 bg-blush-50 border border-blush-200 rounded-card p-6 text-center">
            <h3 className="text-xl font-poppins font-semibold text-blush-700 mb-2">
              🚀 More Features Coming Soon!
            </h3>
            <p className="text-blush-600">
              AI-powered matching, booking system, and personalized recommendations are on the way.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
