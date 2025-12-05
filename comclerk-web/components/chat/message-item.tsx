// [COMCLERK-MODIFIED] 2025-12-02: Assistant → ComClerk 이름 변경, Streamdown 마크다운 렌더링 추가
'use client'

import { cn } from '@/lib/utils'
import { ToolOutput } from '../tool/tool-output'
import { SubtaskOutput } from '../tool/subtask-output'
import { Message, SubtaskPart } from '@/types'
import { Streamdown } from 'streamdown'

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'

  // Filter out step-start and step-finish parts
  const displayParts = message.parts?.filter(
    (part) => part.type !== 'step-start' && part.type !== 'step-finish'
  )

  return (
    <div
      className={cn(
        'w-full border-b border-border',
        isUser ? 'bg-primary/5' : 'bg-background'
      )}
    >
      <div className="py-4 px-4">
        {/* Role indicator */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={cn(
              'text-xs font-semibold uppercase tracking-wide',
              isUser ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {isUser ? '> 권판사' : '● 컴연권'}
          </span>
          {!isUser && message.modelID && (
            <span className="text-xs text-muted-foreground">
              ({message.modelID})
            </span>
          )}
        </div>

        {/* Message content */}
        <div className="space-y-3">
          {message.error && (
            <div className="p-3 rounded bg-destructive/10 text-destructive text-sm font-mono">
              Error: {message.error.message || message.error.type}
            </div>
          )}

          {displayParts?.map((part) => (
            <div key={part.id}>
              {part.type === 'text' && 'text' in part && part.text && (
                <div className="font-sans leading-relaxed whitespace-pre-wrap" style={{ fontSize: '15px' }}>
                  {isUser ? (
                    // User messages: plain text without markdown
                    part.text
                  ) : (
                    // Assistant messages: render markdown
                    <Streamdown isAnimating={!message.time?.completed}>
                      {part.text}
                    </Streamdown>
                  )}
                </div>
              )}

              {part.type === 'tool' && (
                <ToolOutput part={part} />
              )}

              {part.type === 'subtask' && (
                <SubtaskOutput part={part as SubtaskPart} />
              )}

              {part.type === 'reasoning' && 'text' in part && part.text && (
                <details className="text-sm text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground text-xs font-mono">
                    [Reasoning]
                  </summary>
                  <div className="mt-2 p-3 rounded bg-muted/50 whitespace-pre-wrap font-mono text-xs">
                    {part.text}
                  </div>
                </details>
              )}
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}
