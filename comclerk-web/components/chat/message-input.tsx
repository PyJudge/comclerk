// [COMCLERK-MODIFIED] 2025-12-02: ESC 키로 AI 응답 생성 중단 기능 추가
'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useSendMessageAsync, useAgents, useAbortSession } from '@/hooks'
import { useModel } from '@/contexts'
import { cn } from '@/lib/utils'
import { useAgentStore } from '@/stores/agent-store'
import { useChatStore } from '@/stores/chat-store'
import type { AgentFull } from '@/types'

interface MessageInputProps {
  sessionId: string
  onMessageSent?: () => void
}

// Agent type from API
interface Agent {
  name: string
  description?: string
  mode?: string
  color?: string
}

export function MessageInput({ sessionId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sendMessage = useSendMessageAsync()
  const abortSession = useAbortSession()
  const isGenerating = useChatStore((state) => state.isGenerating)
  const setIsGenerating = useChatStore((state) => state.setIsGenerating)
  const { selectedModel, setSelectedModel, providers, connectedProviders, isLoading: modelLoading } = useModel()
  const { data: agents } = useAgents()

  // Agent Store integration
  const {
    selectedAgent,
    setSelectedAgent,
    setAgents,
    cycleAgent,
  } = useAgentStore()

  // Filter to only show primary/all mode agents (not subagent which are internal)
  const availableAgents = useMemo(() => {
    if (!agents) return []
    return (agents as Agent[]).filter(
      (a) => a.mode === 'primary' || a.mode === 'all'
    )
  }, [agents])

  // Sync agents to store when they load
  useEffect(() => {
    if (agents && agents.length > 0) {
      const agentsFull = (agents as Agent[]).map((a): AgentFull => ({
        name: a.name,
        description: a.description,
        mode: (a.mode as AgentFull['mode']) || 'all',
        color: a.color,
        builtIn: ['general', 'explore', 'build', 'plan'].includes(a.name),
      }))
      setAgents(agentsFull)
    }
  }, [agents, setAgents])

  // Set default agent when availableAgents loads or when selectedAgent is invalid
  useEffect(() => {
    if (availableAgents.length > 0) {
      const isValidAgent = availableAgents.some(a => a.name === selectedAgent)
      if (!selectedAgent || !isValidAgent) {
        setSelectedAgent(availableAgents[0].name)
      }
    }
  }, [availableAgents, selectedAgent, setSelectedAgent])

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

  // Global ESC key listener for aborting generation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGenerating) {
        e.preventDefault()
        abortSession.mutate(sessionId)
        setIsGenerating(false)
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isGenerating, sessionId, abortSession, setIsGenerating])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = message.trim()
    if (!trimmed || sendMessage.isPending || !selectedModel || !selectedAgent) return

    try {
      setMessage('')
      setIsGenerating(true)
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
      setIsGenerating(false)
    }
  }

  const getModelDisplayName = () => {
    if (!selectedModel) return '모델 선택'
    const provider = providers.find(p => p.id === selectedModel.providerID)
    const model = provider?.models?.[selectedModel.modelID]
    return model?.name || selectedModel.modelID
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key to cycle agents
    if (e.key === 'Tab' && !e.shiftKey && availableAgents.length > 1) {
      e.preventDefault()
      cycleAgent('next')
      return
    }

    // Shift+Tab to cycle agents backwards
    if (e.key === 'Tab' && e.shiftKey && availableAgents.length > 1) {
      e.preventDefault()
      cycleAgent('prev')
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
    <form onSubmit={handleSubmit} className="w-full" data-testid="message-form">
      {/* Model & Agent Selectors */}
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        {/* Model Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowModelSelector(!showModelSelector)}
            data-testid="model-selector"
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm',
              'bg-zinc-800 hover:bg-zinc-700 transition-colors',
              'border border-zinc-700 text-zinc-200'
            )}
          >
            <span className="text-zinc-400">모델:</span>
            <span className="font-medium" data-testid="model-display">{modelLoading ? '로딩 중...' : getModelDisplayName()}</span>
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Model Dropdown */}
          {showModelSelector && (
            <div className="absolute bottom-full left-0 mb-1 w-80 max-h-64 overflow-y-auto bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50">
              {connectedProviderData.length === 0 ? (
                <div className="p-3 text-sm text-zinc-400">
                  연결된 제공자가 없습니다. 설정에서 연결하세요.
                </div>
              ) : (
                connectedProviderData.map((provider) => (
                  <div key={provider.id} className="border-b border-zinc-700 last:border-b-0">
                    <div className="px-3 py-2 bg-zinc-900 text-xs font-semibold uppercase text-zinc-500">
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
                            'w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors',
                            selectedModel?.providerID === provider.id && selectedModel?.modelID === modelId && 'bg-blue-600/20 text-blue-300'
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
          <div className="flex items-center gap-1" data-testid="agent-selector">
            {availableAgents.map((agent) => (
              <button
                key={agent.name}
                type="button"
                onClick={() => setSelectedAgent(agent.name)}
                title={agent.description}
                data-testid={`agent-btn-${agent.name}`}
                data-selected={selectedAgent === agent.name}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-colors',
                  selectedAgent === agent.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
                )}
              >
                {agent.name}
              </button>
            ))}
            <span className="text-xs text-zinc-500 ml-1">(Tab)</span>
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
            placeholder={!selectedModel ? '먼저 모델을 선택하세요...' : !selectedAgent ? '에이전트 로딩 중...' : `메시지 입력 (${selectedAgent} 모드)...`}
            disabled={sendMessage.isPending || !selectedModel || !selectedAgent}
            rows={1}
            data-testid="message-input"
            className={cn(
              'w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-zinc-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'placeholder:text-zinc-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'max-h-32 overflow-y-hidden'
            )}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || sendMessage.isPending || !selectedModel || !selectedAgent}
          data-testid="send-button"
          className={cn(
            'p-3 rounded-lg bg-blue-600 text-white',
            'hover:bg-blue-500 transition-colors',
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
      <p className="text-xs text-zinc-500 mt-2 text-center">
        Enter로 전송 · Shift+Enter로 줄바꿈 · Tab으로 에이전트 전환 · ESC로 생성 중단
      </p>
    </form>
  )
}
