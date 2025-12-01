"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/chat';

interface ChatPanelProps {
  messages?: ChatMessage[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  isTyping?: boolean;
  className?: string;
}

export function ChatPanel({ 
  messages = [], 
  onSendMessage, 
  isLoading = false,
  isTyping = false,
  className 
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지가 도착하면 메시지 영역 하단으로 스크롤
  const lastMessageContent = messages[messages.length - 1]?.content;
  
  // 메시지 변경 시 메시지 영역 스크롤 처리
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages.length, lastMessageContent]);

  const handleSendMessage = () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    onSendMessage?.(trimmedMessage);
    setInputValue('');
    
    // 포커스 유지
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* 메시지 영역 - 독립 스크롤 */}
      <div 
        className="flex-1 overflow-y-auto p-4 min-h-0"
        data-testid="chat-scroll-area"
      >
        <div className="space-y-4" data-testid="chat-message-container">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bot className="h-8 w-8 mb-2" />
              <p className="text-sm text-center">
                PDF 문서를 선택하고<br />
                궁금한 내용을 질문해보세요
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 max-w-[85%] overflow-hidden",
                    message.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  {/* 아바타 */}
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* 메시지 내용 */}
                  <div className={cn(
                    "rounded-lg px-3 py-2 text-sm max-w-full overflow-hidden",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}>
                    <div className="whitespace-pre-wrap break-words break-all">
                      {message.content}
                    </div>
                    <div className={cn(
                      "text-xs mt-1 opacity-70",
                      message.role === 'user' ? "text-right" : "text-left"
                    )}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}

              {/* 타이핑 인디케이터 */}
              {(isLoading || isTyping) && (
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-muted">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">답변 작성 중...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 스크롤 타겟 */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* 입력 영역 - 하단 고정 */}
      <div className="border-t p-4 bg-background" data-testid="chat-input-area">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="PDF 문서에 대해 질문해보세요..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Enter 키를 눌러 메시지를 전송하세요
        </p>
      </div>
    </div>
  );
}

export default React.memo(ChatPanel);