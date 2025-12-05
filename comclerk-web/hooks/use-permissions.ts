// [COMCLERK-MODIFIED] 2025-12-05: Permission polling 추가
// Permission-related hooks
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { opencode } from '@/lib/opencode-client'
import type { Permission } from '@/types'

/**
 * Poll for pending permissions for a session
 */
export function usePermissionPolling(sessionId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['permissions', sessionId],
    queryFn: async () => {
      if (!sessionId) return []

      const response = await opencode.GET('/session/{id}/permission', {
        params: { path: { id: sessionId } },
      })

      if (response.error) {
        console.error('[usePermissionPolling] Error:', response.error)
        return []
      }

      return (response.data || []) as Permission[]
    },
    enabled: enabled && !!sessionId,
    refetchInterval: 500, // Poll every 500ms
    refetchIntervalInBackground: false,
    staleTime: 0, // Always consider stale
  })
}

/**
 * Reply to a permission request
 */
export function usePermissionReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      permissionId,
      response,
    }: {
      sessionId: string
      permissionId: string
      response: 'once' | 'always' | 'reject'
    }) => {
      const result = await opencode.postSessionIdPermissionsPermissionId({
        path: { id: sessionId, permissionID: permissionId },
        body: { response },
      })
      return result.data
    },
    onSuccess: (_data, variables) => {
      // Invalidate permissions query to refetch
      queryClient.invalidateQueries({ queryKey: ['permissions', variables.sessionId] })
      // Invalidate messages to refresh tool status
      queryClient.invalidateQueries({ queryKey: ['messages', variables.sessionId] })
    },
  })
}
