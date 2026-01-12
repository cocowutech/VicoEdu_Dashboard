'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSidebar } from '@/contexts/SidebarContext'

// All navigation items with role restrictions
const allNavItems = [
  { href: '/', label: '战略概览', icon: '📊', adminOnly: true },
  { href: '/products', label: '产品矩阵', icon: '📦', adminOnly: true },
  { href: '/funnel', label: '用户旅程', icon: '🎯', adminOnly: true },
  { href: '/calculator', label: '财务计算器', icon: '💰', adminOnly: true },
  { href: '/commission', label: '运营分配', icon: '👥', adminOnly: false },
  { href: '/daily', label: '每日规划', icon: '📅', adminOnly: true },
]

// Helper to get cookie value
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check user role from cookie
  useEffect(() => {
    const user = getCookie('vico_user')
    setUserName(user ? decodeURIComponent(user) : null)
    // Staff users: Echo, Zoey
    setIsStaff(user === 'Echo' || user === 'Zoey')
  }, [])

  // Filter nav items based on role
  const navItems = isStaff
    ? allNavItems.filter(item => !item.adminOnly)
    : allNavItems

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  const handleNavClick = () => {
    if (isMobile) {
      closeMobile()
    }
  }

  // 侧边栏宽度类
  const sidebarWidth = isCollapsed && !isMobileOpen ? 'w-16' : 'w-64'

  // 移动端：当侧边栏打开时显示，否则隐藏
  // 桌面端：始终显示
  const mobileVisibility = isMobile
    ? isMobileOpen
      ? 'translate-x-0'
      : '-translate-x-full'
    : 'translate-x-0'

  return (
    <>
      {/* 移动端遮罩层 */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`
          ${sidebarWidth}
          ${mobileVisibility}
          bg-gradient-to-b from-stone-800 via-stone-850 to-stone-900
          h-screen fixed left-0 top-0 flex flex-col shadow-2xl
          transition-all duration-300 ease-in-out z-50
        `}
      >
        {/* Logo Section */}
        <div className="p-4 lg:p-6 border-b border-amber-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="overflow-hidden transition-all duration-300">
                <h1 className="text-lg font-bold text-amber-50 tracking-tight whitespace-nowrap">Vico Education</h1>
                <p className="text-xs text-stone-400 whitespace-nowrap">
                  {userName ? `👤 ${userName}` : '战略仪表盘'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 收缩按钮 - 仅桌面端显示 */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-lg hover:bg-amber-500 transition-colors z-10"
            title={isCollapsed ? '展开侧边栏' : '收缩侧边栏'}
          >
            <span className={`text-xs transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}>
              ›
            </span>
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 lg:p-4 overflow-y-auto">
          {(!isCollapsed || isMobileOpen) && (
            <div className="mb-3 px-3">
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">导航菜单</span>
            </div>
          )}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-lg shadow-amber-900/40'
                        : 'text-stone-400 hover:bg-amber-900/20 hover:text-amber-100'
                    } ${isCollapsed && !isMobileOpen ? 'justify-center' : ''}`}
                    title={isCollapsed && !isMobileOpen ? item.label : undefined}
                  >
                    <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {item.icon}
                    </span>
                    {(!isCollapsed || isMobileOpen) && (
                      <>
                        <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-200 animate-pulse" />
                        )}
                      </>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-2 lg:p-4 border-t border-amber-900/20 space-y-2 lg:space-y-3">
          {/* Status indicator */}
          <div className={`flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg bg-amber-900/10`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {(!isCollapsed || isMobileOpen) && (
                <span className="text-xs text-stone-400 whitespace-nowrap">系统正常</span>
              )}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <span className="text-[10px] text-stone-500">v2.0</span>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`w-full flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-center gap-2'} px-4 py-2.5 rounded-xl text-stone-400 hover:bg-red-900/20 hover:text-red-300 transition-all disabled:opacity-50 group`}
            title={isCollapsed && !isMobileOpen ? '退出登录' : undefined}
          >
            <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
            {(!isCollapsed || isMobileOpen) && (
              <span className="text-sm font-medium whitespace-nowrap">{loggingOut ? '退出中...' : '退出登录'}</span>
            )}
          </button>

          {/* Quote - only show when expanded */}
          {(!isCollapsed || isMobileOpen) && (
            <p className="text-[10px] text-stone-500 text-center italic leading-relaxed px-2">
              「不要一起一落，要持续性动作」
            </p>
          )}
        </div>
      </aside>
    </>
  )
}
