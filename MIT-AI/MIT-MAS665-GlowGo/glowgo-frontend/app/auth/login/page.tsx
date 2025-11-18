'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import Button from '@/components/Button'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { loginWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('No credential received from Google')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Send Google ID token to backend
      await loginWithGoogle(credentialResponse.credential)
      
      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.')
    setIsLoading(false)
  }

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
        {/* Google Login - Real OAuth */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="filled_blue"
            size="large"
            text="continue_with"
            shape="rectangular"
            logo_alignment="left"
          />
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
