'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { opencode } from '@/lib/opencode-client'

export interface AuthMethod {
  type: 'oauth' | 'api'
  label: string
}

export interface OAuthAuthorization {
  url: string
  method: 'auto' | 'code'
  instructions: string
}

export function useProviderAuthMethods() {
  return useQuery({
    queryKey: ['provider-auth-methods'],
    queryFn: async () => {
      const result = await opencode.provider.auth()
      if (result.error) throw new Error('Failed to fetch auth methods')
      return result.data as Record<string, AuthMethod[]>
    },
  })
}

export function useOAuthAuthorize() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ providerId, methodIndex }: { providerId: string; methodIndex: number }) => {
      const result = await opencode.provider.oauth.authorize({
        path: { id: providerId },
        body: { method: methodIndex },
      })
      if (result.error) throw new Error('Failed to start OAuth flow')
      return result.data as OAuthAuthorization | undefined
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
    },
  })
}

export function useOAuthCallback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ providerId, methodIndex, code }: { providerId: string; methodIndex: number; code?: string }) => {
      const result = await opencode.provider.oauth.callback({
        path: { id: providerId },
        body: { method: methodIndex, code },
      })
      // Check for error in response - SDK may return error in data field
      if (result.error) {
        const errorData = result.error as { name?: string; message?: string }
        throw new Error(errorData.name || errorData.message || 'Failed to complete OAuth flow')
      }
      // Also check if data contains error (some SDK versions)
      const data = result.data as { name?: string } | boolean | undefined
      if (data && typeof data === 'object' && 'name' in data && data.name?.includes('Error')) {
        throw new Error(data.name)
      }

      // Verify the connection actually succeeded by checking connected providers
      const providerResult = await opencode.provider.list()
      if (!providerResult.error) {
        const providerData = providerResult.data as { connected?: string[] }
        if (!providerData?.connected?.includes(providerId)) {
          throw new Error('OAuth completed but provider not connected. Please try again.')
        }
      }

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      queryClient.invalidateQueries({ queryKey: ['connected-providers'] })
      queryClient.invalidateQueries({ queryKey: ['provider-auth-methods'] })
    },
  })
}

export function useSetApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ providerId, apiKey }: { providerId: string; apiKey: string }) => {
      const result = await opencode.auth.set({
        path: { id: providerId },
        body: { type: 'api' as const, key: apiKey },
      })
      if (result.error) throw new Error('Failed to set API key')
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      queryClient.invalidateQueries({ queryKey: ['connected-providers'] })
    },
  })
}
