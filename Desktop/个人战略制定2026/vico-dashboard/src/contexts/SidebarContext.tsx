'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggleCollapse: () => void
  toggleMobile: () => void
  closeMobile: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // 移动端默认收缩侧边栏
      if (mobile) {
        setIsCollapsed(true)
        setIsMobileOpen(false)
      }
    }

    // 初始检测
    checkMobile()

    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 从本地存储读取桌面端的收缩状态
  useEffect(() => {
    if (!isMobile) {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved))
      }
    }
  }, [isMobile])

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const newValue = !prev
      // 只在桌面端保存状态
      if (!isMobile) {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newValue))
      }
      return newValue
    })
  }

  const toggleMobile = () => {
    setIsMobileOpen(prev => !prev)
  }

  const closeMobile = () => {
    setIsMobileOpen(false)
  }

  return (
    <SidebarContext.Provider value={{
      isCollapsed: isMobile ? true : isCollapsed,
      isMobileOpen,
      toggleCollapse,
      toggleMobile,
      closeMobile
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
