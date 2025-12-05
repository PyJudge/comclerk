// [COMCLERK-MODIFIED] 2025-12-02: 생성 중 상태 추적 추가
// [COMCLERK-MODIFIED] 2025-12-05: Permission 승인 UI 추가 및 polling 기반으로 변경
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSessionMessages, useSessionEvents, useMessagePolling, usePermissionReply, usePermissionPolling } from '@/hooks'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'
import { useChatStore } from '@/stores/chat-store'
import type { Permission, Event } from '@/types'

interface ChatContainerProps {
  sessionId: string
}

export function ChatContainer({ sessionId }: ChatContainerProps) {
  const { data: messages, isLoading } = useSessionMessages(sessionId)
  const { startPolling } = useMessagePolling(sessionId)
  const setIsGenerating = useChatStore((state) => state.setIsGenerating)
  const replyMutation = usePermissionReply()

  // Poll for pending permissions
  const { data: permissions = [] } = usePermissionPolling(sessionId)
  const currentPermission = permissions[0] || null
  const permissionRef = useRef<Permission | null>(null)

  // Sync ref with current permission
  useEffect(() => {
    permissionRef.current = currentPermission
  }, [currentPermission])

  // Handle permission.updated events from SSE (secondary source)
  const handleEvent = useCallback((event: Event) => {
    console.log('[ChatContainer] Event received:', event.type, event)
    if (event.type === 'permission.updated') {
      console.log('[ChatContainer] Permission event (will be picked up by polling):', event.properties)
    }
  }, [])

  // Subscribe to session events for logging
  useSessionEvents(sessionId, handleEvent)

  const handlePermissionReply = async (response: 'once' | 'always' | 'reject') => {
    const permission = permissionRef.current
    if (!permission) return

    console.log('[ChatContainer] Replying to permission:', permission.id, response)
    try {
      await replyMutation.mutateAsync({
        sessionId: permission.sessionID,
        permissionId: permission.id,
        response,
      })
      console.log('[ChatContainer] Permission reply success, clearing permission')
      setCurrentPermission(null)
    } catch (error) {
      console.error('Failed to reply to permission:', error)
    }
  }

  // Keyboard shortcuts: 1=Once, 2=Always, 3=Reject
  useEffect(() => {
    if (!currentPermission) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        e.preventDefault()
        handlePermissionReply('once')
      } else if (e.key === '2') {
        e.preventDefault()
        handlePermissionReply('always')
      } else if (e.key === '3') {
        e.preventDefault()
        handlePermissionReply('reject')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPermission])

  // Track generating state based on incomplete assistant messages
  useEffect(() => {
    if (!messages || messages.length === 0) return

    // Check if there's any assistant message currently being generated (no completed time)
    const hasIncompleteAssistant = messages.some(
      (m) => m.role === 'assistant' && !m.time?.completed
    )

    // Check if last message is user (waiting for response)
    const lastMessage = messages[messages.length - 1]
    const isWaitingForResponse = lastMessage.role === 'user'

    // isGenerating = true if waiting for response OR assistant is generating
    const shouldBeGenerating = isWaitingForResponse || hasIncompleteAssistant

    setIsGenerating(shouldBeGenerating)
  }, [messages, setIsGenerating])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 메시지 목록 - 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <MessageList
          messages={messages ?? []}
          isLoading={isLoading}
          currentPermission={currentPermission}
          onPermissionReply={handlePermissionReply}
          isPermissionPending={replyMutation.isPending}
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
