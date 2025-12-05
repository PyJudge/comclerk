'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { SubtaskPart } from '@/types'

interface SubtaskOutputProps {
  part: SubtaskPart
}

export function SubtaskOutput({ part }: SubtaskOutputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const state = part.state || 'pending'

  const stateConfig: Record<string, { color: string; bg: string }> = {
    pending: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
    running: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    completed: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    error: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  }

  const config = stateConfig[state] ?? stateConfig.pending

  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', config.bg, config.color)}>
            {state === 'running' ? '⏳' : state === 'completed' ? '✓' : state === 'error' ? '✕' : '○'}
          </span>
          <span className="font-mono text-sm font-medium">{part.agent}</span>
          <span className="text-xs text-muted-foreground truncate">{part.description}</span>
        </div>
        <svg
          className={cn('w-4 h-4 transition-transform flex-shrink-0', isExpanded && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t">
          {/* Prompt */}
          <div className="p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Prompt</div>
            <div className="text-sm">{part.prompt}</div>
          </div>

          {/* Output */}
          {part.output && (
            <div className="max-h-96 overflow-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none p-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {part.output}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Running state */}
          {!part.output && state === 'running' && (
            <div className="p-3 text-sm text-muted-foreground">Running...</div>
          )}
        </div>
      )}
    </div>
  )
}
