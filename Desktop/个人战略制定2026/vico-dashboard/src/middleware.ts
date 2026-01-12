import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pages that staff role can access
const STAFF_ALLOWED_PAGES = ['/commission', '/login']

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('vico_auth')
  const roleCookie = request.cookies.get('vico_role')
  const isAuthenticated = authCookie?.value === 'authenticated'
  const userRole = roleCookie?.value || 'admin'
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  const currentPath = request.nextUrl.pathname

  // 不拦截 API 路由
  if (isApiRoute) {
    return NextResponse.next()
  }

  // 已登录用户访问登录页
  if (isAuthenticated && isLoginPage) {
    // Staff users redirect to commission page, admin to home
    if (userRole === 'staff') {
      return NextResponse.redirect(new URL('/commission', request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 未登录用户访问其他页面，重定向到登录页
  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Staff role restriction - can only access commission page
  if (isAuthenticated && userRole === 'staff') {
    const isAllowedPage = STAFF_ALLOWED_PAGES.some(page =>
      currentPath === page || currentPath.startsWith(page + '/')
    )
    if (!isAllowedPage) {
      return NextResponse.redirect(new URL('/commission', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
