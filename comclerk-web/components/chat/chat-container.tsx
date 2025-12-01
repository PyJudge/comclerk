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
  )
}
