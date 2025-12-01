'use client'

import { useQuery } from '@tanstack/react-query'
import { opencode } from '@/lib/opencode-client'

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const result = await opencode.app.agents()
      if (result.error) throw new Error('Failed to fetch agents')
      return result.data
    },
  })
}

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const result = await opencode.provider.list()
      if (result.error) throw new Error('Failed to fetch providers')
      // API returns { all: Provider[], connected: string[], default: string }
      // We need the array of all providers
      const data = result.data as { all?: Array<{ id: string; name?: string; env?: string[] }> }
      return data?.all ?? []
    },
  })
}

export function useConnectedProviders() {
  return useQuery({
    queryKey: ['connected-providers'],
    queryFn: async () => {
      const result = await opencode.provider.list()
      if (result.error) throw new Error('Failed to fetch providers')
      // API returns { all: Provider[], connected: string[], default: string }
      const data = result.data as { connected?: string[] }
      return data?.connected ?? []
    },
  })
}

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const result = await opencode.config.get()
      if (result.error) throw new Error('Failed to fetch config')
      return result.data
    },
  })
}

export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      // tool.list requires provider and model query params
      // For now, use a placeholder or skip if these are not available
      const result = await opencode.tool.list({
        query: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
      })
      if (result.error) throw new Error('Failed to fetch tools')
      return result.data
    },
  })
}

export function useMcpStatus() {
  return useQuery({
    queryKey: ['mcp-status'],
    queryFn: async () => {
      const result = await opencode.mcp.status()
      if (result.error) throw new Error('Failed to fetch MCP status')
      return result.data
    },
  })
}
