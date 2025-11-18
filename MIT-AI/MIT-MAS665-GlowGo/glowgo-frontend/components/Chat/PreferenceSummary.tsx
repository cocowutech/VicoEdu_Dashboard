'use client'

import { useRouter } from 'next/navigation'
import { Preference } from '@/types/chat'
import Button from '@/components/Button'

interface PreferenceSummaryProps {
  preferences: Preference
  readyToMatch: boolean
}

export default function PreferenceSummary({ preferences, readyToMatch }: PreferenceSummaryProps) {
  const router = useRouter()

  const handleSeeMatches = () => {
    router.push('/matches')
  }

  return (
    <div className="bg-white border-l border-gray-200 p-6 overflow-y-auto">
      <h3 className="text-lg font-poppins font-semibold text-gray-900 mb-4">
        Your Preferences
      </h3>

      <div className="space-y-4">
        {/* Service Type */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Service</p>
          <p className="text-gray-900 font-medium">
            {preferences.service_type || (
              <span className="text-gray-400 italic">Not specified</span>
            )}
          </p>
        </div>

        {/* Budget */}
        <div>
          <p className="text-sm text-gray-500 mb-1">Budget</p>
          <p className="text-gray-900 font-medium">
            {preferences.budget_min && preferences.budget_max ? (
              `$${preferences.budget_min} - $${preferences.budget_max}`
            ) : preferences.budget_max ? (
              `Up to $${preferences.budget_max}`
            ) : preferences.budget_min ? (
              `From $${preferences.budget_min}`
            ) : (
              <span className="text-gray-400 italic">Not specified</span>
            )}
          </p>
        </div>

        {/* Time Urgency */}
        <div>
          <p className="text-sm text-gray-500 mb-1">When</p>
          <p className="text-gray-900 font-medium capitalize">
            {preferences.time_urgency || (
              <span className="text-gray-400 italic">Not specified</span>
            )}
          </p>
        </div>

        {/* Provider Preference */}
        {preferences.artisan_preference && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Provider</p>
            <p className="text-gray-900 font-medium">
              {preferences.artisan_preference}
            </p>
          </div>
        )}

        {/* Special Notes */}
        {preferences.special_notes && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Notes</p>
            <p className="text-gray-900 font-medium text-sm">
              {preferences.special_notes}
            </p>
          </div>
        )}

        {/* Ready to Match Badge */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Status</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              readyToMatch 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {readyToMatch ? '✓ Ready' : 'Gathering info...'}
            </span>
          </div>

          {/* See Matches Button */}
          {readyToMatch && (
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleSeeMatches}
            >
              See Matches
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}



