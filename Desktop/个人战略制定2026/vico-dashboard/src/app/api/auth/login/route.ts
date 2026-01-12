import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// User accounts with roles
// admin: full access to all pages
// staff: only access to commission page
const USERS = [
  { username: 'vicoedu', password: 'million$offer', role: 'admin', name: 'Vico Admin' },
  { username: 'echo', password: 'echo2024', role: 'staff', name: 'Echo' },
  { username: 'zoey', password: 'zoey2024', role: 'staff', name: 'Zoey' },
]

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const user = USERS.find(u => u.username === username && u.password === password)

    if (user) {
      const cookieStore = await cookies()

      // 设置认证 cookie，7天有效期
      cookieStore.set('vico_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      // 设置用户角色 cookie
      cookieStore.set('vico_role', user.role, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      // 设置用户名 cookie (non-httpOnly so client can read it)
      cookieStore.set('vico_user', user.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return NextResponse.json({ success: true, role: user.role, name: user.name })
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
