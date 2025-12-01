'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useSendMessageAsync, useAgents } from '@/hooks'
import { useModel } from '@/contexts'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  sessionId: string
  onMessageSent?: () => void
}

// Agent type from API
interface Agent {
  name: string
  description?: string
  mode?: string
}

export function MessageInput({ sessionId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('build')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendMessage = useSendMessageAsync()
  const { selectedModel, setSelectedModel, providers, connectedProviders, isLoading: modelLoading } = useModel()
  const { data: agents } = useAgents()

  // Filter to only show primary/all mode agents (not subagent which are internal)
  const availableAgents = useMemo(() => {
    if (!agents) return []
    return (agents as Agent[]).filter(
      (a) => a.mode === 'primary' || a.mode === 'all'
    )
  }, [agents])

  // Get connected providers with their models (exclude opencode/zen for now)
  const connectedProviderData = providers.filter(p =>
    connectedProviders.includes(p.id) && p.id !== 'opencode'
  )

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = message.trim()
    if (!trimmed || sendMessage.isPending || !selectedModel) return

    try {
      setMessage('')
      await sendMessage.mutateAsync({
        sessionId,
        text: trimmed,
        providerID: selectedModel.providerID,
        modelID: selectedModel.modelID,
        agent: selectedAgent,
      })
      // Start polling for response
      onMessageSent?.()
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessage(trimmed) // Restore message on error
    }
  }

  const getModelDisplayName = () => {
    if (!selectedModel) return 'Select Model'
    const provider = providers.find(p => p.id === selectedModel.providerID)
    const model = provider?.models?.[selectedModel.modelID]
    return model?.name || selectedModel.modelID
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key to cycle agents
    if (e.key === 'Tab' && !e.shiftKey && availableAgents.length > 1) {
      e.preventDefault()
      const currentIndex = availableAgents.findIndex(a => a.name === selectedAgent)
      const nextIndex = (currentIndex + 1) % availableAgents.length
      setSelectedAgent(availableAgents[nextIndex].name)
      return
    }

    // Shift+Tab to cycle agents backwards
    if (e.key === 'Tab' && e.shiftKey && availableAgents.length > 1) {
      e.preventDefault()
      const currentIndex = availableAgents.findIndex(a => a.name === selectedAgent)
      const prevIndex = currentIndex <= 0 ? availableAgents.length - 1 : currentIndex - 1
      setSelectedAgent(availableAgents[prevIndex].name)
      return
    }

    // Enter to submit
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        form.requestSubmit()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full px-4">
      {/* Model & Agent Selectors */}
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        {/* Model Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowModelSelector(!showModelSelector)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
              'bg-muted hover:bg-muted/80 transition-colors',
              'border border-border'
            )}
          >
            <span className="text-muted-foreground">Model:</span>
            <span className="font-medium">{modelLoading ? 'Loading...' : getModelDisplayName()}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Model Dropdown */}
          {showModelSelector && (
            <div className="absolute bottom-full left-0 mb-1 w-80 max-h-64 overflow-y-auto bg-background border rounded-lg shadow-lg z-50">
              {connectedProviderData.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  No connected providers. Go to Settings to connect.
                </div>
              ) : (
                connectedProviderData.map((provider) => (
                  <div key={provider.id} className="border-b last:border-b-0">
                    <div className="px-3 py-2 bg-muted/50 text-xs font-semibold uppercase text-muted-foreground">
                      {provider.name || provider.id}
                    </div>
                    <div className="py-1">
                      {provider.models && Object.entries(provider.models).slice(0, 10).map(([modelId, model]) => (
                        <button
                          key={modelId}
                          type="button"
                          onClick={() => {
                            setSelectedModel({ providerID: provider.id, modelID: modelId })
                            setShowModelSelector(false)
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors',
                            selectedModel?.providerID === provider.id && selectedModel?.modelID === modelId && 'bg-primary/10'
                          )}
                        >
                          {model.name || modelId}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Agent Selector (Tab to switch) */}
        {availableAgents.length > 0 && (
          <div className="flex items-center gap-1">
            {availableAgents.map((agent) => (
              <button
                key={agent.name}
                type="button"
                onClick={() => setSelectedAgent(agent.name)}
                title={agent.description}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  selectedAgent === agent.name
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {agent.name}
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-1">(Tab)</span>
          </div>
        )}
      </div>

      <div className="relative flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={!selectedModel ? 'Select a model first...' : `Message (${selectedAgent} mode)...`}
            disabled={sendMessage.isPending || !selectedModel}
            rows={1}
            className={cn(
              'w-full resize-none rounded-lg border bg-background px-4 py-3',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'placeholder:text-muted-foreground',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'max-h-32 overflow-y-auto'
            )}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || sendMessage.isPending || !selectedModel}
          className={cn(
            'p-3 rounded-lg bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex-shrink-0'
          )}
        >
          {sendMessage.isPending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Enter to send · Shift+Enter for new line · Tab to switch agent
      </p>
    </form>
  )
}
