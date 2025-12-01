'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { opencode } from '@/lib/opencode-client'
import { Event, GlobalEvent } from '@/types'

type EventHandler = (event: Event) => void

export function useSessionEvents(sessionId: string | null, onEvent?: EventHandler) {
  const queryClient = useQueryClient()
  const abortRef = useRef<AbortController | null>(null)

  const handleEvent = useCallback(
    (event: Event) => {
      // Invalidate relevant queries based on event type
      switch (event.type) {
        case 'message.updated':
        case 'message.created':
          queryClient.invalidateQueries({ queryKey: ['messages', sessionId] })
          break
        case 'session.updated':
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
          queryClient.invalidateQueries({ queryKey: ['sessions'] })
          queryClient.invalidateQueries({ queryKey: ['session-status'] })
          break
        case 'session.deleted':
          queryClient.invalidateQueries({ queryKey: ['sessions'] })
          break
      }

      // Call custom handler if provided
      onEvent?.(event)
    },
    [sessionId, queryClient, onEvent]
  )

  useEffect(() => {
    if (!sessionId) return

    // Create abort controller for cleanup
    abortRef.current = new AbortController()
    let isSubscribed = true

    // Subscribe to events using SDK's async iterator pattern
    const subscribe = async () => {
      try {
        const response = await opencode.event.subscribe({
          signal: abortRef.current?.signal,
        })

        if ('error' in response && response.error) {
          console.error('Event subscription error:', response.error)
          return
        }

        // Use async iterator pattern per SDK docs
        const responseData = 'data' in response ? response.data : null
        if (responseData && typeof responseData === 'object' && 'stream' in responseData) {
          const stream = (responseData as { stream: AsyncIterable<Event> }).stream
          for await (const event of stream) {
            if (!isSubscribed) break
            // Filter events for this specific session
            const eventSessionId = event.properties?.sessionID
            if (!eventSessionId || eventSessionId === sessionId) {
              handleEvent(event)
            }
          }
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        // Log other errors but don't crash - polling will handle updates
        console.debug('Event subscription unavailable, using polling fallback')
      }
    }

    subscribe()

    return () => {
      isSubscribed = false
      abortRef.current?.abort()
    }
  }, [sessionId, handleEvent])
}

export function useGlobalEvents(onEvent?: EventHandler) {
  const queryClient = useQueryClient()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortRef.current = new AbortController()

    const subscribe = async () => {
      try {
        const result = await opencode.global.event({
          onSseEvent: (sseEvent) => {
            // GlobalEvent has { directory, payload: Event }
            const globalEvent = sseEvent as unknown as GlobalEvent
            const event = globalEvent.payload

            // Invalidate queries based on event
            queryClient.invalidateQueries({ queryKey: ['sessions'] })

            // Pass the actual Event to handler
            onEvent?.(event)
          },
          signal: abortRef.current?.signal,
        })

        if ('error' in result && result.error) {
          console.error('Global event subscription error:', result.error)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        console.error('Global event subscription failed:', error)
      }
    }

    subscribe()

    return () => {
      abortRef.current?.abort()
    }
  }, [queryClient, onEvent])
}
