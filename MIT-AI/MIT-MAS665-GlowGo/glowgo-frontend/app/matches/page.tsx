'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import SearchResults from '@/app/components/booking/SearchResults'
import RankingCards from '@/app/components/booking/RankingCards'
import { ExtractedPreferences, MerchantOption } from '@/types/booking'

type LoadState = 'loading' | 'searching' | 'results' | 'missing'

const STORAGE_KEY = 'glowgo-chat-preferences'

export default function MatchesPage() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<ExtractedPreferences | null>(null)
  const [rankedOptions, setRankedOptions] = useState<MerchantOption[]>([])
  const [state, setState] = useState<LoadState>('loading')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setState('missing')
        return
      }

      const parsed = JSON.parse(raw)
      const storedPrefs: ExtractedPreferences | undefined = parsed?.preferences || parsed
      const ready = Boolean(parsed?.ready_to_match)

      if (storedPrefs && ready) {
        setPreferences(storedPrefs)
        setState('searching')
      } else {
        setState('missing')
      }
    } catch (error) {
      console.warn('Failed to load saved preferences', error)
      setState('missing')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-1">
        {state === 'loading' && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500"></div>
          </div>
        )}

        {state === 'missing' && (
          <div className="max-w-xl mx-auto bg-white rounded-card shadow-soft p-8 text-center">
            <h1 className="text-2xl font-poppins font-bold text-gray-900 mb-3">
              We need your preferences
            </h1>
            <p className="text-gray-700 mb-6">
              Tell us what you need in chat first, then come back here to see your matches.
            </p>
            <button
              type="button"
              onClick={() => router.push('/chat')}
              className="inline-flex items-center justify-center px-6 py-3 rounded-button bg-blush-500 hover:bg-blush-600 text-white font-semibold transition"
            >
              Go to Chat
            </button>
          </div>
        )}

        {state === 'searching' && preferences && (
          <SearchResults
            preferences={preferences}
            onComplete={(options) => {
              setRankedOptions(options)
              setState('results')
            }}
          />
        )}

        {state === 'results' && (
          <div className="space-y-4">
            <div className="bg-white rounded-card shadow-soft p-6">
              <h1 className="text-2xl font-poppins font-bold text-gray-900 mb-2">
                Your Matches
              </h1>
              <p className="text-gray-700">
                Top options based on your preferences. Choose one to start booking.
              </p>
            </div>

            <RankingCards
              options={rankedOptions}
              onSelect={(merchant) => {
                alert(`Booking flow coming soon for ${merchant.merchant_name}`)
              }}
            />
          </div>
        )}
      </main>
    </div>
  )
}
