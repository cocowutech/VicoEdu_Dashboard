import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
    hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
    tursoUrlPrefix: process.env.TURSO_DATABASE_URL?.substring(0, 30) || 'not set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
}
