'use client'

import { useEffect, useRef } from 'react'
import { MessageItem } from './message-item'
import { Message } from '@/types'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
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
        <div className="text-4xl mb-4">●</div>
        <h3 className="text-lg font-medium mb-1">Start a conversation</h3>
        <p className="text-muted-foreground text-sm">
          Type a message below to start chatting.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
