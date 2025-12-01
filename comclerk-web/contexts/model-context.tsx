'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { opencode } from '@/lib/opencode-client'

interface Model {
  id: string
  name: string
}

interface Provider {
  id: string
  name: string
  models: Record<string, Model>
}

interface ProviderData {
  all: Provider[]
  connected: string[]
  default: Record<string, string>
}

interface ModelSelection {
  providerID: string
  modelID: string
}

interface ModelContextType {
  providers: Provider[]
  connectedProviders: string[]
  defaultModels: Record<string, string>
  selectedModel: ModelSelection | null
  setSelectedModel: (model: ModelSelection) => void
  isLoading: boolean
}

const ModelContext = createContext<ModelContextType | null>(null)

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<ModelSelection | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['provider-data'],
    queryFn: async () => {
      const result = await opencode.provider.list()
      if (result.error) throw new Error('Failed to fetch providers')
      return result.data as ProviderData
    },
  })

  const providers = useMemo(() => data?.all ?? [], [data?.all])
  const connectedProviders = useMemo(() => data?.connected ?? [], [data?.connected])
  const defaultModels = useMemo(() => data?.default ?? {}, [data?.default])

  // Set default model when data is loaded
  useEffect(() => {
    if (!selectedModel && connectedProviders.length > 0 && providers.length > 0) {
      // Prefer anthropic if connected, with opus-4-5
      if (connectedProviders.includes('anthropic')) {
        const anthropic = providers.find(p => p.id === 'anthropic')
        if (anthropic?.models) {
          // Find opus 4.5 model - prefer the latest version
          const opusModel = Object.keys(anthropic.models).find(
            m => m === 'claude-opus-4-5-20251101'
          ) || Object.keys(anthropic.models).find(
            m => m === 'claude-opus-4-5'
          ) || Object.keys(anthropic.models).find(
            m => m.includes('opus-4-5')
          )
          if (opusModel) {
            setSelectedModel({ providerID: 'anthropic', modelID: opusModel })
            return
          }
          // Fallback to default anthropic model
          const defaultModel = defaultModels['anthropic']
          if (defaultModel) {
            setSelectedModel({ providerID: 'anthropic', modelID: defaultModel })
            return
          }
        }
      }

      // Fallback to first connected provider
      const firstConnected = connectedProviders[0]
      const provider = providers.find(p => p.id === firstConnected)
      if (provider?.models) {
        const defaultModel = defaultModels[firstConnected] || Object.keys(provider.models)[0]
        if (defaultModel) {
          setSelectedModel({ providerID: firstConnected, modelID: defaultModel })
        }
      }
    }
  }, [connectedProviders, providers, defaultModels, selectedModel])

  return (
    <ModelContext.Provider
      value={{
        providers,
        connectedProviders,
        defaultModels,
        selectedModel,
        setSelectedModel,
        isLoading,
      }}
    >
      {children}
    </ModelContext.Provider>
  )
}

export function useModel() {
  const context = useContext(ModelContext)
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider')
  }
  return context
}
