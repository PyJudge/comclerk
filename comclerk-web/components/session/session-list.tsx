'use client'

import { useSessions, useCreateSession, useDeleteSession } from '@/hooks'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export function SessionList() {
  const router = useRouter()
  const { data: sessions, isLoading, error } = useSessions()
  const createSession = useCreateSession()
  const deleteSession = useDeleteSession()

  const handleCreate = async () => {
    try {
      const session = await createSession.mutateAsync(undefined)
      if (session?.id) {
        router.push(`/dashboard/session/${session.id}`)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await deleteSession.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load sessions. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleCreate}
        disabled={createSession.isPending}
        className={cn(
          'w-full py-3 px-4 rounded-lg border-2 border-dashed',
          'hover:border-primary hover:bg-primary/5 transition-colors',
          'flex items-center justify-center gap-2',
          createSession.isPending && 'opacity-50 cursor-not-allowed'
        )}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {createSession.isPending ? 'Creating...' : 'New Session'}
      </button>

      <div className="space-y-2">
        {sessions?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sessions yet. Create one to get started.
          </div>
        ) : (
          sessions?.map((session) => (
            <div
              key={session.id}
              onClick={() => router.push(`/dashboard/session/${session.id}`)}
              className={cn(
                'p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer',
                'transition-colors group relative'
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {session.title || 'Untitled Session'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.time.updated).toLocaleString('ko-KR')}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className={cn(
                    'p-2 rounded-md opacity-0 group-hover:opacity-100',
                    'hover:bg-destructive/10 hover:text-destructive',
                    'transition-all'
                  )}
                  disabled={deleteSession.isPending}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
