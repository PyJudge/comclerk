'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, useAbortSession, useDeleteSession, useUpdateSession } from '@/hooks'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SessionHeaderProps {
  sessionId: string
  isRunning?: boolean
}

export function SessionHeader({ sessionId, isRunning = false }: SessionHeaderProps) {
  const router = useRouter()
  const { data: session } = useSession(sessionId)
  const abortSession = useAbortSession()
  const deleteSession = useDeleteSession()
  const updateSession = useUpdateSession()

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleAbort = async () => {
    try {
      await abortSession.mutateAsync(sessionId)
    } catch (error) {
      console.error('Failed to abort session:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      await deleteSession.mutateAsync(sessionId)
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const handleStartEdit = () => {
    setEditTitle(session?.title || '')
    setIsEditing(true)
  }

  const handleSaveTitle = async () => {
    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle || trimmedTitle === session?.title) {
      setIsEditing(false)
      return
    }

    try {
      await updateSession.mutateAsync({ id: sessionId, title: trimmedTitle })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update session title:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                className={cn(
                  'font-semibold bg-transparent border-b-2 border-primary outline-none',
                  'px-1 py-0.5 -ml-1'
                )}
              />
            ) : (
              <h1
                className="font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={handleStartEdit}
                title="Click to edit title"
              >
                {session?.title || 'Untitled Session'}
              </h1>
            )}
            <p className="text-xs text-muted-foreground">
              {session?.directory}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Running...
              </div>
              <button
                onClick={handleAbort}
                disabled={abortSession.isPending}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm',
                  'bg-destructive text-destructive-foreground',
                  'hover:bg-destructive/90 transition-colors',
                  abortSession.isPending && 'opacity-50 cursor-not-allowed'
                )}
              >
                {abortSession.isPending ? 'Aborting...' : 'Abort'}
              </button>
            </>
          )}

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleteSession.isPending}
            className={cn(
              'p-2 rounded-md text-muted-foreground',
              'hover:bg-destructive/10 hover:text-destructive transition-colors',
              deleteSession.isPending && 'opacity-50 cursor-not-allowed'
            )}
            title="Delete session"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
