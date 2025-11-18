'use client'

import { useEffect, useRef } from 'react'
import { ChatMessage as ChatMessageType } from '@/types/chat'
import { Preference } from '@/types/chat'
import ChatMessage from './ChatMessage'
import PreferenceSummaryMessage from './PreferenceSummaryMessage'

interface ChatContainerProps {
  messages: ChatMessageType[]
  isLoading: boolean
  preferences: Preference
  readyToMatch: boolean
  onSeeMatches: () => void
  matchesLoading: boolean
}

export default function ChatContainer({
  messages,
  isLoading,
  preferences,
  readyToMatch,
  onSeeMatches,
  matchesLoading
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, readyToMatch])

  // Empty state
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💬</span>
          </div>
          <h2 className="text-2xl font-poppins font-semibold text-gray-900 mb-3">
            Tell us what's on your mind...
          </h2>
          <p className="text-gray-700 mb-6">
            I'm here to help you find the perfect beauty or wellness service. 
            Just tell me what you're looking for!
          </p>
          <div className="text-sm text-gray-500 space-y-2">
            <p>Try saying:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-gray-100 rounded-full">"I need a haircut"</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">"Book a massage"</span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">"Get my nails done"</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <ChatMessage
            message={{ role: 'assistant', content: '' }}
            isLoading={true}
          />
        )}

        {/* Preference Summary with See Matches button (shown when ready) */}
        {readyToMatch && !isLoading && (
          <PreferenceSummaryMessage
            preferences={preferences}
            onSeeMatches={onSeeMatches}
            matchesLoading={matchesLoading}
          />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}



