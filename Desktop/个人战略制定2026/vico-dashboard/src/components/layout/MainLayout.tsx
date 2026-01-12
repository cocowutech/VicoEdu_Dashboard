'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'

function MobileHeader() {
  const { toggleMobile } = useSidebar()

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-stone-800 shadow-lg z-30 flex items-center justify-between px-4 no-print">
      {/* 汉堡菜单按钮 */}
      <button
        onClick={toggleMobile}
        className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 text-amber-50 hover:bg-amber-900/30 rounded-lg transition-colors"
        aria-label="打开菜单"
      >
        <span className="w-5 h-0.5 bg-current rounded-full"></span>
        <span className="w-5 h-0.5 bg-current rounded-full"></span>
        <span className="w-5 h-0.5 bg-current rounded-full"></span>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
        <span className="text-amber-50 font-semibold text-sm">Vico Education</span>
      </div>

      {/* 占位 */}
      <div className="w-10"></div>
    </header>
  )
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 计算主内容区域的左边距
  const mainMargin = isMobile
    ? 'ml-0 pt-14' // 移动端无边距，但需要顶部空间给 header
    : isCollapsed
    ? 'ml-16' // 桌面端收缩状态
    : 'ml-64' // 桌面端展开状态

  return (
    <>
      <MobileHeader />
      <Sidebar />
      <main className={`${mainMargin} min-h-screen p-4 sm:p-6 lg:p-8 transition-all duration-300`}>
        <div className="animate-fade-in max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </>
  )
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-stone-50 to-orange-50/30">
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  )
}
