import { createOpencodeClient } from '@opencode-ai/sdk/client'

// Client-side SDK instance
export const opencode = createOpencodeClient({
  baseUrl: process.env.NEXT_PUBLIC_OPENCODE_API_URL || 'http://localhost:4096',
})

// Factory function for creating clients with custom options
export function createClient(options?: {
  baseUrl?: string
  directory?: string
  signal?: AbortSignal
}) {
  return createOpencodeClient({
    baseUrl: options?.baseUrl || process.env.NEXT_PUBLIC_OPENCODE_API_URL || 'http://localhost:4096',
    directory: options?.directory,
    signal: options?.signal,
  })
}

// Server-side client creation (for Server Actions)
export function createServerClient(directory?: string) {
  return createOpencodeClient({
    baseUrl: process.env.OPENCODE_API_URL || 'http://localhost:4096',
    directory,
  })
}

// Export client type
export type { OpencodeClient } from '@opencode-ai/sdk/client'
