'use client'

import { useState, useEffect, useCallback } from 'react'

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'checking' | 'unsupported'

export interface UseMicrophonePermissionResult {
  permissionState: PermissionState
  requestPermission: () => Promise<boolean>
  checkPermission: () => Promise<void>
}

/**
 * Hook for managing microphone permissions
 * Automatically checks permission on mount and provides methods to request access
 */
export function useMicrophonePermission(): UseMicrophonePermissionResult {
  const [permissionState, setPermissionState] = useState<PermissionState>('checking')

  const checkPermission = useCallback(async () => {
    // Only run in browser
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      setPermissionState('unsupported')
      return
    }

    try {
      // Check if Permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setPermissionState(result.state as PermissionState)

        // Listen for permission changes
        result.onchange = () => {
          setPermissionState(result.state as PermissionState)
        }
      } else {
        // Fallback: Try to get media devices to check permission
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const hasMicrophone = devices.some(device => device.kind === 'audioinput')

          if (hasMicrophone) {
            // We can't know the exact state without Permissions API, so assume prompt
            setPermissionState('prompt')
          } else {
            setPermissionState('denied')
          }
        } catch (err) {
          setPermissionState('prompt')
        }
      }
    } catch (err) {
      console.error('Error checking microphone permission:', err)
      setPermissionState('prompt')
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Only run in browser
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      return false
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Stop all tracks immediately - we just needed to trigger permission
      stream.getTracks().forEach(track => track.stop())

      setPermissionState('granted')
      return true
    } catch (err: any) {
      console.error('Error requesting microphone permission:', err)

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionState('denied')
      } else {
        setPermissionState('prompt')
      }

      return false
    }
  }, [])

  // Check permission on mount
  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  return {
    permissionState,
    requestPermission,
    checkPermission
  }
}
