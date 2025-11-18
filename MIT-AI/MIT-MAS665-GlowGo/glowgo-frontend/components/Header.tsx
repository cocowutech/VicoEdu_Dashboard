'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Button from './Button'

export default function Header() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Only render user-specific content after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blush-500 rounded-full flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <span className="text-2xl font-poppins font-bold text-gray-900">
              GlowGo
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/services" className="text-gray-700 hover:text-blush-600 transition-colors">
              Services
            </Link>
            <Link href="/providers" className="text-gray-700 hover:text-blush-600 transition-colors">
              Providers
            </Link>
            <Link href="/how-it-works" className="text-gray-700 hover:text-blush-600 transition-colors">
              How It Works
            </Link>
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {!mounted ? (
              // Placeholder during SSR/hydration
              <div className="w-24 h-10" />
            ) : user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <div className="w-10 h-10 bg-blush-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-blush-200 transition-colors">
                  <span className="text-sm font-semibold text-blush-700">
                    {user.first_name?.[0] || user.email[0].toUpperCase()}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-blush-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/services"
                className="text-gray-700 hover:text-blush-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/providers"
                className="text-gray-700 hover:text-blush-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Providers
              </Link>
              <Link
                href="/how-it-works"
                className="text-gray-700 hover:text-blush-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <div className="pt-4 border-t border-gray-100">
                {!mounted ? (
                  <div className="h-12" />
                ) : user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" size="md" fullWidth>
                        Dashboard
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" size="md" fullWidth>
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}


