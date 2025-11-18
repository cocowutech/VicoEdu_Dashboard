'use client'

import { useState, useCallback, useRef } from 'react'
import { ChatMessage, Preference, ChatResponse } from '@/types/chat'
import { postChatMessage } from '@/lib/chatApi'
import { useAuth } from '@/context/AuthContext'
import { speechToText, textToSpeech } from '@/lib/voiceApi'
import { playAudio } from '@/lib/audioUtils'

export function useChat() {
  const { token, user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [preferences, setPreferences] = useState<Preference>({})
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [readyToMatch, setReadyToMatch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [rankedMatches, setRankedMatches] = useState<any[]>([])
  const hasShownVoiceGreetingRef = useRef(false)
  const onAudioCompleteCallbackRef = useRef<(() => void) | null>(null)

  const sendMessage = useCallback(async (text: string, enableTTS: boolean = false, onAudioComplete?: () => void) => {
    if (!text.trim() || !token) return

    setIsLoading(true)
    setError(null)

    // Add user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Call backend API
      const response: ChatResponse = await postChatMessage(text, sessionId, token)

      // Update session ID
      if (response.session_id) {
        setSessionId(response.session_id)
      }

      // Update preferences
      setPreferences(response.preferences)
      // Persist preferences so the matches page can fetch results
      try {
        localStorage.setItem(
          'glowgo-chat-preferences',
          JSON.stringify({
            preferences: response.preferences,
            ready_to_match: response.ready_to_match,
            session_id: response.session_id
          })
        )
      } catch (storageError) {
        console.warn('Failed to persist preferences', storageError)
      }

      // Update ready to match status
      setReadyToMatch(response.ready_to_match)

      // Store ranked matches if provided
      if (response.ranked_matches && response.ranked_matches.length > 0) {
        console.log('[MATCHES] Received ranked matches:', response.ranked_matches.length)
        setRankedMatches(response.ranked_matches)
      }

      // Add bot response
      const botMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])

      // If TTS is enabled, convert response to speech and play
      if (enableTTS && response.response) {
        console.log('[TTS] TTS enabled, converting text to speech...')
        console.log('[TTS] Text to convert:', response.response.substring(0, 100) + '...')
        try {
          console.log('[TTS] Calling textToSpeech API...')
          const audioBlob = await textToSpeech(response.response)
          console.log('[TTS] ✅ Received audio blob, size:', audioBlob.size, 'bytes')
          console.log('[TTS] Playing audio...')
          await playAudio(audioBlob)
          console.log('[TTS] ✅ Audio playback completed')
          // Call callback after audio completes (for continuous listening)
          if (onAudioComplete) {
            console.log('[TTS] Calling onAudioComplete callback')
            onAudioComplete()
          }
        } catch (ttsError) {
          console.error('[TTS] ❌ TTS error:', ttsError)
          // Don't fail the whole message if TTS fails
        }
      } else {
        console.log('[TTS] TTS not enabled or no response text')
        console.log('[TTS] enableTTS:', enableTTS, 'response.response:', !!response.response)
      }

    } catch (err: any) {
      console.error('Chat error:', err)
      setError(err.response?.data?.detail || 'Failed to send message')

      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I had trouble processing that. Could you try again?',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [token, sessionId])

  const sendVoiceGreeting = useCallback(async () => {
    // Only run on client side
    if (typeof window === 'undefined') return
    if (hasShownVoiceGreetingRef.current) return

    const userName = user?.name?.split(' ')[0] || 'there'
    const greetingText = `Hi ${userName}! What service are you looking for today?`

    const greetingMessage: ChatMessage = {
      role: 'assistant',
      content: greetingText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, greetingMessage])

    try {
      const audioBlob = await textToSpeech(greetingText)
      await playAudio(audioBlob)
      console.log('[Greeting] Audio playback completed')
      // Call the callback to restart recording after greeting completes
      if (onAudioCompleteCallbackRef.current) {
        console.log('[Greeting] Calling callback to restart recording')
        onAudioCompleteCallbackRef.current()
      }
    } catch (err) {
      console.error('Error playing greeting:', err)
    }

    hasShownVoiceGreetingRef.current = true
  }, [user])

  const sendVoiceMessage = useCallback(async (audioBlob: Blob) => {
    // Only run on client side
    if (typeof window === 'undefined') return
    if (!token) return

    setIsProcessingVoice(true)
    setError(null)

    try {
      // Convert audio to text
      const recognizedText = await speechToText(audioBlob)

      if (!recognizedText || !recognizedText.trim()) {
        setError('No speech detected. Please try again.')
        setIsProcessingVoice(false)
        return
      }

      // Send the recognized text as a normal message with TTS enabled
      // Pass the callback to restart recording after audio completes
      await sendMessage(recognizedText, true, onAudioCompleteCallbackRef.current || undefined)

    } catch (err: any) {
      console.error('Voice message error:', err)
      setError(err.response?.data?.detail || 'Failed to process voice message')

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I had trouble understanding that. Could you try speaking again?',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessingVoice(false)
    }
  }, [token, sendMessage])

  const clearChat = useCallback(() => {
    setMessages([])
    setPreferences({})
    setSessionId(null)
    setReadyToMatch(false)
    setError(null)
    hasShownVoiceGreetingRef.current = false
  }, [])

  const setAudioCompleteCallback = useCallback((callback: (() => void) | null) => {
    onAudioCompleteCallbackRef.current = callback
  }, [])

  const getPreferences = useCallback(() => {
    return preferences
  }, [preferences])

  return {
    messages,
    preferences,
    isLoading,
    sessionId,
    readyToMatch,
    error,
    sendMessage,
    sendVoiceMessage,
    sendVoiceGreeting,
    isProcessingVoice,
    clearChat,
    getPreferences,
    setAudioCompleteCallback,
    rankedMatches
  }
}


