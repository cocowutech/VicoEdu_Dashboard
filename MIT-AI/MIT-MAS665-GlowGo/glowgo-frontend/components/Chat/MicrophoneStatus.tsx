'use client'

import { PermissionState } from '@/hooks/useMicrophonePermission'

interface MicrophoneStatusProps {
  permissionState: PermissionState
  onRequestPermission: () => void
  className?: string
}

export default function MicrophoneStatus({
  permissionState,
  onRequestPermission,
  className = ''
}: MicrophoneStatusProps) {
  if (permissionState === 'checking') {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
        <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full" />
        <span>Checking microphone...</span>
      </div>
    )
  }

  if (permissionState === 'granted') {
    return (
      <div className={`flex items-center space-x-2 text-sm text-green-600 ${className}`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>Microphone ready</span>
      </div>
    )
  }

  if (permissionState === 'denied') {
    return (
      <div className={`rounded-lg bg-red-50 border border-red-200 p-3 ${className}`}>
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Microphone access denied</p>
            <p className="text-xs text-red-700 mt-1">
              Voice chat requires microphone access. Please enable it in your browser settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (permissionState === 'prompt') {
    return (
      <div className={`rounded-lg bg-blue-50 border border-blue-200 p-3 ${className}`}>
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">Enable voice chat</p>
            <p className="text-xs text-blue-700 mt-1 mb-2">
              Click below to allow microphone access for voice conversations.
            </p>
            <button
              onClick={onRequestPermission}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 underline"
            >
              Enable Microphone
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (permissionState === 'unsupported') {
    return (
      <div className={`rounded-lg bg-gray-50 border border-gray-200 p-3 ${className}`}>
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">Voice chat not supported</p>
            <p className="text-xs text-gray-700 mt-1">
              Your browser doesn&apos;t support voice features. Please use text chat instead.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
