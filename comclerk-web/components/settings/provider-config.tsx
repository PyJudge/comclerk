'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useProviders } from '@/hooks'
import { opencode } from '@/lib/opencode-client'
import { cn } from '@/lib/utils'
import { Provider } from '@/types'

export function ProviderConfig() {
  const { data: providers, isLoading, error, refetch } = useProviders()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load providers. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure API keys for your AI providers.
      </p>

      <div className="space-y-3">
        {providers?.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onUpdate={() => refetch()}
          />
        ))}
      </div>
    </div>
  )
}

function ProviderCard({
  provider,
  onUpdate,
}: {
  provider: Provider
  onUpdate: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [apiKey, setApiKey] = useState('')

  const saveMutation = useMutation({
    mutationFn: async () => {
      const result = await opencode.auth.set({
        path: { id: provider.id },
        body: {
          type: 'api',
          key: apiKey,
        },
      })
      if (result.error) throw new Error('Failed to save API key')
      return result.data
    },
    onSuccess: () => {
      setIsEditing(false)
      setApiKey('')
      onUpdate()
    },
  })

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{provider.name || provider.id}</h3>
          {provider.env && provider.env.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Env: {provider.env.join(', ')}
            </p>
          )}
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm transition-colors',
            'border hover:bg-accent'
          )}
        >
          {isEditing ? 'Cancel' : 'Configure'}
        </button>
      </div>

      {isEditing && (
        <div className="mt-4 space-y-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API key..."
            className={cn(
              'w-full px-3 py-2 rounded-md border bg-background',
              'focus:outline-none focus:ring-2 focus:ring-primary'
            )}
          />
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!apiKey || saveMutation.isPending}
            className={cn(
              'w-full py-2 rounded-md bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save API Key'}
          </button>
          {saveMutation.isError && (
            <p className="text-sm text-destructive">
              Failed to save. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
