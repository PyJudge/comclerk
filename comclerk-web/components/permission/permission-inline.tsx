// [COMCLERK-ADDED] 2025-12-05: Inline permission UI for chat window
'use client'

import { Permission } from '@/types'
import { cn } from '@/lib/utils'

interface PermissionInlineProps {
  permission: Permission
  onReply: (response: 'once' | 'always' | 'reject') => void
  isPending?: boolean
}

function parseDiff(oldText: string, newText: string): { added: string[]; removed: string[] } {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const added: string[] = []
  const removed: string[] = []

  // Simple line-by-line diff
  const maxLen = Math.max(oldLines.length, newLines.length)
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i]
    const newLine = newLines[i]

    if (oldLine !== newLine) {
      if (oldLine !== undefined) removed.push(oldLine)
      if (newLine !== undefined) added.push(newLine)
    }
  }

  return { added, removed }
}

export function PermissionInline({ permission, onReply, isPending }: PermissionInlineProps) {
  const metadata = permission.metadata || {}
  const filePath = (metadata.file_path || metadata.path || '') as string
  const oldString = (metadata.old_string || '') as string
  const newString = (metadata.new_string || metadata.content || '') as string

  const diff = oldString && newString ? parseDiff(oldString, newString) : null

  return (
    <div data-testid="permission-inline" className="w-full max-w-3xl mx-auto px-4 py-4">
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-700">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-zinc-100">{permission.title}</h4>
            <p className="text-xs text-zinc-500 mt-0.5">{permission.type}</p>
          </div>
        </div>

        {/* File path */}
        {filePath && (
          <div className="mb-3">
            <div className="text-xs text-zinc-500 mb-1.5">파일</div>
            <div className="text-sm font-mono bg-zinc-900/50 px-3 py-2 rounded border border-zinc-700 text-zinc-300">
              {filePath}
            </div>
          </div>
        )}

        {/* Diff view */}
        {diff && (diff.removed.length > 0 || diff.added.length > 0) && (
          <div className="mb-3">
            <div className="text-xs text-zinc-500 mb-1.5">변경 내용</div>
            <div className="bg-zinc-900/50 rounded border border-zinc-700 overflow-hidden">
              <div className="max-h-64 overflow-y-auto font-mono text-xs">
                {diff.removed.length > 0 && (
                  <div>
                    {diff.removed.map((line, i) => (
                      <div key={`removed-${i}`} className="px-3 py-0.5 bg-zinc-800/50 text-zinc-400">
                        <span className="text-zinc-600 mr-2">-</span>
                        {line}
                      </div>
                    ))}
                  </div>
                )}
                {diff.added.length > 0 && (
                  <div>
                    {diff.added.map((line, i) => (
                      <div key={`added-${i}`} className="px-3 py-0.5 bg-zinc-800/30 text-zinc-200">
                        <span className="text-zinc-500 mr-2">+</span>
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content preview for write operations */}
        {!diff && newString && (
          <div className="mb-3">
            <div className="text-xs text-zinc-500 mb-1.5">내용</div>
            <div className="bg-zinc-900/50 rounded border border-zinc-700 overflow-hidden">
              <pre className="max-h-64 overflow-y-auto font-mono text-xs px-3 py-2 text-zinc-300">
                {newString.length > 500 ? `${newString.slice(0, 500)}...` : newString}
              </pre>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            data-testid="permission-btn-once"
            onClick={() => onReply('once')}
            disabled={isPending}
            className={cn(
              'flex-1 px-3 py-2 rounded text-sm transition-colors',
              'bg-zinc-700 hover:bg-zinc-600 text-zinc-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            <span className="text-xs text-zinc-400">1</span>
            한 번만
          </button>
          <button
            data-testid="permission-btn-always"
            onClick={() => onReply('always')}
            disabled={isPending}
            className={cn(
              'flex-1 px-3 py-2 rounded text-sm transition-colors',
              'bg-zinc-700 hover:bg-zinc-600 text-zinc-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            <span className="text-xs text-zinc-400">2</span>
            항상
          </button>
          <button
            data-testid="permission-btn-reject"
            onClick={() => onReply('reject')}
            disabled={isPending}
            className={cn(
              'flex-1 px-3 py-2 rounded text-sm transition-colors',
              'bg-zinc-700 hover:bg-zinc-600 text-zinc-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            <span className="text-xs text-zinc-400">3</span>
            거부
          </button>
        </div>

        <p className="text-xs text-zinc-600 text-center mt-2">
          1=한 번만 · 2=항상 · 3=거부
        </p>
      </div>
    </div>
  )
}
