'use client'

import { useSessionMessages, useSessionEvents, useMessagePolling } from '@/hooks'
import { SessionHeader } from './session-header'
import { MessageList } from '../chat/message-list'
import { MessageInput } from '../chat/message-input'

interface SessionViewProps {
  sessionId: string
}

export function SessionView({ sessionId }: SessionViewProps) {
  const { data: messages, isLoading } = useSessionMessages(sessionId)
  const { isPolling, startPolling } = useMessagePolling(sessionId)

  // Subscribe to session events for real-time updates (fallback)
  useSessionEvents(sessionId)

  return (
    <div className="flex flex-col h-screen">
      <SessionHeader sessionId={sessionId} isRunning={isPolling} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages ?? []}
            isLoading={isLoading}
          />
        </div>
        <div className="border-t bg-background p-4">
          <MessageInput
            sessionId={sessionId}
            onMessageSent={startPolling}
          />
        </div>
      </div>
    </div>
  )
}
