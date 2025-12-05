// [COMCLERK-ADDED] 2025-12-01: Agent CRUD mutation hooks
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AgentFull } from '@/types'

// Types for API requests
export interface CreateAgentInput {
  name: string
  description?: string
  mode?: 'primary' | 'subagent' | 'all'
  temperature?: number
  topP?: number
  color?: string
  prompt?: string
  model?: string
  permission?: Record<string, unknown>
  tools?: Record<string, boolean>
}

export interface UpdateAgentInput {
  description?: string
  mode?: 'primary' | 'subagent' | 'all'
  temperature?: number
  topP?: number
  color?: string
  prompt?: string
  model?: string
  permission?: Record<string, unknown>
  tools?: Record<string, boolean>
}

// Fetch custom agents from Next.js API Route
export function useCustomAgents() {
  return useQuery({
    queryKey: ['custom-agents'],
    queryFn: async (): Promise<AgentFull[]> => {
      const response = await fetch('/api/agent')
      if (!response.ok) {
        throw new Error('Failed to fetch custom agents')
      }
      return response.json()
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // 30 seconds polling
  })
}

// Get single custom agent
export function useCustomAgent(name: string) {
  return useQuery({
    queryKey: ['custom-agent', name],
    queryFn: async (): Promise<AgentFull> => {
      const response = await fetch(`/api/agent/${encodeURIComponent(name)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch agent')
      }
      return response.json()
    },
    enabled: !!name,
  })
}

// Create agent mutation
export function useCreateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAgentInput) => {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create agent')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate both custom agents and the main agents query (from backend)
      queryClient.invalidateQueries({ queryKey: ['custom-agents'] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

// Update agent mutation
export function useUpdateAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, ...input }: UpdateAgentInput & { name: string }) => {
      const response = await fetch(`/api/agent/${encodeURIComponent(name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update agent')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['custom-agents'] })
      queryClient.invalidateQueries({ queryKey: ['custom-agent', variables.name] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}

// Delete agent mutation
export function useDeleteAgent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch(`/api/agent/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete agent')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['custom-agents'] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
  })
}
