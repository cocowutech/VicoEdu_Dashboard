import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // Validate URL
    const parsedUrl = new URL(url)

    // Only allow HTTPS URLs for security
    if (parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 })
    }

    // Fetch the ICS file
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CalendarSync/1.0)',
        'Accept': 'text/calendar, application/ics, text/plain'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch calendar: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const icsContent = await response.text()

    // Validate that it looks like an ICS file
    if (!icsContent.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json(
        { error: 'Invalid ICS file format' },
        { status: 400 }
      )
    }

    // Return the ICS content
    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    })
  } catch (error) {
    console.error('Calendar proxy error:', error)

    if (error instanceof TypeError && error.message.includes('URL')) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch calendar' },
      { status: 500 }
    )
  }
}
