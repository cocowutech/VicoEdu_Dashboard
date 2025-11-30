
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

interface CalendarEvent {
  id: string
  summary: string
  start: string
  end: string
  description?: string
  location?: string
}

interface CalendarResponse {
  events: CalendarEvent[]
  connected: boolean
}

export default function CalendarWidget() {
  const { isAuthenticated, token } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false)
      return
    }

    const fetchCalendar = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/calendar/events`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data: CalendarResponse = await response.json()
          setConnected(data.connected)
          setEvents(data.events)
        }
      } catch (error) {
        console.error('Error fetching calendar:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCalendar()
  }, [isAuthenticated, token])

  if (loading || !connected) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="text-xl">📅</span> Your Upcoming Schedule
      </h3>
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No upcoming events found</p>
        ) : (
          events.map(event => {
            const startDate = new Date(event.start)
            const endDate = new Date(event.end)
            
            return (
              <div key={event.id} className="text-sm border-l-2 border-blush-400 pl-3 py-1">
                <div className="font-medium text-gray-800 truncate">{event.summary}</div>
                <div className="text-gray-500 text-xs">
                  {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

