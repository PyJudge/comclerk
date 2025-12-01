// [COMCLERK-MODIFIED] 2024-12-01: Sessions 링크를 /dashboard/sessions로 변경
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSessions, useCreateSession } from '@/hooks'
import { useRouter } from 'next/navigation'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true) // Default collapsed
  const pathname = usePathname()
  const router = useRouter()
  const { data: sessions } = useSessions()
  const createSession = useCreateSession()

  const handleNewSession = async () => {
    try {
      const session = await createSession.mutateAsync(undefined)
      if (session?.id) {
        router.push(`/dashboard/session/${session.id}`)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const navItems = [
    {
      href: '/dashboard/sessions',
      label: 'Sessions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
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

      {/* Expand button when collapsed - positioned below header */}
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

      {/* New Session Button */}
      <div className={cn('p-2', !isCollapsed && 'p-4')}>
        <button
          onClick={handleNewSession}
          disabled={createSession.isPending}
          className={cn(
            'w-full py-2.5 rounded-lg',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors',
            'flex items-center justify-center gap-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isCollapsed ? 'px-2' : 'px-4'
          )}
          title={isCollapsed ? 'New Session' : undefined}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {!isCollapsed && (createSession.isPending ? 'Creating...' : 'New Session')}
        </button>
      </div>

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

      {/* Recent Sessions */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto mt-4 px-2">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Recent Sessions
          </h3>
          <div className="space-y-1">
            {sessions?.slice(0, 10).map((session) => {
              const isActive = pathname === `/dashboard/session/${session.id}`
              return (
                <Link
                  key={session.id}
                  href={`/dashboard/session/${session.id}`}
                  className={cn(
                    'block px-3 py-2 rounded-lg text-sm truncate transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                >
                  {session.title || 'Untitled Session'}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t text-xs text-muted-foreground">
          <p>OpenCode v0.1.0</p>
        </div>
      )}
    </aside>
  )
}
