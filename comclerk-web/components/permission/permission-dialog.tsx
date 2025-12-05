// [COMCLERK-ADDED] 2025-12-05: Permission approval UI with keyboard shortcuts (1/2/3)
// [COMCLERK-MODIFIED] 2025-12-05: Input/Diff 중심 UI로 개선
'use client'

import { useEffect, useMemo } from 'react'
import { usePermissionReply } from '@/hooks'
import { Permission } from '@/types'
import { cn } from '@/lib/utils'

interface PermissionDialogProps {
  permission: Permission
  onClose?: () => void
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

export function PermissionDialog({ permission, onClose }: PermissionDialogProps) {
  const replyMutation = usePermissionReply()

  const handleReply = async (response: 'once' | 'always' | 'reject') => {
    try {
      await replyMutation.mutateAsync({
        sessionId: permission.sessionID,
        permissionId: permission.id,
        response,
      })
      onClose?.()
    } catch (error) {
      console.error('Failed to reply to permission:', error)
    }
  }

  // Keyboard shortcuts: 1=Once, 2=Always, 3=Reject
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        e.preventDefault()
        handleReply('once')
      } else if (e.key === '2') {
        e.preventDefault()
        handleReply('always')
      } else if (e.key === '3') {
        e.preventDefault()
        handleReply('reject')
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [permission, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">권한 승인 요청</h3>
            <p className="text-sm text-zinc-400">{permission.type}</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6 space-y-3">
          <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <p className="text-sm font-medium text-zinc-200 mb-2">{permission.title}</p>
            {permission.pattern && (
              <div className="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-2 rounded border border-zinc-700">
                {Array.isArray(permission.pattern) ? permission.pattern.join(', ') : permission.pattern}
              </div>
            )}
          </div>

          {permission.metadata && Object.keys(permission.metadata).length > 0 && (
            <details className="text-xs text-zinc-500">
              <summary className="cursor-pointer hover:text-zinc-300">추가 정보</summary>
              <pre className="mt-2 p-3 bg-zinc-800 rounded border border-zinc-700 overflow-auto">
                {JSON.stringify(permission.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => handleReply('once')}
            disabled={replyMutation.isPending}
            className={cn(
              'flex-1 px-4 py-3 rounded-lg font-medium transition-colors',
              'bg-blue-600 hover:bg-blue-500 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            <span className="text-sm bg-blue-500/30 px-2 py-0.5 rounded">1</span>
            한 번만 허용
          </button>
          <button
            onClick={() => handleReply('always')}
            disabled={replyMutation.isPending}
            className={cn(
              'flex-1 px-4 py-3 rounded-lg font-medium transition-colors',
              'bg-green-600 hover:bg-green-500 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            <span className="text-sm bg-green-500/30 px-2 py-0.5 rounded">2</span>
            항상 허용
          </button>
          <button
            onClick={() => handleReply('reject')}
            disabled={replyMutation.isPending}
            className={cn(
              'flex-1 px-4 py-3 rounded-lg font-medium transition-colors',
              'bg-red-600 hover:bg-red-500 text-white',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            <span className="text-sm bg-red-500/30 px-2 py-0.5 rounded">3</span>
            거부
          </button>
        </div>

        <p className="text-xs text-zinc-500 text-center mt-4">
          키보드: 1=한 번만 · 2=항상 · 3=거부 · ESC=닫기
        </p>
      </div>
    </div>
  )
}
