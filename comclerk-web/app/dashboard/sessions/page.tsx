// [COMCLERK-ADDED] 2024-12-01: 세션 목록 페이지 (기존 dashboard 내용)
import { SessionList } from '@/components/session/session-list'
import Link from 'next/link'

export default function SessionsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-8 px-6">
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">All Sessions</h1>
            <p className="text-muted-foreground mt-1">
              Manage your coding assistant sessions
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-md border hover:bg-accent transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </header>
        <SessionList />
      </div>
    </div>
  )
}
