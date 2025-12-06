// [COMCLERK-ADDED] 2025-12-05: Inline permission UI for chat window
'use client'

import { Permission } from '@/types'
import { cn } from '@/lib/utils'

interface PermissionInlineProps {
  permission: Permission
  onReply: (response: 'once' | 'always' | 'reject') => void
  isPending?: boolean
}

function parseUnifiedDiff(unifiedDiff: string): { added: string[]; removed: string[] } {
  const lines = unifiedDiff.split('\n')
  const added: string[] = []
  const removed: string[] = []

  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added.push(line.slice(1)) // '+' 제거
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      removed.push(line.slice(1)) // '-' 제거
    }
  }

  return { added, removed }
}

export function PermissionInline({ permission, onReply, isPending }: PermissionInlineProps) {
  const metadata = permission.metadata || {}
  const filePath = (metadata.file_path || metadata.filePath || metadata.path || '') as string
  const unifiedDiff = (metadata.diff || '') as string

  const diff = unifiedDiff ? parseUnifiedDiff(unifiedDiff) : null

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
                      <div key={`removed-${i}`} className="px-3 py-0.5 bg-red-950/20 text-red-400">
                        <span className="text-red-600 mr-2">-</span>
                        {line}
                      </div>
                    ))}
                  </div>
                )}
                {diff.added.length > 0 && (
                  <div>
                    {diff.added.map((line, i) => (
                      <div key={`added-${i}`} className="px-3 py-0.5 bg-green-950/20 text-green-400">
                        <span className="text-green-600 mr-2">+</span>
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
