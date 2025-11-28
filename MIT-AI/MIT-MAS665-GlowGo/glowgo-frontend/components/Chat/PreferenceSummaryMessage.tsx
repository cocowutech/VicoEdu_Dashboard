'use client'

import { useState, useEffect } from 'react'
import { Preference } from '@/types/chat'
import Button from '@/components/Button'

interface PreferenceSummaryMessageProps {
  preferences: Preference
  onSeeMatches: () => void
  matchesLoading: boolean
}

export default function PreferenceSummaryMessage({
  preferences,
  onSeeMatches,
  matchesLoading
}: PreferenceSummaryMessageProps) {
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    // Start animation on mount
    const timer = setTimeout(() => setIsAnimating(false), 100)
    return () => clearTimeout(timer)
  }, [])

  // Format preferences for display
  const preferenceItems: { label: string; value: string }[] = []

  if (preferences.service_type) {
    preferenceItems.push({
      label: 'Service',
      value: preferences.service_type
    })
  }

  if (preferences.budget_min && preferences.budget_max) {
    preferenceItems.push({
      label: 'Budget',
      value: `$${preferences.budget_min} - $${preferences.budget_max}`
    })
  } else if (preferences.budget_max) {
    preferenceItems.push({
      label: 'Budget',
      value: `Up to $${preferences.budget_max}`
    })
  } else if (preferences.budget_min) {
    preferenceItems.push({
      label: 'Budget',
      value: `From $${preferences.budget_min}`
    })
  }

  // Prioritize specific date over general urgency
  if (preferences.preferred_date) {
    // Parse YYYY-MM-DD manually to ensure local time
    const [year, month, day] = preferences.preferred_date.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })

    let timeDisplay = dateStr

    if (preferences.preferred_time) {
      const [hours, minutes] = preferences.preferred_time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      timeDisplay += ` at ${hour12}:${minutes} ${ampm}`
    }

    if (preferences.time_constraint) {
      const constraint = preferences.time_constraint
      if (constraint === 'before') timeDisplay = `Before ${timeDisplay}`
      else if (constraint === 'by') timeDisplay = `By ${timeDisplay}`
      else if (constraint === 'after') timeDisplay = `After ${timeDisplay}`
    }

    preferenceItems.push({
      label: 'When',
      value: timeDisplay
    })
  } else if (preferences.time_urgency) {
    preferenceItems.push({
      label: 'When',
      value: preferences.time_urgency.charAt(0).toUpperCase() + preferences.time_urgency.slice(1)
    })
  }

  if (preferences.artisan_preference) {
    preferenceItems.push({
      label: 'Provider',
      value: preferences.artisan_preference
    })
  }

  if (preferences.special_notes) {
    preferenceItems.push({
      label: 'Notes',
      value: preferences.special_notes
    })
  }

  return (
    <div className="flex justify-start mb-4 animate-fade-in">
      <div
        className={`max-w-[85%] bg-gradient-to-br from-blush-50 to-blush-100 rounded-[20px] p-6 shadow-sm border border-blush-200 transition-all duration-500 ${
          isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">✨</span>
          <h3 className="text-lg font-poppins font-semibold text-gray-900">
            Here's what you're looking for:
          </h3>
        </div>

        {/* Preferences List */}
        <div className="space-y-3 mb-5">
          {preferenceItems.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 animate-slide-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blush-500 mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-600">{item.label}:</span>{' '}
                <span className="text-base text-gray-900 font-medium">{item.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* See Matches Button */}
        <div className="pt-4 border-t border-blush-200">
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={onSeeMatches}
            disabled={matchesLoading}
          >
            {matchesLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Finding Matches...</span>
              </div>
            ) : (
              <span>See Matches 🎯</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
