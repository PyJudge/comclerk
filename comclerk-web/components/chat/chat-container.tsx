'use client'

import { useSessionMessages, useSessionEvents, useMessagePolling } from '@/hooks'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'

interface ChatContainerProps {
  sessionId: string
}

export function ChatContainer({ sessionId }: ChatContainerProps) {
  const { data: messages, isLoading } = useSessionMessages(sessionId)
  const { startPolling } = useMessagePolling(sessionId)

  // Subscribe to session events for real-time updates (fallback)
  useSessionEvents(sessionId)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 메시지 목록 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <MessageList
          messages={messages ?? []}
          isLoading={isLoading}
        />
      </div>
      {/* 입력창 - 하단 고정 */}
      <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-900 p-4">
        <MessageInput
          sessionId={sessionId}
          onMessageSent={startPolling}
        />
      </div>
    </div>
  )
}
