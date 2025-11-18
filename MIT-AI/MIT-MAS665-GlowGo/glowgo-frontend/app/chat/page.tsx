'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useChat } from '@/hooks/useChat'
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission'
import Header from '@/components/Header'
import ChatContainer from '@/components/Chat/ChatContainer'
import ChatInput from '@/components/Chat/ChatInput'
import PreferenceSummary from '@/components/Chat/PreferenceSummary'
import MatchesDisplay from '@/components/Chat/MatchesDisplay'
import MicrophoneStatus from '@/components/Chat/MicrophoneStatus'
import { fetchMatchingResults } from '@/services/bookingApi'
import { MerchantOption } from '@/types/booking'

export default function ChatPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const {
    messages,
    preferences,
    isLoading,
    readyToMatch,
    error,
    sendMessage,
    sendVoiceMessage,
    sendVoiceGreeting,
    isProcessingVoice,
    setAudioCompleteCallback,
    rankedMatches
  } = useChat()

  // Microphone permission management
  const { permissionState, requestPermission } = useMicrophonePermission()

  // State for matches display
  const [showMatches, setShowMatches] = useState(false)
  const [matches, setMatches] = useState<MerchantOption[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchesError, setMatchesError] = useState<string | null>(null)
  const [searchSummary, setSearchSummary] = useState('')
  const [mounted, setMounted] = useState(false)

  // Function to fetch and display matches
  const handleSeeMatches = async () => {
    try {
      setMatchesLoading(true)
      setMatchesError(null)

      const result = await fetchMatchingResults(preferences)

      setMatches(result.ranked_options)
      setSearchSummary(result.search_summary)
      setShowMatches(true)
    } catch (err: any) {
      console.error('Error fetching matches:', err)
      setMatchesError(err.message || 'Failed to fetch matches')
    } finally {
      setMatchesLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Automatically display matches when received from backend
  useEffect(() => {
    if (rankedMatches && rankedMatches.length > 0) {
      console.log('[CHAT] Auto-displaying matches:', rankedMatches.length)
      setMatches(rankedMatches)
      setShowMatches(true)
      // Set search summary if available
      if (rankedMatches.length > 0) {
        setSearchSummary(`Found ${rankedMatches.length} great matches for you!`)
      }
    }
  }, [rankedMatches])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Main Chat Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="border-b border-gray-200 p-4 bg-white">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-poppins font-bold text-gray-900">
                Find Your Perfect Match ✨
              </h1>
              <p className="text-gray-700 text-sm mt-1">
                Tell me what you&apos;re looking for and I&apos;ll help you find the best providers
              </p>
            </div>
          </div>

          {/* Microphone Permission Status */}
          <div className="max-w-4xl mx-auto w-full px-4 pt-4">
            <MicrophoneStatus
              permissionState={permissionState}
              onRequestPermission={requestPermission}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-4xl mx-auto w-full px-4 pt-4">
              <div className="bg-red-50 border border-red-200 rounded-button p-3 text-red-700 text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Messages */}
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            preferences={preferences}
            readyToMatch={readyToMatch}
            onSeeMatches={handleSeeMatches}
            matchesLoading={matchesLoading}
          />

          {/* Matches Display */}
          {showMatches && (
            <MatchesDisplay
              matches={matches}
              loading={matchesLoading}
              error={matchesError}
              searchSummary={searchSummary}
            />
          )}

          {/* Input - hide when showing matches */}
          {!showMatches && (
            <ChatInput
              onSend={sendMessage}
              onVoiceMessage={sendVoiceMessage}
              onVoiceStart={sendVoiceGreeting}
              onSetAudioCompleteCallback={setAudioCompleteCallback}
              disabled={isLoading}
              isProcessingVoice={isProcessingVoice}
              placeholder="Tell us what you need..."
              autoExitVoiceMode={readyToMatch}
            />
          )}
        </div>

        {/* Preferences Sidebar (Desktop) */}
        <div className="hidden md:block w-80">
          <PreferenceSummary
            preferences={preferences}
            readyToMatch={readyToMatch}
          />
        </div>
      </div>

      {/* Preferences Summary (Mobile - Bottom) */}
      <div className="md:hidden border-t border-gray-200 bg-white p-4">
        <PreferenceSummary
          preferences={preferences}
          readyToMatch={readyToMatch}
        />
      </div>
    </div>
  )
}



