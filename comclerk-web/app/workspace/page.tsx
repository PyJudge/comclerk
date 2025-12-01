// [COMCLERK-ADDED] 2024-12-01: 워크스페이스 페이지 (3패널 레이아웃 + 채팅)

'use client'

import { useState, useEffect } from 'react'
import { WorkspaceLayout } from '@/components/layout/workspace-layout'
import { ChatContainer } from '@/components/chat/chat-container'
import { useSessions, useCreateSession } from '@/hooks'
import { Plus } from 'lucide-react'

export default function WorkspacePage() {
  const { data: sessions, isLoading: sessionsLoading } = useSessions()
  const createSession = useCreateSession()
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // 세션이 있으면 첫 번째 세션을 선택
  useEffect(() => {
    if (!currentSessionId && sessions && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id)
    }
  }, [sessions, currentSessionId])

  // 새 세션 생성
  const handleCreateSession = async () => {
    try {
      const session = await createSession.mutateAsync('PDF 분석 세션')
      setCurrentSessionId(session.id)
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  return (
    <WorkspaceLayout>
      {/* 우측 패널 - 채팅 */}
      <div className="flex flex-col h-full bg-zinc-900">
        {/* 세션 헤더 */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">채팅</h2>
          <button
            onClick={handleCreateSession}
            disabled={createSession.isPending}
            className="p-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors disabled:opacity-50"
            title="새 세션"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 min-h-0">
          {sessionsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : currentSessionId ? (
            <ChatContainer sessionId={currentSessionId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 mb-4 text-zinc-700">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2 text-zinc-300">채팅을 시작하세요</h3>
              <p className="text-zinc-500 text-sm mb-4">
                PDF 문서에 대해 질문하려면 새 세션을 만드세요
              </p>
              <button
                onClick={handleCreateSession}
                disabled={createSession.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                새 세션 시작
              </button>
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  )
}
