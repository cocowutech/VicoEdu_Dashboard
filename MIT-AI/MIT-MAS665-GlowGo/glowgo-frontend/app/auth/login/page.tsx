'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoogleLogin } from '@react-oauth/google'
import Button from '@/components/Button'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { loginWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      setError(null)
      try {
        console.log('[LOGIN] Google access token received')
        // Send Access Token to backend (id_token is null)
        const userData = await loginWithGoogle(null, tokenResponse.access_token)
        console.log('[LOGIN] Login successful, user:', userData)
        console.log('[LOGIN] Redirecting to /chat...')
        router.push('/chat')
      } catch (err: any) {
        console.error('[LOGIN] Login error:', err)
        setError(err.message || 'Failed to login. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.')
      setIsLoading(false)
    },
    scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
    flow: 'implicit' // returns access_token
  })

  const handlePhoneLogin = () => {
    setError('Phone login coming soon!')
  }

  const handleEmailLogin = () => {
    setError('Email login coming soon!')
  }

  return (
    <div className="bg-white rounded-card shadow-soft-lg p-8 md:p-10">
      {/* Logo/Branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blush-500 rounded-full mb-4">
          <span className="text-3xl">✨</span>
        </div>
        <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-2">
          Welcome to GlowGo
        </h1>
        <p className="text-gray-700">
          Sign in to discover your perfect beauty match
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-button text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blush-50 border border-blush-200 rounded-button text-blush-700 text-sm text-center">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing you in...
          </div>
        </div>
      )}

      {/* Login Options */}
      <div className="space-y-4">
        {/* Google Login - Custom Button using useGoogleLogin */}
        <div className="flex justify-center">
          <Button
            variant="secondary" // Use secondary to look similar to Google button (white/gray)
            size="lg"
            fullWidth
            onClick={() => googleLogin()}
            disabled={isLoading}
            className="flex items-center justify-center border border-gray-300 !text-gray-700 hover:!bg-gray-50"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Phone Login (Coming Soon) */}
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handlePhoneLogin}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Continue with Phone
        </Button>

        {/* Email Login (Coming Soon) */}
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={handleEmailLogin}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Continue with Email
        </Button>
      </div>

      {/* Terms */}
      <p className="mt-8 text-center text-sm text-gray-500">
        By continuing, you agree to GlowGo&apos;s{' '}
        <a href="#" className="text-blush-600 hover:text-blush-700 underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-blush-600 hover:text-blush-700 underline">
          Privacy Policy
        </a>
      </p>
    </div>
  )
}
