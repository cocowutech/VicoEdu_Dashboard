import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('vico_auth')
  cookieStore.delete('vico_role')
  cookieStore.delete('vico_user')

  return NextResponse.json({ success: true })
}
