'use client'

import { useState, useEffect, useCallback } from 'react'

// Types
interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  location?: string
  description?: string
  source?: string
  allDay?: boolean
  color?: string
}

interface TodoItem {
  id: number
  text: string
  completed: boolean
}

interface CalendarSource {
  id: string
  name: string
  url: string
  color: string
  enabled: boolean
}

// Constants
const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const HOUR_HEIGHT = 48
const START_HOUR = 6
const END_HOUR = 22

// Default calendar sources from Smart Calendar config
const DEFAULT_CALENDAR_SOURCES: CalendarSource[] = [
  {
    id: 'harvard-canvas',
    name: 'Harvard Canvas',
    url: 'https://canvas.harvard.edu/feeds/calendars/user_OtFYRvlM3UBCrdIXqkntOJerw5Jibi5UZ5IGhyYV.ics',
    color: 'bg-red-500',
    enabled: true
  },
  {
    id: 'hbs-canvas',
    name: 'HBS Canvas',
    url: 'https://hbs.instructure.com/feeds/calendars/user_03CKmwa1f7Twza2acVYcZZuGYDB30tIj3eiOvTk1.ics',
    color: 'bg-orange-500',
    enabled: true
  },
  {
    id: 'mit-canvas',
    name: 'MIT Canvas',
    url: 'https://canvas.mit.edu/feeds/calendars/user_Pt8P7SgOM54JioJ1QXYhjylaq9Jx33VJvUZwx8iA.ics',
    color: 'bg-blue-500',
    enabled: true
  },
  {
    id: 'outlook',
    name: 'Outlook',
    url: 'https://outlook.office365.com/owa/calendar/e23d148f6fd44ad4bc687da2d033d868@gse.harvard.edu/eba8bfccb9d9480897360f7cac9758e210122385807434738636/calendar.ics',
    color: 'bg-cyan-500',
    enabled: true
  }
]

// Helper functions
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const formatTimeEn = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

const formatDateFull = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

const formatDateFullEn = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

const getWeekDates = (baseDate: Date): Date[] => {
  const dates: Date[] = []
  const day = baseDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() + diff)

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    dates.push(date)
  }
  return dates
}

const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date())
}

// Color mapping for event sources
const getEventColor = (source?: string): string => {
  const colors: Record<string, string> = {
    'Google': 'bg-blue-500',
    'Canvas': 'bg-red-600',
    'Manual': 'bg-amber-600',
    'Harvard Canvas': 'bg-red-500',
    'HBS Canvas': 'bg-orange-500',
    'MIT Canvas': 'bg-blue-500',
    'Outlook': 'bg-cyan-500',
    'default': 'bg-amber-600'
  }
  return colors[source || 'default'] || colors.default
}

// Parse ICS file content
const parseICS = (icsContent: string, sourceName: string): CalendarEvent[] => {
  const events: CalendarEvent[] = []
  const lines = icsContent.split(/\r?\n/)
  let currentEvent: Partial<CalendarEvent> | null = null

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++
      line += lines[i].substring(1)
    }

    if (line === 'BEGIN:VEVENT') {
      currentEvent = { source: sourceName }
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.title && currentEvent.start && currentEvent.end) {
        events.push({
          id: `ics-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          title: currentEvent.title,
          start: currentEvent.start,
          end: currentEvent.end,
          location: currentEvent.location,
          description: currentEvent.description,
          source: sourceName,
          allDay: currentEvent.allDay
        })
      }
      currentEvent = null
    } else if (currentEvent) {
      const colonIndex = line.indexOf(':')
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex)
        const value = line.substring(colonIndex + 1)
        const keyBase = key.split(';')[0]

        switch (keyBase) {
          case 'SUMMARY':
            currentEvent.title = value
            break
          case 'DTSTART':
            currentEvent.start = parseICSDate(value)
            if (key.includes('VALUE=DATE') && !key.includes('VALUE=DATE-TIME')) {
              currentEvent.allDay = true
            }
            break
          case 'DTEND':
            currentEvent.end = parseICSDate(value)
            break
          case 'LOCATION':
            currentEvent.location = value
            break
          case 'DESCRIPTION':
            currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',')
            break
        }
      }
    }
  }

  return events
}

const parseICSDate = (dateStr: string): Date => {
  const cleaned = dateStr.replace(/[^0-9TZ]/g, '')
  if (cleaned.length === 8) {
    const year = parseInt(cleaned.substring(0, 4))
    const month = parseInt(cleaned.substring(4, 6)) - 1
    const day = parseInt(cleaned.substring(6, 8))
    return new Date(year, month, day)
  } else {
    const year = parseInt(cleaned.substring(0, 4))
    const month = parseInt(cleaned.substring(4, 6)) - 1
    const day = parseInt(cleaned.substring(6, 8))
    const hour = parseInt(cleaned.substring(9, 11)) || 0
    const minute = parseInt(cleaned.substring(11, 13)) || 0
    const isUTC = dateStr.endsWith('Z')
    if (isUTC) {
      return new Date(Date.UTC(year, month, day, hour, minute))
    }
    return new Date(year, month, day, hour, minute)
  }
}

// Generate natural language summary like the original Smart Calendar
const generateNaturalLanguageSummary = (todayEvents: CalendarEvent[]): string => {
  if (todayEvents.length === 0) {
    return "Your schedule is completely free today! Time to relax and recharge, or tackle that passion project you've been putting off."
  }

  const greetings = [
    "Here's what your day looks like:",
    "Your plan for today:",
    "Here's your schedule for today:",
    "Today you have:"
  ]

  const greeting = greetings[Math.floor(Math.random() * greetings.length)]

  const allDayEvents = todayEvents.filter(ev => ev.allDay)
  const timedEvents = todayEvents.filter(ev => !ev.allDay)

  let lines: string[] = [greeting]

  // Summary sentence
  if (allDayEvents.length > 0 && timedEvents.length > 0) {
    lines.push(`You have ${allDayEvents.length} all-day event${allDayEvents.length > 1 ? 's' : ''} and ${timedEvents.length} scheduled activit${timedEvents.length > 1 ? 'ies' : 'y'}.`)
  } else if (allDayEvents.length > 0) {
    lines.push(`You have ${allDayEvents.length} all-day event${allDayEvents.length > 1 ? 's' : ''}.`)
  } else if (timedEvents.length > 0) {
    const firstEvent = timedEvents[0]
    const lastEvent = timedEvents[timedEvents.length - 1]
    const startTime = formatTimeEn(new Date(firstEvent.start))
    const endTime = formatTimeEn(new Date(lastEvent.end))
    lines.push(`You have ${timedEvents.length} scheduled activit${timedEvents.length > 1 ? 'ies' : 'y'} from ${startTime} to ${endTime}.`)
  }

  lines.push('')

  // All-day events
  if (allDayEvents.length > 0) {
    lines.push('**All-Day Events:**')
    allDayEvents.forEach(ev => {
      lines.push(`• ${ev.title}`)
    })
    if (timedEvents.length > 0) lines.push('')
  }

  // Timed events
  if (timedEvents.length > 0) {
    lines.push(allDayEvents.length === 0 ? '**Your Schedule:**' : '**Timed Events:**')
    timedEvents.forEach(ev => {
      const timeStr = `${formatTimeEn(new Date(ev.start))} - ${formatTimeEn(new Date(ev.end))}`
      const location = ev.location ? ` (${ev.location})` : ''
      lines.push(`• ${timeStr} — ${ev.title}${location}`)
    })
  }

  // Total busy time
  const totalMinutes = timedEvents.reduce((sum, ev) => {
    return sum + (new Date(ev.end).getTime() - new Date(ev.start).getTime()) / 60000
  }, 0)

  if (totalMinutes > 0) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.round(totalMinutes % 60)
    lines.push('')
    if (hours > 0) {
      lines.push(`**Total scheduled time:** ${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minutes` : ''}.`)
    } else if (minutes > 0) {
      lines.push(`**Total scheduled time:** ${minutes} minutes.`)
    }
  }

  return lines.join('\n')
}

// Motivational quotes
const QUOTES = [
  { text: '不要一起一落，要持续性动作', author: '' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: '每一个不曾起舞的日子，都是对生命的辜负', author: '尼采' },
  { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { text: '种一棵树最好的时间是十年前，其次是现在', author: '' },
  { text: 'Stay focused and keep moving forward!', author: '' },
  { text: 'Small steps lead to big changes.', author: '' }
]

export default function DailyPlannerPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTodo, setNewTodo] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    description: ''
  })
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'simple'>('simple')
  const [quote, setQuote] = useState(QUOTES[0])
  const [calendarSources, setCalendarSources] = useState<CalendarSource[]>([])
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newSourceName, setNewSourceName] = useState('')
  const [newSourceUrl, setNewSourceUrl] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const weekDates = getWeekDates(currentDate)

  // Initialize calendar sources with defaults
  useEffect(() => {
    const savedSources = localStorage.getItem('calendar_sources')
    if (savedSources) {
      setCalendarSources(JSON.parse(savedSources))
    } else {
      // First time - set default sources
      setCalendarSources(DEFAULT_CALENDAR_SOURCES)
      localStorage.setItem('calendar_sources', JSON.stringify(DEFAULT_CALENDAR_SOURCES))
    }
    const savedLastSync = localStorage.getItem('last_sync_time')
    if (savedLastSync) {
      setLastSyncTime(new Date(savedLastSync))
    }
  }, [])

  // Save calendar sources
  useEffect(() => {
    if (calendarSources.length > 0) {
      localStorage.setItem('calendar_sources', JSON.stringify(calendarSources))
    }
  }, [calendarSources])

  // Load todos from API
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const dateKey = currentDate.toISOString().split('T')[0]
        const response = await fetch(`/api/daily-todos?date=${dateKey}`)
        if (response.ok) {
          const data = await response.json()
          setTodos(data)
        }
      } catch (error) {
        console.error('Failed to fetch todos:', error)
      }
    }
    fetchTodos()
  }, [currentDate])

  // Random quote on date change
  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])
  }, [currentDate])

  // Load manual events
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar_events')
    if (savedEvents) {
      const parsed = JSON.parse(savedEvents)
      setEvents(parsed.map((e: CalendarEvent) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
      })))
    }
  }, [])

  // Load synced events
  useEffect(() => {
    const savedSyncedEvents = localStorage.getItem('synced_calendar_events')
    if (savedSyncedEvents) {
      const parsed = JSON.parse(savedSyncedEvents)
      setSyncedEvents(parsed.map((e: CalendarEvent) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end)
      })))
    }
  }, [])

  // Save manual events
  useEffect(() => {
    localStorage.setItem('calendar_events', JSON.stringify(events))
  }, [events])

  // Save synced events
  useEffect(() => {
    localStorage.setItem('synced_calendar_events', JSON.stringify(syncedEvents))
  }, [syncedEvents])

  const allEvents = [...events, ...syncedEvents]

  // Sync calendars
  const syncCalendars = async () => {
    setIsSyncing(true)
    const newSyncedEvents: CalendarEvent[] = []

    // Fetch events from T564A backend (Google Calendar + Canvas + Outlook)
    try {
      const gcalResponse = await fetch('/api/gcal')
      if (gcalResponse.ok) {
        const data = await gcalResponse.json()
        if (data.status === 'ok' && Array.isArray(data.events)) {
          for (const event of data.events) {
            // Parse the event from T564A format
            const calEvent: CalendarEvent = {
              id: event.id || `gcal-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              title: event.summary || event.title || 'Untitled',
              start: new Date(event.start?.dateTime || event.start?.date || event.start_time || event.start),
              end: new Date(event.end?.dateTime || event.end?.date || event.end_time || event.end),
              location: event.location,
              description: event.description,
              source: event.source || 'Google',
              allDay: !!(event.start?.date && !event.start?.dateTime),
            }
            newSyncedEvents.push(calEvent)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch from Google Calendar:', error)
    }

    // Also sync ICS feeds (Canvas, Outlook, etc.)
    for (const source of calendarSources.filter(s => s.enabled)) {
      try {
        const proxyUrl = `/api/calendar-proxy?url=${encodeURIComponent(source.url)}`
        const response = await fetch(proxyUrl)

        if (response.ok) {
          const icsContent = await response.text()
          const parsedEvents = parseICS(icsContent, source.name)
          // Deduplicate - don't add if already have event with same title and time
          for (const event of parsedEvents) {
            const isDuplicate = newSyncedEvents.some(e =>
              e.title === event.title &&
              Math.abs(new Date(e.start).getTime() - new Date(event.start).getTime()) < 60000
            )
            if (!isDuplicate) {
              newSyncedEvents.push(event)
            }
          }
        }
      } catch (error) {
        console.error(`Failed to sync ${source.name}:`, error)
      }
    }

    setSyncedEvents(newSyncedEvents)
    setLastSyncTime(new Date())
    localStorage.setItem('last_sync_time', new Date().toISOString())
    setIsSyncing(false)
  }

  const addCalendarSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) return

    const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-teal-500', 'bg-pink-500']
    const newSource: CalendarSource = {
      id: Date.now().toString(),
      name: newSourceName.trim(),
      url: newSourceUrl.trim(),
      color: colors[calendarSources.length % colors.length],
      enabled: true
    }

    setCalendarSources(prev => [...prev, newSource])
    setNewSourceName('')
    setNewSourceUrl('')
  }

  const removeCalendarSource = (id: string) => {
    setCalendarSources(prev => prev.filter(s => s.id !== id))
  }

  const toggleCalendarSource = (id: string) => {
    setCalendarSources(prev => prev.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ))
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const addTodo = async () => {
    if (!newTodo.trim()) return
    try {
      const dateKey = currentDate.toISOString().split('T')[0]
      const response = await fetch('/api/daily-todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, text: newTodo.trim() })
      })
      if (response.ok) {
        const todo = await response.json()
        setTodos(prev => [...prev, todo])
        setNewTodo('')
      }
    } catch (error) {
      console.error('Failed to add todo:', error)
    }
  }

  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    try {
      const response = await fetch('/api/daily-todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !todo.completed })
      })
      if (response.ok) {
        setTodos(prev => prev.map(t =>
          t.id === id ? { ...t, completed: !t.completed } : t
        ))
      }
    } catch (error) {
      console.error('Failed to toggle todo:', error)
    }
  }

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/daily-todos?id=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setTodos(prev => prev.filter(t => t.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete todo:', error)
    }
  }

  const clearCompletedTodos = async () => {
    try {
      const dateKey = currentDate.toISOString().split('T')[0]
      const response = await fetch(`/api/daily-todos/clear-completed?date=${dateKey}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setTodos(prev => prev.filter(t => !t.completed))
      }
    } catch (error) {
      console.error('Failed to clear completed todos:', error)
    }
  }

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) return

    setIsSaving(true)
    const [year, month, day] = newEvent.date.split('-').map(Number)
    const [startHour, startMinute] = newEvent.startTime.split(':').map(Number)
    const [endHour, endMinute] = newEvent.endTime.split(':').map(Number)

    const startDate = new Date(year, month - 1, day, startHour, startMinute)
    const endDate = new Date(year, month - 1, day, endHour, endMinute)

    // Try to create event in Google Calendar via T564A backend
    try {
      const response = await fetch('/api/gcal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: newEvent.title,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          location: newEvent.location || undefined,
          description: newEvent.description || undefined,
        }),
      })

      const data = await response.json()

      if (data.status === 'ok' && data.event) {
        // Successfully created in Google Calendar
        const gcalEvent: CalendarEvent = {
          id: data.event.id || Date.now().toString(),
          title: newEvent.title,
          start: startDate,
          end: endDate,
          location: newEvent.location || undefined,
          description: newEvent.description || undefined,
          source: 'Google'
        }
        setSyncedEvents(prev => [...prev, gcalEvent])
      } else {
        // Failed to create in Google Calendar, save locally
        console.warn('Failed to create in Google Calendar:', data.error)
        const localEvent: CalendarEvent = {
          id: Date.now().toString(),
          title: newEvent.title,
          start: startDate,
          end: endDate,
          location: newEvent.location || undefined,
          description: newEvent.description || undefined,
          source: 'Manual'
        }
        setEvents(prev => [...prev, localEvent])
      }
    } catch (error) {
      console.error('Error creating event:', error)
      // Fallback to local storage
      const localEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: newEvent.title,
        start: startDate,
        end: endDate,
        location: newEvent.location || undefined,
        description: newEvent.description || undefined,
        source: 'Manual'
      }
      setEvents(prev => [...prev, localEvent])
    }

    setIsSaving(false)
    setShowAddModal(false)
    setNewEvent({
      title: '',
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      description: ''
    })
  }

  const deleteEvent = async (event: CalendarEvent) => {
    // Check if it's a Canvas event (protected)
    if (event.source && ['Canvas', 'Harvard Canvas', 'MIT Canvas', 'HBS Canvas'].includes(event.source)) {
      alert('Canvas 事件不能在此删除，请在 Canvas 中操作。')
      return
    }

    if (!confirm('确定要删除这个事件吗？')) return

    // Close edit modal if open
    setShowEditModal(false)
    setEditingEvent(null)

    // If it's a Google Calendar event, delete from Google Calendar
    if (event.source === 'Google' || (event.id && !event.id.startsWith('ics-') && event.source !== 'Manual')) {
      setIsSaving(true)
      try {
        const response = await fetch(`/api/gcal?event_id=${encodeURIComponent(event.id)}&title=${encodeURIComponent(event.title)}&source=${encodeURIComponent(event.source || '')}`, {
          method: 'DELETE',
        })

        const data = await response.json()

        if (data.status === 'ok') {
          // Successfully deleted from Google Calendar
          setSyncedEvents(prev => prev.filter(e => e.id !== event.id))
        } else if (data.protected) {
          alert(data.error || '此事件受保护，无法删除。')
        } else {
          console.error('Failed to delete from Google Calendar:', data.error)
          alert('删除失败：' + (data.error || '未知错误'))
        }
      } catch (error) {
        console.error('Error deleting event:', error)
        alert('删除失败，请稍后重试。')
      }
      setIsSaving(false)
    } else {
      // Local event, just remove from state
      setEvents(prev => prev.filter(e => e.id !== event.id))
    }
  }

  // Open edit modal with event data
  const openEditModal = (event: CalendarEvent) => {
    // Don't allow editing Canvas events
    if (event.source && ['Canvas', 'Harvard Canvas', 'MIT Canvas', 'HBS Canvas'].includes(event.source)) {
      alert('Canvas 事件不能在此编辑，请在 Canvas 中操作。')
      return
    }
    setEditingEvent(event)
    setShowEditModal(true)
  }

  // Handle editing an existing event
  const handleEditEvent = async () => {
    if (!editingEvent) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/gcal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: editingEvent.id,
          summary: editingEvent.title,
          start_time: editingEvent.start.toISOString(),
          end_time: editingEvent.end.toISOString(),
          location: editingEvent.location || undefined,
          description: editingEvent.description || undefined,
        }),
      })

      const data = await response.json()

      if (data.status === 'ok') {
        // Update in local state
        if (editingEvent.source === 'Google') {
          setSyncedEvents(prev => prev.map(e =>
            e.id === editingEvent.id ? editingEvent : e
          ))
        } else {
          setEvents(prev => prev.map(e =>
            e.id === editingEvent.id ? editingEvent : e
          ))
        }
      } else {
        console.error('Failed to update event:', data.error)
        alert('更新失败：' + (data.error || '未知错误'))
      }
    } catch (error) {
      console.error('Error updating event:', error)
      // If it's a local event, still update locally
      if (editingEvent.source === 'Manual') {
        setEvents(prev => prev.map(e =>
          e.id === editingEvent.id ? editingEvent : e
        ))
      } else {
        alert('更新失败，请稍后重试。')
      }
    }

    setIsSaving(false)
    setShowEditModal(false)
    setEditingEvent(null)
  }

  // Clear all old sample/manual events
  const clearSampleData = () => {
    if (confirm('Clear all manual events? (Synced events from calendars will remain)')) {
      setEvents([])
      localStorage.removeItem('calendar_events')
    }
  }

  // Print Simple View
  const printSimpleView = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const dateStr = formatDateFullEn(currentDate)
    const summary = generateNaturalLanguageSummary(currentDayEvents)
    const todoHtml = todos.map(t =>
      `<li style="margin: 8px 0; ${t.completed ? 'text-decoration: line-through; color: #999;' : ''}">${t.completed ? '☑' : '☐'} ${t.text}</li>`
    ).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Plan - ${dateStr}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          h1 { text-align: center; color: #333; }
          .date { text-align: center; color: #666; margin-bottom: 30px; }
          .quote { text-align: center; font-style: italic; color: #d97706; margin-bottom: 30px; }
          .summary { background: #fffbeb; padding: 20px; border-radius: 12px; margin-bottom: 30px; white-space: pre-wrap; line-height: 1.6; }
          .summary strong { display: block; margin-top: 15px; }
          .todos { background: #f9fafb; padding: 20px; border-radius: 12px; }
          .todos h2 { margin-top: 0; }
          .todos ul { list-style: none; padding: 0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>📅 Daily Plan</h1>
        <p class="date">${dateStr}</p>
        <p class="quote">"${quote.text}"${quote.author ? ` — ${quote.author}` : ''}</p>
        <div class="summary">${summary.replace(/\*\*/g, '').replace(/\n/g, '<br>')}</div>
        <div class="todos">
          <h2>To-Do List</h2>
          <ul>${todoHtml || '<li style="color: #999;">No tasks</li>'}</ul>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const getEventsForDay = useCallback((date: Date): CalendarEvent[] => {
    return allEvents.filter(event => isSameDay(new Date(event.start), date))
  }, [allEvents])

  const getEventPosition = (event: CalendarEvent): { top: number; height: number } => {
    const start = new Date(event.start)
    const end = new Date(event.end)
    const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes()
    const endMinutes = (end.getHours() - START_HOUR) * 60 + end.getMinutes()
    const top = (startMinutes / 60) * HOUR_HEIGHT
    const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24)
    return { top, height }
  }

  const currentDayEvents = getEventsForDay(currentDate).sort((a, b) =>
    new Date(a.start).getTime() - new Date(b.start).getTime()
  )
  const completedTodos = todos.filter(t => t.completed).length

  // Generate summary for simple view
  const simpleSummary = generateNaturalLanguageSummary(currentDayEvents)

  // Grid View Component
  const GridView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-0 h-full">
      {/* Week Navigation */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateWeek(-1)}
            className="w-9 h-9 rounded-lg border hover:bg-amber-50 hover:border-amber-300 text-gray-600"
          >
            ←
          </button>
          <div>
            <h2 className="font-bold text-gray-900">
              {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
            </h2>
            <span className="text-sm text-gray-500">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </span>
          </div>
          <button
            onClick={() => navigateWeek(1)}
            className="w-9 h-9 rounded-lg border hover:bg-amber-50 hover:border-amber-300 text-gray-600"
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            今天
          </button>
          <span className="text-sm text-gray-500">
            本周 <strong className="text-amber-600">{allEvents.filter(e => weekDates.some(d => isSameDay(d, new Date(e.start)))).length}</strong> 个事件
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-8 gap-1 min-w-[700px]">
          {/* Time Column */}
          <div className="flex flex-col pt-12">
            {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
              <div
                key={i}
                className="text-xs text-gray-400 text-right pr-2 font-medium"
                style={{ height: HOUR_HEIGHT }}
              >
                {String(START_HOUR + i).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDates.map((date, dayIndex) => (
            <div key={dayIndex} className="flex flex-col border rounded-lg overflow-hidden">
              <div
                className={`p-2 text-center border-b ${
                  isToday(date)
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                    : 'bg-gray-50'
                }`}
              >
                <div className={`text-xs font-semibold uppercase tracking-wide ${
                  isToday(date) ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {DAY_NAMES[dayIndex]}
                </div>
                <div className={`text-lg font-bold ${
                  isToday(date) ? 'text-green-600' : 'text-gray-800'
                }`}>
                  {date.getDate()}
                </div>
              </div>

              <div
                className="relative bg-white"
                style={{
                  height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT,
                  backgroundImage: `repeating-linear-gradient(
                    to bottom,
                    transparent,
                    transparent ${HOUR_HEIGHT - 1}px,
                    #f0f0f0 ${HOUR_HEIGHT - 1}px,
                    #f0f0f0 ${HOUR_HEIGHT}px
                  )`
                }}
              >
                {isToday(date) && (() => {
                  const now = new Date()
                  const minutes = (now.getHours() - START_HOUR) * 60 + now.getMinutes()
                  if (minutes >= 0 && minutes <= (END_HOUR - START_HOUR + 1) * 60) {
                    const top = (minutes / 60) * HOUR_HEIGHT
                    return (
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                        style={{ top }}
                      >
                        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                      </div>
                    )
                  }
                  return null
                })()}

                {getEventsForDay(date).map(event => {
                  const { top, height } = getEventPosition(event)
                  const isCanvasEvent = event.source && ['Canvas', 'Harvard Canvas', 'MIT Canvas', 'HBS Canvas'].includes(event.source)
                  return (
                    <div
                      key={event.id}
                      className={`absolute left-1 right-1 rounded-md px-1.5 py-0.5 text-white cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all z-10 group ${getEventColor(event.source)}`}
                      style={{ top, height, minHeight: 24 }}
                      onClick={() => !isCanvasEvent && openEditModal(event)}
                    >
                      <div className="text-sm font-semibold truncate">{event.title}</div>
                      {height > 30 && (
                        <div className="text-xs opacity-90">
                          {formatTime(new Date(event.start))}
                        </div>
                      )}
                      {/* Hover tooltip with full event details */}
                      <div className="absolute left-0 bottom-full mb-2 w-72 p-4 bg-gray-900 text-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                        <div className="font-bold text-base mb-1">{event.title}</div>
                        <div className="text-sm text-gray-300 mb-1">
                          {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                        </div>
                        {event.location && (
                          <div className="text-sm text-gray-300">📍 {event.location}</div>
                        )}
                        {event.description && (
                          <div className="text-sm text-gray-400 mt-1 line-clamp-2">{event.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">Source: {event.source || 'Unknown'}</div>
                        <div className="absolute left-4 bottom-0 translate-y-full border-8 border-transparent border-t-gray-900" />
                      </div>
                      {!isCanvasEvent && (
                        <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(event) }}
                            className="w-4 h-4 rounded-full bg-black/20 text-white text-xs flex items-center justify-center hover:bg-blue-500"
                            title="编辑"
                          >
                            ✎
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteEvent(event) }}
                            className="w-4 h-4 rounded-full bg-black/20 text-white text-xs flex items-center justify-center hover:bg-red-500"
                            title="删除"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">📅 <span className="text-amber-600">每日规划</span></h1>
            <p className="text-sm text-gray-500">Smart Calendar Integration</p>
          </div>
          <a
            href="https://web-production-b0a0.up.railway.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm font-medium flex items-center gap-2"
          >
            🔗 进入原应用
          </a>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                viewMode === 'simple'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📝 Simple
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Grid
            </button>
          </div>
          {/* Print button - Simple View only */}
          {viewMode === 'simple' && (
            <button
              onClick={printSimpleView}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Print daily plan"
            >
              🖨️
            </button>
          )}
          <button
            onClick={syncCalendars}
            disabled={isSyncing}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Sync calendars"
          >
            {isSyncing ? '⏳' : '🔄'}
          </button>
          <button
            onClick={clearSampleData}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Clear manual events"
          >
            🗑️
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            ⚙️
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
          >
            <span>+</span> Add Event
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-600 rounded"></span>
            Calendar Sources
          </h3>

          {/* Sync Status */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <button
              onClick={syncCalendars}
              disabled={isSyncing}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSyncing ? '⏳ Syncing...' : '🔄 Sync All'}
            </button>
            {lastSyncTime && (
              <span className="text-sm text-gray-500">
                Last sync: {lastSyncTime.toLocaleString()}
              </span>
            )}
            <span className="text-sm text-gray-500">
              {syncedEvents.length} events synced
            </span>
          </div>

          {/* Calendar Sources List */}
          <div className="space-y-2 mb-4">
            {calendarSources.map(source => (
              <div key={source.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={source.enabled}
                  onChange={() => toggleCalendarSource(source.id)}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className={`w-3 h-3 rounded-full ${source.color}`}></span>
                <span className="font-medium text-gray-800 flex-1">{source.name}</span>
                <button
                  onClick={() => removeCalendarSource(source.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add New Source */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Add Calendar Source</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                className="w-32 px-3 py-2 border rounded-lg text-gray-900"
                placeholder="Name"
              />
              <input
                type="url"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-gray-900"
                placeholder="ICS URL (https://...)"
              />
              <button
                onClick={addCalendarSource}
                disabled={!newSourceName.trim() || !newSourceUrl.trim()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {/* Main View - Full width */}
        {viewMode === 'simple' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-0 h-full overflow-auto">
            <div className="p-8 max-w-2xl mx-auto w-full">
              {/* Greeting */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Hi! 👋</h2>
                <p className="text-lg text-amber-600 italic mb-4">
                  &ldquo;{quote.text}&rdquo;
                  {quote.author && <span className="text-gray-500"> — {quote.author}</span>}
                </p>
                <p className="text-gray-600">{formatDateFullEn(currentDate)}</p>
                {isToday(currentDate) && (
                  <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Today
                  </span>
                )}
              </div>

              {/* Date Navigation */}
              <div className="flex justify-center items-center gap-4 mb-8">
                <button
                  onClick={() => navigateDay(-1)}
                  className="w-10 h-10 rounded-full border-2 border-amber-200 hover:bg-amber-50 hover:border-amber-400 text-amber-600 flex items-center justify-center text-lg font-bold transition"
                >
                  ‹
                </button>
                {!isToday(currentDate) && (
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                  >
                    Go to Today
                  </button>
                )}
                <button
                  onClick={() => navigateDay(1)}
                  className="w-10 h-10 rounded-full border-2 border-amber-200 hover:bg-amber-50 hover:border-amber-400 text-amber-600 flex items-center justify-center text-lg font-bold transition"
                >
                  ›
                </button>
              </div>

              {/* Natural Language Summary */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-8">
                <div className="prose prose-amber max-w-none">
                  {simpleSummary.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={i} className="font-bold text-gray-900 mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>
                    }
                    if (line.startsWith('•')) {
                      return <p key={i} className="text-gray-700 ml-4 my-1">{line}</p>
                    }
                    if (line === '') {
                      return <div key={i} className="h-2" />
                    }
                    return <p key={i} className="text-gray-700 my-1">{line.replace(/\*\*/g, '')}</p>
                  })}
                </div>
              </div>

              {/* Today's To-Do */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Today&apos;s To-Do</h3>
                  {completedTodos > 0 && (
                    <button
                      onClick={clearCompletedTodos}
                      className="text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1"
                    >
                      🧹 Clear completed
                    </button>
                  )}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); addTodo(); }} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Add a new task..."
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Add
                  </button>
                </form>
                <ul className="space-y-2">
                  {todos.map(todo => (
                    <li
                      key={todo.id}
                      className={`flex items-center gap-3 p-3 rounded-lg bg-white border ${todo.completed ? 'opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        className="w-5 h-5 accent-amber-600"
                      />
                      <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {todo.text}
                      </span>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="text-gray-400 hover:text-red-500 text-lg"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                  {todos.length === 0 && (
                    <li className="text-center text-gray-400 py-6">
                      Nothing on your to-do list yet. Add a task to get started.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : <GridView />}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="font-bold text-gray-900">Add New Event</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  placeholder="e.g., Team Meeting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 resize-none"
                  rows={2}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.date || isSaving}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {isSaving ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="font-bold text-gray-900">Edit Event</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditingEvent(null) }}
                className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  placeholder="e.g., Team Meeting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={editingEvent.start.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const [year, month, day] = e.target.value.split('-').map(Number)
                    setEditingEvent(prev => {
                      if (!prev) return null
                      const newStart = new Date(prev.start)
                      newStart.setFullYear(year, month - 1, day)
                      const newEnd = new Date(prev.end)
                      newEnd.setFullYear(year, month - 1, day)
                      return { ...prev, start: newStart, end: newEnd }
                    })
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={`${String(editingEvent.start.getHours()).padStart(2, '0')}:${String(editingEvent.start.getMinutes()).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number)
                      setEditingEvent(prev => {
                        if (!prev) return null
                        const newStart = new Date(prev.start)
                        newStart.setHours(hours, minutes)
                        return { ...prev, start: newStart }
                      })
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={`${String(editingEvent.end.getHours()).padStart(2, '0')}:${String(editingEvent.end.getMinutes()).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number)
                      setEditingEvent(prev => {
                        if (!prev) return null
                        const newEnd = new Date(prev.end)
                        newEnd.setHours(hours, minutes)
                        return { ...prev, end: newEnd }
                      })
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editingEvent.location || ''}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, location: e.target.value } : null)}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 resize-none"
                  rows={2}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => editingEvent && deleteEvent(editingEvent)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                disabled={isSaving}
              >
                Delete
              </button>
              <div className="flex-1" />
              <button
                onClick={() => { setShowEditModal(false); setEditingEvent(null) }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleEditEvent}
                disabled={!editingEvent.title || isSaving}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
