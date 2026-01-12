import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const VALID_USERNAME = 'vicoedu'
const VALID_PASSWORD = 'million$offer'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      const cookieStore = await cookies()

      // 设置认证 cookie，7天有效期
      cookieStore.set('vico_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: '用户名或密码错误' },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { error: '登录失败' },
      { status: 500 }
    )
  }
}
