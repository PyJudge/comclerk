// [COMCLERK-MODIFIED] 2025-12-02: Agent 탭을 CRUD UI로 교체, Providers 탭 제거
'use client'

import { useState, useMemo } from 'react'
import { useAgents } from '@/hooks'
import { OAuthLogin } from './oauth-login'
import { AgentList } from '@/components/agents/agent-list'
import { AgentEditor } from '@/components/agents/agent-editor'
import { cn } from '@/lib/utils'
import type { AgentFull } from '@/types'

// Backend API response type
interface BackendAgent {
  name: string
  description?: string
  mode?: 'primary' | 'subagent' | 'all'
  builtIn?: boolean
  prompt?: string
  color?: string
  temperature?: number
  topP?: number
  model?: string | { modelID: string; providerID: string }
  permission?: Record<string, unknown>
  tools?: Record<string, boolean>
  options?: Record<string, unknown>
}

// Transform backend agent to AgentFull
function toAgentFull(agent: BackendAgent): AgentFull {
  return {
    name: agent.name,
    description: agent.description,
    mode: agent.mode,
    builtIn: agent.builtIn ?? false,
    prompt: agent.prompt,
    color: agent.color,
    temperature: agent.temperature,
    topP: agent.topP,
    model: typeof agent.model === 'string' ? agent.model : agent.model?.modelID,
    permission: agent.permission as AgentFull['permission'],
    tools: agent.tools,
  }
}

export function SettingsForm() {
  const [activeTab, setActiveTab] = useState<'account' | 'agents'>('account')

  const tabs = [
    { id: 'account' as const, label: '계정' },
    { id: 'agents' as const, label: '에이전트' },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg max-w-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'account' && <OAuthLogin />}
        {activeTab === 'agents' && <AgentSettings />}
      </div>
    </div>
  )
}

// Agent Settings - CRUD UI
function AgentSettings() {
  const { data: agents, isLoading, error } = useAgents()
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Transform backend agents to AgentFull type
  const agentList = useMemo(() => {
    const rawAgents = (agents || []) as BackendAgent[]
    return rawAgents.map(toAgentFull)
  }, [agents])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        에이전트를 불러오지 못했습니다. 다시 시도해주세요.
      </div>
    )
  }

  const selectedAgentData: AgentFull | null = selectedAgent
    ? agentList.find((a) => a.name === selectedAgent) || null
    : null

  const handleCreateNew = () => {
    setSelectedAgent(null)
    setIsCreating(true)
  }

  const handleSelect = (name: string | null) => {
    setSelectedAgent(name)
    setIsCreating(false)
  }

  const handleSaved = (name: string) => {
    setSelectedAgent(name)
    setIsCreating(false)
  }

  const handleDeleted = () => {
    setSelectedAgent(null)
    setIsCreating(false)
  }

  const handleCancel = () => {
    setSelectedAgent(null)
    setIsCreating(false)
  }

  return (
    <div className="flex gap-4 h-[600px] border border-border rounded-lg overflow-hidden">
      {/* Left Panel - Agent List */}
      <div className="w-72 border-r border-border bg-muted/30 flex flex-col">
        <AgentList
          agents={agentList}
          selectedAgent={selectedAgent}
          onSelect={handleSelect}
          onCreateNew={handleCreateNew}
        />
      </div>

      {/* Right Panel - Editor */}
      <div className="flex-1 bg-background">
        {isCreating || selectedAgentData ? (
          <AgentEditor
            agent={isCreating ? null : selectedAgentData}
            isNew={isCreating}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onCancel={handleCancel}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>편집할 에이전트를 선택하세요</p>
            <p className="text-sm">또는 새로 만들기</p>
          </div>
        )}
      </div>
    </div>
  )
}
