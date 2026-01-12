import { NextRequest, NextResponse } from 'next/server'

const SMART_CALENDAR_API = process.env.NEXT_PUBLIC_SMART_CALENDAR_API || 'https://web-production-b0a0.up.railway.app'

// GET /api/gcal - Get all events from Google Calendar
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${SMART_CALENDAR_API}/events`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { status: 'error', error: `Failed to fetch events: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { status: 'error', error: 'Failed to connect to calendar service' },
      { status: 500 }
    )
  }
}

// POST /api/gcal - Create a new event in Google Calendar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${SMART_CALENDAR_API}/events/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { status: 'error', error: `Failed to create event: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { status: 'error', error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

// PUT /api/gcal - Update an existing event in Google Calendar
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${SMART_CALENDAR_API}/events/update`, {
      method: 'POST', // T564A uses POST for updates
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { status: 'error', error: `Failed to update event: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { status: 'error', error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE /api/gcal - Delete an event from Google Calendar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const title = searchParams.get('title') || ''
    const source = searchParams.get('source') || ''

    if (!eventId) {
      return NextResponse.json(
        { status: 'error', error: 'event_id is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${SMART_CALENDAR_API}/events/delete`, {
      method: 'POST', // T564A uses POST for deletes
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_id: eventId,
        title: title,
        source: source,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { status: 'error', error: `Failed to delete event: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { status: 'error', error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
