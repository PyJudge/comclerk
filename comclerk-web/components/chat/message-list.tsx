'use client'

import { useEffect, useRef } from 'react'
import { MessageItem } from './message-item'
import { PermissionInline } from '../permission/permission-inline'
import { Message, Permission } from '@/types'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  currentPermission?: Permission | null
  onPermissionReply?: (response: 'once' | 'always' | 'reject') => void
  isPermissionPending?: boolean
}

export function MessageList({
  messages,
  isLoading,
  currentPermission,
  onPermissionReply,
  isPermissionPending
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="text-4xl mb-4 text-zinc-600">●</div>
        <h3 className="text-lg font-medium mb-1 text-zinc-300">대화를 시작하세요</h3>
        <p className="text-zinc-500 text-sm">
          아래에 메시지를 입력하여 채팅을 시작하세요.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {currentPermission && onPermissionReply && (
        <PermissionInline
          permission={currentPermission}
          onReply={onPermissionReply}
          isPending={isPermissionPending}
        />
      )}
      <div ref={bottomRef} />
    </div>
  )
}
