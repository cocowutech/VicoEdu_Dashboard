'use client'

import { useState, useEffect, useMemo } from 'react'
import { MerchantOption, GroupedProvider, ServiceOption } from '@/types/booking'

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

  // Group matches by merchant_id
  const groupedProviders: GroupedProvider[] = useMemo(() => {
    const providerMap = new Map<string, GroupedProvider>()

    matches.forEach((match) => {
      const merchantId = match.merchant_id || match.merchant_name

      if (providerMap.has(merchantId)) {
        // Add service to existing provider
        const existing = providerMap.get(merchantId)!
        existing.services.push({
          service_name: match.service_name || 'Service',
          price: match.price,
          booking_url: match.booking_url
        })
        // Update relevance score to max
        if (match.relevance_score > existing.relevance_score) {
          existing.relevance_score = match.relevance_score
          existing.why_recommended = match.why_recommended
        }
      } else {
        // Create new provider entry
        providerMap.set(merchantId, {
          merchant_id: merchantId,
          merchant_name: match.merchant_name,
          photo_url: match.photo_url,
          photos: match.photos,
          address: match.address,
          city: match.city,
          state: match.state,
          phone: match.phone,
          price_range: match.price_range,
          specialties: match.specialties,
          stylist_names: match.stylist_names,
          rating: match.rating,
          reviews: match.reviews,
          distance: match.distance,
          why_recommended: match.why_recommended,
          relevance_score: match.relevance_score,
          yelp_url: match.yelp_url,
          booking_url: match.booking_url,
          rank: match.rank,
          services: [{
            service_name: match.service_name || 'Service',
            price: match.price,
            booking_url: match.booking_url
          }]
        })
      }
    })

    // Convert to array and sort by relevance score
    return Array.from(providerMap.values())
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .map((provider, index) => ({ ...provider, rank: index + 1 }))
  }, [matches])

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
            Your Perfect Matches
          </h2>
          {searchSummary && (
            <p className="text-gray-600 text-base">{searchSummary}</p>
          )}
          {groupedProviders.length > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              Found {groupedProviders.length} great {groupedProviders.length === 1 ? 'provider' : 'providers'} for you
            </p>
          )}
        </div>

        {/* Matches Grid */}
        {groupedProviders.length === 0 ? (
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
            {groupedProviders.map((provider, index) => (
              <ProviderCard key={provider.merchant_id} provider={provider} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface ProviderCardProps {
  provider: GroupedProvider
  index: number
}

function ProviderCard({ provider, index }: ProviderCardProps) {
  const [imageError, setImageError] = useState(false)

  // Get the best available photo
  const photoUrl = provider.photo_url || (provider.photos && provider.photos[0]) || null

  // Get minimum price from services
  const minPrice = Math.min(...provider.services.map(s => s.price))

  // Handle service button click - direct booking
  const handleServiceClick = (service: ServiceOption) => {
    if (service.booking_url) {
      window.open(service.booking_url, '_blank')
    } else if (provider.booking_url) {
      window.open(provider.booking_url, '_blank')
    } else if (provider.yelp_url) {
      window.open(provider.yelp_url, '_blank')
    } else {
      console.log('Book:', provider.merchant_name, service.service_name)
    }
  }

  return (
    <div
      className="bg-white rounded-[20px] shadow-md border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-slide-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Rank Badge & Image */}
      <div className="relative">
        <div className="absolute top-3 left-3 z-10">
          <div className="w-10 h-10 bg-blush-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">#{provider.rank}</span>
          </div>
        </div>

        {/* Price Range Badge */}
        {provider.price_range && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-xs font-semibold shadow-sm">
              {provider.price_range}
            </span>
          </div>
        )}

        {/* Provider Image */}
        {photoUrl && !imageError ? (
          <div className="h-44 overflow-hidden">
            <img
              src={photoUrl}
              alt={provider.merchant_name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="h-44 bg-gradient-to-br from-blush-100 to-blush-200 flex items-center justify-center">
            <span className="text-5xl">✨</span>
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Merchant Name */}
        <h3 className="text-lg font-poppins font-bold text-gray-900 mb-1 truncate">
          {provider.merchant_name}
        </h3>

        {/* Location */}
        {(provider.city || provider.address) && (
          <p className="text-xs text-gray-500 mb-2 truncate">
            📍 {provider.city && provider.state ? `${provider.city}, ${provider.state}` : provider.address}
          </p>
        )}

        {/* Rating & Reviews */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            <span className="font-semibold text-gray-900">{provider.rating.toFixed(1)}</span>
          </div>
          <span className="text-gray-500 text-sm">({provider.reviews} reviews)</span>
          {provider.distance != null && (
            <span className="text-gray-500 text-sm">{provider.distance.toFixed(1)} mi</span>
          )}
        </div>

        {/* Specialties Tags */}
        {provider.specialties && provider.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {provider.specialties.slice(0, 2).map((specialty, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                {specialty}
              </span>
            ))}
            {provider.specialties.length > 2 && (
              <span className="text-xs text-gray-400">+{provider.specialties.length - 2}</span>
            )}
          </div>
        )}

        {/* Why Recommended */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-1">Why we recommend:</p>
          <p className="text-sm text-gray-700 line-clamp-2">{provider.why_recommended}</p>
        </div>

        {/* Service Buttons - Direct Booking */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Click to book:</p>
          <div className="flex flex-wrap gap-2">
            {provider.services.map((service, idx) => (
              <button
                key={idx}
                onClick={() => handleServiceClick(service)}
                className="px-3 py-2 bg-blush-500 hover:bg-blush-600 text-white rounded-lg text-xs font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                {service.service_name} ${service.price}
              </button>
            ))}
          </div>
        </div>

        {/* Stylists */}
        {provider.stylist_names && provider.stylist_names.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Stylists:</p>
            <p className="text-sm text-gray-700 truncate">
              {provider.stylist_names.slice(0, 3).join(', ')}
              {provider.stylist_names.length > 3 && ` +${provider.stylist_names.length - 3} more`}
            </p>
          </div>
        )}

        {/* Footer with Match Score & Links */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Match: {Math.round(provider.relevance_score * 100)}%
          </span>
          <div className="flex items-center gap-2">
            {provider.phone && (
              <a
                href={`tel:${provider.phone}`}
                className="text-xs text-blush-500 hover:text-blush-600"
              >
                Call
              </a>
            )}
            {provider.yelp_url && (
              <a
                href={provider.yelp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blush-500 hover:text-blush-600"
              >
                Yelp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
