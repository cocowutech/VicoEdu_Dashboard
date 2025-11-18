'use client'

import { useState, useEffect, useRef } from 'react'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import AudioWaveform from './AudioWaveform'

interface ChatInputProps {
  onSend: (message: string) => void
  onVoiceMessage?: (audioBlob: Blob) => void
  onVoiceStart?: () => void
  onSetAudioCompleteCallback?: (callback: (() => void) | null) => void
  disabled?: boolean
  placeholder?: string
  isProcessingVoice?: boolean
  autoExitVoiceMode?: boolean // Auto-exit voice mode when this becomes true
}

export default function ChatInput({
  onSend,
  onVoiceMessage,
  onVoiceStart,
  onSetAudioCompleteCallback,
  disabled = false,
  placeholder = "Tell us what you need...",
  isProcessingVoice = false,
  autoExitVoiceMode = false
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false)
  const isVoiceModeActiveRef = useRef(false)
  const hasAutoExitedRef = useRef(false)
  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    clearRecording,
    error: recordingError
  } = useVoiceRecording()

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceClick = async () => {
    console.log('[Voice Mode] Button clicked, current state:', { isVoiceModeActive, isRecording })

    // If currently recording, just stop the recording (stay in voice mode)
    if (isRecording) {
      console.log('[Voice Mode] Stopping current recording (staying in voice mode)')
      await stopRecording()
      return
    }

    // If in voice mode but not recording, exit voice mode
    if (isVoiceModeActive) {
      console.log('[Voice Mode] Exiting voice mode')
      setIsVoiceModeActive(false)
      isVoiceModeActiveRef.current = false
      if (onSetAudioCompleteCallback) {
        onSetAudioCompleteCallback(null)
      }
    } else {
      // Enter voice mode
      // Enter voice mode - enable continuous listening
      console.log('[Voice Mode] Entering voice mode')
      setIsVoiceModeActive(true)
      isVoiceModeActiveRef.current = true

      // Set up callback to restart recording after AI speaks
      if (onSetAudioCompleteCallback) {
        onSetAudioCompleteCallback(async () => {
          // Small delay before restarting to avoid jarring UX
          await new Promise(resolve => setTimeout(resolve, 500))
          // Use ref to check current state
          if (isVoiceModeActiveRef.current) {
            console.log('[Voice Mode] Auto-restarting recording after AI response')
            await startRecording(true) // Enable auto-stop on silence
          }
        })
      }

      // Trigger greeting (if first time) - this will play audio and callback will restart recording
      if (onVoiceStart) {
        console.log('[Voice Mode] Has onVoiceStart, playing greeting')
        await onVoiceStart()
        // The callback set above will restart recording after greeting plays
        // Don't start recording here - wait for greeting to complete
      } else {
        // No greeting, start recording immediately (subsequent activations)
        console.log('[Voice Mode] No onVoiceStart, starting recording immediately')
        try {
          await startRecording(true)
          console.log('[Voice Mode] Recording started successfully')
        } catch (err) {
          console.error('[Voice Mode] Failed to start recording:', err)
        }
      }
    }
  }

  // When recording stops and we have audio, send it
  useEffect(() => {
    if (audioBlob && !isRecording && onVoiceMessage) {
      onVoiceMessage(audioBlob)
      clearRecording()
    }
  }, [audioBlob, isRecording, onVoiceMessage, clearRecording])

  // Show error if recording failed
  useEffect(() => {
    if (recordingError) {
      console.error('Recording error:', recordingError)
      // You could show a toast notification here
    }
  }, [recordingError])

  // Auto-exit voice mode when autoExitVoiceMode becomes true
  useEffect(() => {
    if (autoExitVoiceMode && isVoiceModeActive && !hasAutoExitedRef.current) {
      console.log('[Voice Mode] Auto-exiting voice mode (matching results ready)')
      hasAutoExitedRef.current = true

      // Exit voice mode
      setIsVoiceModeActive(false)
      isVoiceModeActiveRef.current = false

      if (onSetAudioCompleteCallback) {
        onSetAudioCompleteCallback(null)
      }

      if (isRecording) {
        stopRecording()
      }
    }
  }, [autoExitVoiceMode, isVoiceModeActive, isRecording, stopRecording, onSetAudioCompleteCallback])

  // Reset auto-exit flag when voice mode is manually started again
  useEffect(() => {
    if (isVoiceModeActive) {
      hasAutoExitedRef.current = false
    }
  }, [isVoiceModeActive])

  const isVoiceDisabled = disabled || isProcessingVoice

  return (
    <div className="border-t border-blush-100 bg-gradient-to-b from-white to-blush-50/30 p-4 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        {/* Audio Waveform Visualization */}
        {isRecording && (
          <div className="mb-4">
            <AudioWaveform isActive={isRecording} />
          </div>
        )}

        {/* Recording/Processing Status */}
        {(isRecording || isProcessingVoice || isVoiceModeActive) && (
          <div className="mb-3 text-center text-sm">
            {isVoiceModeActive && !isRecording && !isProcessingVoice && (
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-blush-50 text-blush-700 font-medium shadow-sm">
                <span className="mr-2 h-2.5 w-2.5 rounded-full bg-blush-500 animate-pulse"></span>
                Voice mode active - Click mic to exit
              </span>
            )}
            {isRecording && (
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blush-100 to-blush-50 text-blush-700 font-medium shadow-sm">
                <span className="mr-2 h-2.5 w-2.5 rounded-full bg-blush-600 animate-pulse"></span>
                Listening... Click mic to stop or wait 1.2s silence
              </span>
            )}
            {isProcessingVoice && (
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-blush-50 text-blush-700 font-medium shadow-sm">
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-blush-500 border-t-transparent rounded-full"></span>
                Processing your voice message...
              </span>
            )}
          </div>
        )}

        {/* Error Message */}
        {recordingError && (
          <div className="mb-3 text-center">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 text-red-600 text-sm font-medium shadow-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recordingError}
            </span>
          </div>
        )}

        <div className="flex items-center space-x-3">
          {/* Voice button */}
          <button
            onClick={handleVoiceClick}
            disabled={isVoiceDisabled}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              isRecording
                ? 'bg-gradient-to-br from-blush-500 to-blush-600 text-white animate-pulse shadow-lg shadow-blush-500/30 scale-110'
                : isVoiceModeActive
                ? 'bg-gradient-to-br from-blush-500 to-blush-600 text-white shadow-md shadow-blush-500/20 hover:shadow-lg hover:shadow-blush-500/30 hover:scale-105'
                : 'bg-white text-blush-600 border-2 border-blush-200 hover:border-blush-500 hover:bg-blush-50 shadow-sm hover:shadow-md'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={
              isVoiceModeActive
                ? 'Click to exit voice mode'
                : 'Click to start voice mode'
            }
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Input field */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Recording..." : placeholder}
            disabled={disabled || isRecording || isProcessingVoice}
            className="flex-1 h-12 px-5 rounded-full border-2 border-blush-100 bg-white focus:outline-none focus:ring-2 focus:ring-blush-500/20 focus:border-blush-500 disabled:bg-blush-50/50 disabled:cursor-not-allowed text-gray-900 placeholder-blush-300 shadow-sm transition-all"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim() || isRecording || isProcessingVoice}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blush-500 to-blush-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-blush-500/30 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}



