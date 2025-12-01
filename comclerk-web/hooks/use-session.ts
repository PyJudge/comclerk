'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useEffect, useRef } from 'react'
import { opencode } from '@/lib/opencode-client'
import { Message, UserMessage, ApiMessage, transformApiMessage } from '@/types'

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const result = await opencode.session.get({
        path: { id },
      })
      if (result.error) throw new Error('Failed to fetch session')
      return result.data
    },
    enabled: !!id,
  })
}

export function useSessionMessages(sessionId: string) {
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: async () => {
      const result = await opencode.session.messages({
        path: { id: sessionId },
      })
      if (result.error) throw new Error('Failed to fetch messages')
      // Transform API messages to UI format
      const apiMessages = result.data as unknown as ApiMessage[]
      return apiMessages.map(transformApiMessage)
    },
    enabled: !!sessionId,
  })
}

// Hook to manage real-time message polling
export function useMessagePolling(sessionId: string) {
  const queryClient = useQueryClient()
  const [isPolling, setIsPolling] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const startPolling = useCallback(() => {
    setIsPolling(true)

    // Clear any existing interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    // Poll every 500ms
    pollingRef.current = setInterval(async () => {
      const result = await queryClient.fetchQuery({
        queryKey: ['messages', sessionId],
        queryFn: async () => {
          const res = await opencode.session.messages({
            path: { id: sessionId },
          })
          if (res.error) throw new Error('Failed to fetch messages')
          // Transform API messages to UI format
          const apiMessages = res.data as unknown as ApiMessage[]
          return apiMessages.map(transformApiMessage)
        },
        staleTime: 0,
      })

      const messages = result as Message[] | undefined

      // Find the last assistant message
      const lastAssistantMessage = messages
        ?.filter((m): m is Message & { role: 'assistant' } => m.role === 'assistant')
        ?.pop()

      // Check if assistant response is complete (has time.completed)
      if (lastAssistantMessage && lastAssistantMessage.time?.completed) {
        setIsPolling(false)
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
    }, 500)
  }, [sessionId, queryClient])

  const stopPolling = useCallback(() => {
    setIsPolling(false)
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  return { isPolling, startPolling, stopPolling }
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      text,
      providerID,
      modelID,
    }: {
      sessionId: string
      text: string
      providerID?: string
      modelID?: string
    }) => {
      const result = await opencode.session.prompt({
        path: { id: sessionId },
        body: {
          parts: [{ type: 'text', text }],
          model: providerID && modelID ? { providerID, modelID } : undefined,
        },
      })
      if (result.error) throw new Error('Failed to send message')
      return result.data
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] })
    },
  })
}

export function useSendMessageAsync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      text,
      providerID,
      modelID,
      agent,
    }: {
      sessionId: string
      text: string
      providerID?: string
      modelID?: string
      agent?: string
    }) => {
      const result = await opencode.session.promptAsync({
        path: { id: sessionId },
        body: {
          parts: [{ type: 'text', text }],
          model: providerID && modelID ? { providerID, modelID } : undefined,
          agent,
        },
      })
      if (result.error) throw new Error('Failed to send message')
      return result.data
    },
    // Optimistic update: immediately show user message in UI
    onMutate: async ({ sessionId, text }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', sessionId] })

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', sessionId])

      // Create optimistic user message
      const optimisticMessage: UserMessage = {
        id: `temp-${Date.now()}`,
        sessionID: sessionId,
        role: 'user',
        time: { created: Date.now() },
        parts: [{ id: `part-${Date.now()}`, type: 'text', text }],
      }

      // Optimistically update messages
      queryClient.setQueryData<Message[]>(['messages', sessionId], (old) => {
        return [...(old ?? []), optimisticMessage]
      })

      return { previousMessages }
    },
    onError: (_, { sessionId }, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', sessionId], context.previousMessages)
      }
    },
    onSettled: (_, __, { sessionId }) => {
      // Refetch to get the real message ID
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] })
    },
  })
}

export function useAbortSession() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await opencode.session.abort({
        path: { id: sessionId },
      })
      if (result.error) throw new Error('Failed to abort session')
      return result.data
    },
  })
}
