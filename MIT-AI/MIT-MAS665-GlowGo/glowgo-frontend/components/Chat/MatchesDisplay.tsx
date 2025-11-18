'use client'

import { useState, useEffect } from 'react'
import { MerchantOption } from '@/types/booking'
import Button from '@/components/Button'

interface MatchesDisplayProps {
  matches: MerchantOption[]
  loading: boolean
  error: string | null
  searchSummary: string
}

export default function MatchesDisplay({
  matches,
  loading,
  error,
  searchSummary
}: MatchesDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    // Start animation on mount
    const timer = setTimeout(() => setIsAnimating(false), 100)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="border-t border-gray-200 bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-blush-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-medium">Finding your perfect matches...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-t border-gray-200 bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-button p-6 text-center">
            <p className="text-red-700 font-medium mb-2">Failed to load matches</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 p-6 md:p-8 transition-all duration-500 ${
        isAnimating ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-2">
            Your Perfect Matches 🎯
          </h2>
          {searchSummary && (
            <p className="text-gray-600 text-base">{searchSummary}</p>
          )}
          {matches.length > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              Found {matches.length} great {matches.length === 1 ? 'option' : 'options'} for you
            </p>
          )}
        </div>

        {/* Matches Grid */}
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h3 className="text-xl font-poppins font-semibold text-gray-900 mb-2">
              No matches found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your preferences to find more options
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match, index) => (
              <MatchCard key={index} match={match} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface MatchCardProps {
  match: MerchantOption
  index: number
}

function MatchCard({ match, index }: MatchCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="bg-white rounded-[20px] shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-slide-in"
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Rank Badge */}
      <div className="relative">
        <div className="absolute top-3 left-3 z-10">
          <div className="w-10 h-10 bg-blush-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">#{match.rank}</span>
          </div>
        </div>
        {/* Placeholder for merchant image */}
        <div className="h-40 bg-gradient-to-br from-blush-100 to-blush-200 flex items-center justify-center">
          <span className="text-5xl">✨</span>
        </div>
      </div>

      <div className="p-5">
        {/* Merchant Name */}
        <h3 className="text-lg font-poppins font-bold text-gray-900 mb-1 truncate">
          {match.merchant_name}
        </h3>

        {/* Service Name */}
        {match.service_name && (
          <p className="text-sm text-gray-600 mb-3">{match.service_name}</p>
        )}

        {/* Rating & Reviews */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            <span className="font-semibold text-gray-900">{match.rating.toFixed(1)}</span>
          </div>
          <span className="text-gray-500 text-sm">({match.reviews} reviews)</span>
        </div>

        {/* Price & Distance */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-xl font-bold text-blush-600">${match.price}</p>
          </div>
          {match.distance !== undefined && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Distance</p>
              <p className="text-sm font-medium text-gray-700">{match.distance} mi</p>
            </div>
          )}
        </div>

        {/* Why Recommended */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Why we recommend:</p>
          <p className="text-sm text-gray-700 line-clamp-2">{match.why_recommended}</p>
        </div>

        {/* Available Times */}
        {match.available_times && match.available_times.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Available times:</p>
            <div className="flex flex-wrap gap-2">
              {match.available_times.slice(0, 3).map((time, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blush-50 text-blush-700 rounded-full text-xs font-medium"
                >
                  {time}
                </span>
              ))}
              {match.available_times.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
                  +{match.available_times.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Book Button */}
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => {
            // TODO: Implement booking flow
            console.log('Book:', match.merchant_name)
          }}
        >
          Book Now
        </Button>

        {/* Relevance Score (for debugging) */}
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-400">
            Match: {Math.round(match.relevance_score * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
