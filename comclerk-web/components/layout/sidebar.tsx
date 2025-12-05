// [COMCLERK-MODIFIED] 2024-12-01: Sessions 링크를 /dashboard/sessions로 변경
// [COMCLERK-MODIFIED] 2025-12-01: Agent 설정 버튼 추가, 세션 드롭다운 구현
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSessions, useCreateSession } from '@/hooks'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session-store'
import { Bot, ChevronDown, Plus, Settings, MessageSquare } from 'lucide-react'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [sessionDropdownOpen, setSessionDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { data: sessions } = useSessions()
  const createSession = useCreateSession()
  const { currentSession } = useSessionStore()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSessionDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNewSession = async () => {
    setSessionDropdownOpen(false)
    try {
      const session = await createSession.mutateAsync(undefined)
      if (session?.id) {
        router.push(`/dashboard/session/${session.id}`)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleSelectSession = (sessionId: string) => {
    setSessionDropdownOpen(false)
    router.push(`/dashboard/session/${sessionId}`)
  }

  // Get current session title
  const currentSessionTitle = currentSession?.title || 'Select Session'

  const navItems = [
    {
      href: '/settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ]

  return (
    <aside
      className={cn(
        'border-r bg-muted/30 flex flex-col h-screen transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo & Toggle */}
      <div className="p-4 border-b flex items-center justify-between min-h-[60px]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">O</span>
          </div>
          {!isCollapsed && <span className="font-semibold text-lg">OpenCode</span>}
        </Link>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            title="Collapse sidebar"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="mx-auto mt-2 p-1.5 rounded-md hover:bg-accent transition-colors"
          title="Expand sidebar"
        >
          <svg
            className="w-4 h-4 rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Agent Settings Button */}
      <div className={cn('p-2', !isCollapsed && 'p-4')}>
        <Link
          href="/agents"
          className={cn(
            'w-full py-2.5 rounded-lg',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors',
            'flex items-center justify-center gap-2',
            isCollapsed ? 'px-2' : 'px-4'
          )}
          title={isCollapsed ? 'Agent Settings' : undefined}
        >
          <Bot className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && 'Agent Settings'}
        </Link>
      </div>

      {/* Session Dropdown */}
      {!isCollapsed && (
        <div className="px-4 pb-2" ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => setSessionDropdownOpen(!sessionDropdownOpen)}
              className={cn(
                'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg',
                'bg-muted/50 hover:bg-muted transition-colors',
                'text-sm font-medium'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">{currentSessionTitle}</span>
              </div>
              <ChevronDown className={cn(
                'w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform',
                sessionDropdownOpen && 'rotate-180'
              )} />
            </button>

            {/* Dropdown Menu */}
            {sessionDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-auto">
                {/* Session List */}
                {sessions && sessions.length > 0 ? (
                  sessions.slice(0, 10).map((session) => {
                    const isActive = pathname === `/dashboard/session/${session.id}`
                    return (
                      <button
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm truncate transition-colors',
                          isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                        )}
                      >
                        {session.title || 'Untitled Session'}
                      </button>
                    )
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No sessions yet
                  </div>
                )}

                {/* Divider */}
                <div className="my-1 border-t border-border" />

                {/* New Session Button */}
                <button
                  onClick={handleNewSession}
                  disabled={createSession.isPending}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm transition-colors',
                    'text-primary hover:bg-accent/50',
                    'flex items-center gap-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <Plus className="w-4 h-4" />
                  {createSession.isPending ? 'Creating...' : 'New Session'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed: Session icon with tooltip */}
      {isCollapsed && (
        <div className="px-2 pb-2">
          <Link
            href="/dashboard/sessions"
            className={cn(
              'flex items-center justify-center p-2 rounded-lg',
              'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              'transition-colors'
            )}
            title="Sessions"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t text-xs text-muted-foreground">
          <p>OpenCode v0.1.0</p>
        </div>
      )}
    </aside>
  )
}
