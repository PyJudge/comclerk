'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { opencode } from '@/lib/opencode-client'

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const result = await opencode.session.list()
      if (result.error) throw new Error('Failed to fetch sessions')
      return result.data
    },
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (title?: string) => {
      const result = await opencode.session.create({
        body: title ? { title } : undefined,
      })
      if (result.error) throw new Error('Failed to create session')
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await opencode.session.delete({
        path: { id },
      })
      if (result.error) throw new Error('Failed to delete session')
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      // Use fetch directly since SDK might not have patch method
      const response = await fetch(`${process.env.NEXT_PUBLIC_OPENCODE_API_URL || 'http://localhost:4096'}/session/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!response.ok) throw new Error('Failed to update session')
      return response.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session', id] })
    },
  })
}
